/**
 * Bộ cửa trong dự án (FR-DOR-02…08; SRS 5.1 "thứ tự"). Mọi thay đổi cập nhật "ngày sửa" của dự án.
 * Chỉ lưu đầu vào; kết quả cắt/vật tư/giá luôn tính lại bằng engine (SRS 5.2).
 */
import { NotFoundError, ValidationError } from '@/domain/errors';
import { nextSymbol, normalizeSymbol, parseSymbol, validateSymbol } from '@/domain/symbols';
import type { DoorInput, DoorItem } from '@/domain/types';
import { newId, now } from '../clock';
import type { SqlDb } from '../sql';
import { touchProject } from './projects';

interface DoorRow {
  id: string;
  project_id: string;
  symbol: string;
  template_id: string;
  template_version: number;
  w: number;
  h: number;
  qty: number;
  params: string;
  glass: string;
  color: string | null;
  location: string | null;
  note: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

function parseJson<T>(s: string, fallback: T): T {
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function toDoor(r: DoorRow): DoorItem {
  return {
    id: r.id,
    projectId: r.project_id,
    symbol: r.symbol,
    templateId: r.template_id,
    templateVersion: r.template_version,
    W: r.w,
    H: r.h,
    qty: r.qty,
    params: parseJson<Record<string, number>>(r.params, {}),
    glass: parseJson<Record<string, string>>(r.glass, {}),
    color: r.color,
    location: r.location,
    note: r.note,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

const TEXT_MAX = 200;

function optText(v: string | null | undefined, field: string, label: string): string | null {
  if (v === null || v === undefined) return null;
  const s = v.trim();
  if (s.length > TEXT_MAX) throw new ValidationError(field, `${label} tối đa ${TEXT_MAX} ký tự`);
  return s === '' ? null : s;
}

/** Kiểm đầu vào cơ bản; kiểm tra kỹ thuật theo mẫu (BR-11) do engine làm ở màn nhập. */
function checkInput(input: DoorInput): void {
  if (!(Number.isFinite(input.W) && input.W > 0)) throw new ValidationError('W', 'Nhập chiều rộng lớn hơn 0');
  if (!(Number.isFinite(input.H) && input.H > 0)) throw new ValidationError('H', 'Nhập chiều cao lớn hơn 0');
  if (!Number.isInteger(input.qty) || input.qty < 1) throw new ValidationError('qty', 'Số bộ phải là số nguyên từ 1 trở lên');
  if (!input.templateId) throw new ValidationError('templateId', 'Chưa chọn mẫu cửa');
}

export async function listDoors(db: SqlDb, projectId: string): Promise<DoorItem[]> {
  const rows = await db.getAll<DoorRow>(
    'SELECT * FROM door_items WHERE project_id = ? AND deleted_at IS NULL ORDER BY sort_order, created_at',
    [projectId],
  );
  return rows.map(toDoor);
}

export async function getDoor(db: SqlDb, id: string): Promise<DoorItem | null> {
  const r = await db.getFirst<DoorRow>('SELECT * FROM door_items WHERE id = ?', [id]);
  return r ? toDoor(r) : null;
}

async function usedSymbols(db: SqlDb, projectId: string, exceptId?: string): Promise<string[]> {
  const rows = await db.getAll<{ symbol: string }>(
    'SELECT symbol FROM door_items WHERE project_id = ? AND deleted_at IS NULL AND id != ?',
    [projectId, exceptId ?? ''],
  );
  return rows.map((r) => r.symbol);
}

/** Ký hiệu gợi ý cho bộ cửa mới: tiền tố của mẫu + (số lớn nhất + 1), tính cả bộ trong thùng rác. */
export async function suggestSymbol(db: SqlDb, projectId: string, prefix: string): Promise<string> {
  const rows = await db.getAll<{ symbol: string }>('SELECT symbol FROM door_items WHERE project_id = ?', [projectId]);
  return nextSymbol(prefix, rows.map((r) => r.symbol));
}

async function assertProjectLive(db: SqlDb, projectId: string): Promise<void> {
  const p = await db.getFirst<{ deleted_at: number | null }>('SELECT deleted_at FROM projects WHERE id = ?', [projectId]);
  if (!p || p.deleted_at !== null) throw new NotFoundError('dự án');
}

export async function createDoor(db: SqlDb, projectId: string, input: DoorInput): Promise<DoorItem> {
  checkInput(input);
  return db.transaction(async () => {
    await assertProjectLive(db, projectId);
    const err = validateSymbol(input.symbol, await usedSymbols(db, projectId));
    if (err) throw new ValidationError('symbol', err);
    const max = await db.getFirst<{ m: number | null }>('SELECT MAX(sort_order) AS m FROM door_items WHERE project_id = ?', [projectId]);
    const t = now();
    const id = newId();
    await db.run(
      `INSERT INTO door_items (id, project_id, symbol, template_id, template_version, w, h, qty, params, glass, color, location, note,
         sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        projectId,
        input.symbol.trim(),
        input.templateId,
        input.templateVersion,
        input.W,
        input.H,
        input.qty,
        JSON.stringify(input.params ?? {}),
        JSON.stringify(input.glass ?? {}),
        optText(input.color, 'color', 'Màu nhôm'),
        optText(input.location, 'location', 'Vị trí'),
        optText(input.note, 'note', 'Ghi chú'),
        (max?.m ?? 0) + 1,
        t,
        t,
      ],
    );
    await touchProject(db, projectId);
    return (await getDoor(db, id))!;
  });
}

export async function updateDoor(db: SqlDb, id: string, input: DoorInput): Promise<DoorItem> {
  checkInput(input);
  return db.transaction(async () => {
    const cur = await getDoor(db, id);
    if (!cur || cur.deletedAt !== null) throw new NotFoundError('bộ cửa');
    const err = validateSymbol(input.symbol, await usedSymbols(db, cur.projectId, id));
    if (err) throw new ValidationError('symbol', err);
    await db.run(
      `UPDATE door_items SET symbol = ?, template_id = ?, template_version = ?, w = ?, h = ?, qty = ?, params = ?, glass = ?,
         color = ?, location = ?, note = ?, updated_at = ? WHERE id = ?`,
      [
        input.symbol.trim(),
        input.templateId,
        input.templateVersion,
        input.W,
        input.H,
        input.qty,
        JSON.stringify(input.params ?? {}),
        JSON.stringify(input.glass ?? {}),
        optText(input.color, 'color', 'Màu nhôm'),
        optText(input.location, 'location', 'Vị trí'),
        optText(input.note, 'note', 'Ghi chú'),
        now(),
        id,
      ],
    );
    await touchProject(db, cur.projectId);
    return (await getDoor(db, id))!;
  });
}

/** Xóa mềm một hoặc nhiều bộ cửa (D1 chọn nhiều). */
export async function softDeleteDoors(db: SqlDb, ids: readonly string[]): Promise<number> {
  if (ids.length === 0) return 0;
  return db.transaction(async () => {
    const t = now();
    let n = 0;
    const projects = new Set<string>();
    for (const id of ids) {
      const d = await getDoor(db, id);
      if (!d || d.deletedAt !== null) continue;
      await db.run('UPDATE door_items SET deleted_at = ? WHERE id = ?', [t, id]);
      projects.add(d.projectId);
      n++;
    }
    for (const p of projects) await touchProject(db, p);
    return n;
  });
}

/**
 * Khôi phục bộ cửa. Nếu ký hiệu cũ đã có bộ khác dùng thì đổi sang ký hiệu kế tiếp, trả về ký hiệu mới.
 * Dự án của nó đang ở thùng rác thì phải khôi phục dự án trước.
 */
export async function restoreDoor(db: SqlDb, id: string): Promise<{ symbol: string; renamed: boolean }> {
  return db.transaction(async () => {
    const d = await getDoor(db, id);
    if (!d || d.deletedAt === null) throw new NotFoundError('bộ cửa đã xóa');
    await assertProjectLive(db, d.projectId);
    const used = await usedSymbols(db, d.projectId, id);
    let symbol = d.symbol;
    let renamed = false;
    if (used.some((u) => normalizeSymbol(u) === normalizeSymbol(symbol))) {
      const all = await db.getAll<{ symbol: string }>('SELECT symbol FROM door_items WHERE project_id = ?', [d.projectId]);
      symbol = nextSymbol(parseSymbol(d.symbol).prefix || 'D', all.map((r) => r.symbol));
      renamed = true;
    }
    const max = await db.getFirst<{ m: number | null }>(
      'SELECT MAX(sort_order) AS m FROM door_items WHERE project_id = ? AND deleted_at IS NULL',
      [d.projectId],
    );
    // Về đúng chỗ cũ nếu còn hợp lệ, không thì xuống cuối.
    const order = d.sortOrder <= (max?.m ?? 0) + 1 ? d.sortOrder : (max?.m ?? 0) + 1;
    await db.run('UPDATE door_items SET deleted_at = NULL, symbol = ?, sort_order = ?, updated_at = ? WHERE id = ?', [symbol, order, now(), id]);
    await touchProject(db, d.projectId);
    return { symbol, renamed };
  });
}

/** Nhân bản bộ cửa: đặt ngay sau bộ gốc, ký hiệu kế tiếp cùng tiền tố. */
export async function duplicateDoor(db: SqlDb, id: string): Promise<DoorItem> {
  return db.transaction(async () => {
    const d = await getDoor(db, id);
    if (!d || d.deletedAt !== null) throw new NotFoundError('bộ cửa');
    const all = await db.getAll<{ symbol: string }>('SELECT symbol FROM door_items WHERE project_id = ?', [d.projectId]);
    const symbol = nextSymbol(parseSymbol(d.symbol).prefix || 'D', all.map((r) => r.symbol));
    await db.run('UPDATE door_items SET sort_order = sort_order + 1 WHERE project_id = ? AND sort_order > ?', [d.projectId, d.sortOrder]);
    const t = now();
    const nid = newId();
    await db.run(
      `INSERT INTO door_items (id, project_id, symbol, template_id, template_version, w, h, qty, params, glass, color, location, note,
         sort_order, created_at, updated_at)
       SELECT ?, project_id, ?, template_id, template_version, w, h, qty, params, glass, color, location, note, ?, ?, ?
       FROM door_items WHERE id = ?`,
      [nid, symbol, d.sortOrder + 1, t, t, id],
    );
    await touchProject(db, d.projectId);
    return (await getDoor(db, nid))!;
  });
}

/** Sắp xếp lại: `orderedIds` là toàn bộ bộ cửa đang có của dự án theo thứ tự mới. */
export async function reorderDoors(db: SqlDb, projectId: string, orderedIds: readonly string[]): Promise<void> {
  await db.transaction(async () => {
    const live = (await listDoors(db, projectId)).map((d) => d.id);
    const same = live.length === orderedIds.length && live.every((id) => orderedIds.includes(id));
    if (!same) throw new ValidationError('order', 'Danh sách sắp xếp không khớp các bộ cửa của dự án');
    let i = 1;
    for (const id of orderedIds) await db.run('UPDATE door_items SET sort_order = ? WHERE id = ?', [i++, id]);
    await touchProject(db, projectId);
  });
}

/** Chuyển một bộ cửa lên/xuống một bậc (nút ↑ ↓ ở chế độ Sắp xếp). */
export async function moveDoor(db: SqlDb, id: string, direction: -1 | 1): Promise<void> {
  const d = await getDoor(db, id);
  if (!d || d.deletedAt !== null) throw new NotFoundError('bộ cửa');
  const ids = (await listDoors(db, d.projectId)).map((x) => x.id);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  await reorderDoors(db, d.projectId, ids);
}
