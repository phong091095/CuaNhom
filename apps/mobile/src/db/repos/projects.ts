/**
 * Dự án (FR-PRJ-01…04). Xóa là xóa mềm 30 ngày (Q2), có khôi phục; nhân bản không chép báo giá.
 */
import { matchesSearch, type CutSettings } from '@matadoor/engine';
import { NotFoundError, ValidationError } from '@/domain/errors';
import { PROJECT_STATUSES, type Project, type ProjectInput, type ProjectListItem, type ProjectStatus } from '@/domain/types';
import { newId, now } from '../clock';
import type { SqlDb } from '../sql';
import { getWorkshop } from './workshop';

export interface ProjectRow {
  id: string;
  name: string;
  customer: string;
  phone: string;
  address: string;
  status: ProjectStatus;
  bar_length: number;
  kerf: number;
  trim: number;
  op2_price: number | null;
  note: string;
  is_sample: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export function toProject(r: ProjectRow): Project {
  return {
    id: r.id,
    name: r.name,
    customer: r.customer,
    phone: r.phone,
    address: r.address,
    status: r.status,
    cut: { barLength: r.bar_length, kerf: r.kerf, trim: r.trim },
    op2Price: r.op2_price,
    note: r.note,
    isSample: r.is_sample === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

export const NAME_MAX = 120;

function cleanInput(input: ProjectInput): Required<ProjectInput> {
  const name = input.name.trim();
  if (name === '') throw new ValidationError('name', 'Nhập tên công trình');
  if (name.length > NAME_MAX) throw new ValidationError('name', `Tên công trình tối đa ${NAME_MAX} ký tự`);
  return {
    name,
    customer: (input.customer ?? '').trim(),
    phone: (input.phone ?? '').trim(),
    address: (input.address ?? '').trim(),
    note: (input.note ?? '').trim(),
  };
}

/** Gợi ý (không chặn lưu): SĐT Việt Nam 10 số bắt đầu bằng 0, hoặc +84. */
export function phoneHint(phone: string): string | null {
  const digits = phone.replace(/[\s.-]/g, '');
  if (digits === '') return null;
  return /^(0\d{9}|\+84\d{9})$/.test(digits) ? null : 'Số điện thoại thường có 10 số, bắt đầu bằng 0';
}

export async function createProject(db: SqlDb, input: ProjectInput, opts: { isSample?: boolean } = {}): Promise<Project> {
  const p = cleanInput(input);
  const ws = await getWorkshop(db);
  const t = now();
  const id = newId();
  await db.run(
    `INSERT INTO projects (id, name, customer, phone, address, status, bar_length, kerf, trim, op2_price, note, is_sample, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'bao_gia', ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [id, p.name, p.customer, p.phone, p.address, ws.defaultCut.barLength, ws.defaultCut.kerf, ws.defaultCut.trim, p.note, opts.isSample ? 1 : 0, t, t],
  );
  return (await getProject(db, id))!;
}

/** Lấy dự án (kể cả đã xóa mềm). */
export async function getProject(db: SqlDb, id: string): Promise<Project | null> {
  const r = await db.getFirst<ProjectRow>('SELECT * FROM projects WHERE id = ?', [id]);
  return r ? toProject(r) : null;
}

/**
 * Danh sách dự án chưa xóa, mới sửa trước (FR-PRJ-02). Tìm theo tên công trình, khách, SĐT, địa chỉ –
 * không phân biệt dấu (lọc trong JS vì LIKE của SQLite không bỏ dấu tiếng Việt).
 */
export async function listProjects(db: SqlDb, query = ''): Promise<ProjectListItem[]> {
  const rows = await db.getAll<ProjectRow & { door_count: number; set_count: number | null }>(
    `SELECT p.*,
       (SELECT COUNT(*) FROM door_items d WHERE d.project_id = p.id AND d.deleted_at IS NULL) AS door_count,
       (SELECT SUM(d.qty) FROM door_items d WHERE d.project_id = p.id AND d.deleted_at IS NULL) AS set_count
     FROM projects p WHERE p.deleted_at IS NULL ORDER BY p.updated_at DESC, p.created_at DESC`,
  );
  return rows
    .map((r) => ({ ...toProject(r), doorCount: r.door_count, setCount: r.set_count ?? 0 }))
    .filter((p) => matchesSearch(query, p.name, p.customer, p.phone, p.address));
}

export interface ProjectPatch extends Partial<ProjectInput> {
  status?: ProjectStatus;
  cut?: CutSettings;
  op2Price?: number | null;
}

export async function updateProject(db: SqlDb, id: string, patch: ProjectPatch): Promise<Project> {
  const cur = await getProject(db, id);
  if (!cur || cur.deletedAt !== null) throw new NotFoundError('dự án');
  const base = cleanInput({
    name: patch.name ?? cur.name,
    customer: patch.customer ?? cur.customer,
    phone: patch.phone ?? cur.phone,
    address: patch.address ?? cur.address,
    note: patch.note ?? cur.note,
  });
  const status = patch.status ?? cur.status;
  if (!PROJECT_STATUSES.includes(status)) throw new ValidationError('status', 'Trạng thái không hợp lệ');
  const cut = patch.cut ?? cur.cut;
  const op2 = patch.op2Price === undefined ? cur.op2Price : patch.op2Price;
  if (op2 !== null && !(op2 > 0)) throw new ValidationError('op2Price', 'Đơn giá phải lớn hơn 0');
  await db.run(
    `UPDATE projects SET name = ?, customer = ?, phone = ?, address = ?, note = ?, status = ?, bar_length = ?, kerf = ?, trim = ?,
       op2_price = ?, updated_at = ? WHERE id = ?`,
    [base.name, base.customer, base.phone, base.address, base.note, status, cut.barLength, cut.kerf, cut.trim, op2, now(), id],
  );
  return (await getProject(db, id))!;
}

/** Đánh dấu dự án vừa có thay đổi (bộ cửa, báo giá) để B1 xếp lên đầu (FR-PRJ-02). */
export async function touchProject(db: SqlDb, id: string): Promise<void> {
  await db.run('UPDATE projects SET updated_at = ? WHERE id = ?', [now(), id]);
}

export async function softDeleteProject(db: SqlDb, id: string): Promise<void> {
  const r = await db.run('UPDATE projects SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL', [now(), id]);
  if (r.changes === 0) throw new NotFoundError('dự án');
}

/** Khôi phục dự án; các bộ cửa bị xóa riêng từ trước vẫn nằm trong thùng rác. */
export async function restoreProject(db: SqlDb, id: string): Promise<void> {
  const r = await db.run('UPDATE projects SET deleted_at = NULL, updated_at = ? WHERE id = ? AND deleted_at IS NOT NULL', [now(), id]);
  if (r.changes === 0) throw new NotFoundError('dự án đã xóa');
}

/** Xóa hẳn (kèm bộ cửa, báo giá) – từ "Đã xóa gần đây". */
export async function hardDeleteProject(db: SqlDb, id: string): Promise<void> {
  await db.run('DELETE FROM projects WHERE id = ?', [id]);
}

/**
 * Nhân bản (FR-PRJ-03): chép bộ cửa đang có (giữ phiên bản mẫu, tham số, kính, màu, vị trí),
 * tham số cắt, đơn giá OP2; không chép báo giá đã xuất; trạng thái về "Báo giá"; tên thêm "(bản sao)".
 */
export async function duplicateProject(db: SqlDb, id: string): Promise<Project> {
  const src = await getProject(db, id);
  if (!src || src.deletedAt !== null) throw new NotFoundError('dự án');
  return db.transaction(async () => {
    const t = now();
    const newIdValue = newId();
    const name = `${src.name} (bản sao)`.slice(0, NAME_MAX);
    await db.run(
      `INSERT INTO projects (id, name, customer, phone, address, status, bar_length, kerf, trim, op2_price, note, is_sample, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'bao_gia', ?, ?, ?, ?, ?, 0, ?, ?)`,
      [newIdValue, name, src.customer, src.phone, src.address, src.cut.barLength, src.cut.kerf, src.cut.trim, src.op2Price, src.note, t, t],
    );
    const doors = await db.getAll<{ id: string }>(
      'SELECT id FROM door_items WHERE project_id = ? AND deleted_at IS NULL ORDER BY sort_order',
      [id],
    );
    let order = 1;
    for (const d of doors) {
      await db.run(
        `INSERT INTO door_items (id, project_id, symbol, template_id, template_version, w, h, qty, params, glass, color, location, note,
           sort_order, created_at, updated_at)
         SELECT ?, ?, symbol, template_id, template_version, w, h, qty, params, glass, color, location, note, ?, ?, ?
         FROM door_items WHERE id = ?`,
        [newId(), newIdValue, order++, t, t, d.id],
      );
    }
    return (await getProject(db, newIdValue))!;
  });
}
