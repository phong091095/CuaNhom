/**
 * "Đã xóa gần đây" (C1b) và tự xóa hẳn sau 30 ngày (Q2). Nhật ký sử dụng giữ 90 ngày.
 */
import type { TrashItem } from '@/domain/types';
import { DAY_MS, now } from '../clock';
import type { SqlDb } from '../sql';

export const TRASH_DAYS = 30;
export const EVENTS_DAYS = 90;

/** Dự án đã xóa, và bộ cửa đã xóa riêng (dự án của nó còn). Mới xóa trước. */
export async function listTrash(db: SqlDb): Promise<TrashItem[]> {
  const projects = await db.getAll<{ id: string; name: string; deleted_at: number }>(
    'SELECT id, name, deleted_at FROM projects WHERE deleted_at IS NOT NULL',
  );
  const doors = await db.getAll<{ id: string; symbol: string; project_id: string; name: string; deleted_at: number }>(
    `SELECT d.id, d.symbol, d.project_id, p.name, d.deleted_at FROM door_items d JOIN projects p ON p.id = d.project_id
     WHERE d.deleted_at IS NOT NULL AND p.deleted_at IS NULL`,
  );
  const items: TrashItem[] = [
    ...projects.map((p) => ({
      kind: 'project' as const,
      id: p.id,
      title: p.name,
      projectId: p.id,
      deletedAt: p.deleted_at,
      purgeAt: p.deleted_at + TRASH_DAYS * DAY_MS,
    })),
    ...doors.map((d) => ({
      kind: 'door' as const,
      id: d.id,
      title: `${d.symbol} · ${d.name}`,
      projectId: d.project_id,
      deletedAt: d.deleted_at,
      purgeAt: d.deleted_at + TRASH_DAYS * DAY_MS,
    })),
  ];
  return items.sort((a, b) => b.deletedAt - a.deletedAt);
}

/** Số ngày còn lại trước khi tự xóa hẳn (làm tròn lên, tối thiểu 0). */
export function daysLeft(item: Pick<TrashItem, 'purgeAt'>, at = now()): number {
  return Math.max(0, Math.ceil((item.purgeAt - at) / DAY_MS));
}

/** Xóa hẳn mục quá hạn. Chạy mỗi lần mở app. */
export async function purgeExpired(db: SqlDb, at = now()): Promise<{ projects: number; doors: number; events: number }> {
  const cutoff = at - TRASH_DAYS * DAY_MS;
  return db.transaction(async () => {
    const p = await db.run('DELETE FROM projects WHERE deleted_at IS NOT NULL AND deleted_at <= ?', [cutoff]);
    const d = await db.run('DELETE FROM door_items WHERE deleted_at IS NOT NULL AND deleted_at <= ?', [cutoff]);
    const e = await db.run('DELETE FROM events WHERE ts <= ?', [at - EVENTS_DAYS * DAY_MS]);
    return { projects: p.changes, doors: d.changes, events: e.changes };
  });
}

/** Xóa hẳn một bộ cửa trong thùng rác. */
export async function hardDeleteDoor(db: SqlDb, id: string): Promise<void> {
  await db.run('DELETE FROM door_items WHERE id = ? AND deleted_at IS NOT NULL', [id]);
}
