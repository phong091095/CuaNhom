/** Nháp form (NFR-REL-01: tắt app đột ngột không mất dữ liệu đã nhập). Không vào file sao lưu. */
import { now } from '../clock';
import type { SqlDb } from '../sql';

export async function saveDraft(db: SqlDb, key: string, value: unknown): Promise<void> {
  await db.run(
    'INSERT INTO drafts (key, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at',
    [key, JSON.stringify(value), now()],
  );
}

export async function loadDraft<T>(db: SqlDb, key: string): Promise<{ value: T; updatedAt: number } | null> {
  const r = await db.getFirst<{ json: string; updated_at: number }>('SELECT json, updated_at FROM drafts WHERE key = ?', [key]);
  if (!r) return null;
  try {
    return { value: JSON.parse(r.json) as T, updatedAt: r.updated_at };
  } catch {
    return null;
  }
}

export async function clearDraft(db: SqlDb, key: string): Promise<void> {
  await db.run('DELETE FROM drafts WHERE key = ?', [key]);
}
