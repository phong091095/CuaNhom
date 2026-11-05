/**
 * Báo giá đã xuất (FR-MAT-03): lưu bản chụp, không đổi theo bảng giá mới.
 * Xóa báo giá là xóa ngay sau khi xác nhận (Q2 – xuất lại được).
 */
import { formatQuoteNumber } from '@matadoor/engine';
import { NotFoundError, ValidationError } from '@/domain/errors';
import type { QuoteAudience, QuoteMode, StoredQuote } from '@/domain/types';
import { newId, now } from '../clock';
import type { SqlDb } from '../sql';
import { touchProject } from './projects';
import { getSetting, setSetting, SETTING_KEYS } from './settings';

interface QuoteRow {
  id: string;
  project_id: string;
  number: string;
  mode: QuoteMode;
  audience: QuoteAudience;
  total: number;
  doc: string;
  file_name: string | null;
  created_at: number;
}

function toQuote(r: QuoteRow): StoredQuote {
  let doc: unknown = null;
  try {
    doc = JSON.parse(r.doc);
  } catch {
    doc = null;
  }
  return {
    id: r.id,
    projectId: r.project_id,
    number: r.number,
    mode: r.mode,
    audience: r.audience,
    total: r.total,
    doc,
    fileName: r.file_name,
    createdAt: r.created_at,
  };
}

/** Cấp số báo giá kế tiếp trong tháng: BG-YYMM-001, 002… (theo giờ máy). */
export async function nextQuoteNumber(db: SqlDb, at: Date = new Date(now())): Promise<string> {
  return db.transaction(async () => {
    const key = `${SETTING_KEYS.quoteSeqPrefix}${formatQuoteNumber(at, 0).slice(3, 7)}`;
    const seq = Number((await getSetting(db, key)) ?? '0') + 1;
    await setSetting(db, key, String(seq));
    return formatQuoteNumber(at, seq);
  });
}

export interface NewQuote {
  projectId: string;
  mode: QuoteMode;
  audience: QuoteAudience;
  total: number;
  doc: unknown;
  fileName?: string | null;
  /** Đã cấp sẵn số (lúc dựng tài liệu) thì truyền vào; không thì cấp mới. */
  number?: string;
}

/** Lưu bản chụp – chỉ gọi khi đã tạo file thành công (KE_HOACH_GIAO_DIEN G2). */
export async function saveQuote(db: SqlDb, q: NewQuote): Promise<StoredQuote> {
  if (!Number.isFinite(q.total) || q.total < 0) throw new ValidationError('total', 'Tổng tiền không hợp lệ');
  return db.transaction(async () => {
    const p = await db.getFirst<{ id: string }>('SELECT id FROM projects WHERE id = ? AND deleted_at IS NULL', [q.projectId]);
    if (!p) throw new NotFoundError('dự án');
    const id = newId();
    const number = q.number ?? (await nextQuoteNumber(db));
    await db.run(
      'INSERT INTO quotes (id, project_id, number, mode, audience, total, doc, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, q.projectId, number, q.mode, q.audience, q.total, JSON.stringify(q.doc), q.fileName ?? null, now()],
    );
    await touchProject(db, q.projectId);
    return (await getQuote(db, id))!;
  });
}

export async function getQuote(db: SqlDb, id: string): Promise<StoredQuote | null> {
  const r = await db.getFirst<QuoteRow>('SELECT * FROM quotes WHERE id = ?', [id]);
  return r ? toQuote(r) : null;
}

/** Lịch sử báo giá của dự án, mới nhất trước. */
export async function listQuotes(db: SqlDb, projectId: string): Promise<StoredQuote[]> {
  const rows = await db.getAll<QuoteRow>('SELECT * FROM quotes WHERE project_id = ? ORDER BY created_at DESC, number DESC', [projectId]);
  return rows.map(toQuote);
}

export async function deleteQuote(db: SqlDb, id: string): Promise<void> {
  const r = await db.run('DELETE FROM quotes WHERE id = ?', [id]);
  if (r.changes === 0) throw new NotFoundError('báo giá');
}
