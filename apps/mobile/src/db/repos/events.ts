/**
 * Nhật ký sử dụng và lỗi trên máy (ĐX-12, phục vụ SRS 10.3). Không gửi đi đâu; không vào file sao lưu.
 * Không ghi tên khách, SĐT, địa chỉ – chỉ id, loại sự kiện, thời gian, số đo.
 */
import { now } from '../clock';
import type { SqlDb } from '../sql';

export type EventType =
  | 'app_open'
  | 'project_created'
  | 'door_started'
  | 'door_saved'
  | 'quote_exported'
  | 'cut_sheet_exported'
  | 'backup_done';

export async function logEvent(
  db: SqlDb,
  type: EventType,
  data: { projectId?: string; doorId?: string; value?: number } = {},
): Promise<void> {
  await db.run('INSERT INTO events (ts, type, project_id, door_id, value) VALUES (?, ?, ?, ?, ?)', [
    now(),
    type,
    data.projectId ?? null,
    data.doorId ?? null,
    data.value ?? null,
  ]);
}

export async function listEvents(db: SqlDb, since = 0): Promise<{ ts: number; type: EventType; projectId: string | null; doorId: string | null; value: number | null }[]> {
  const rows = await db.getAll<{ ts: number; type: EventType; project_id: string | null; door_id: string | null; value: number | null }>(
    'SELECT ts, type, project_id, door_id, value FROM events WHERE ts >= ? ORDER BY ts',
    [since],
  );
  return rows.map((r) => ({ ts: r.ts, type: r.type, projectId: r.project_id, doorId: r.door_id, value: r.value }));
}

export const ERROR_LOG_KEEP = 200;

export async function logError(db: SqlDb, message: string, stack?: string, screen?: string): Promise<void> {
  await db.run('INSERT INTO error_log (ts, message, stack, screen) VALUES (?, ?, ?, ?)', [
    now(),
    message.slice(0, 2000),
    stack ? stack.slice(0, 8000) : null,
    screen ?? null,
  ]);
  await db.run('DELETE FROM error_log WHERE id NOT IN (SELECT id FROM error_log ORDER BY id DESC LIMIT ?)', [ERROR_LOG_KEEP]);
}

export async function listErrors(db: SqlDb): Promise<{ ts: number; message: string; stack: string | null; screen: string | null }[]> {
  return db.getAll('SELECT ts, message, stack, screen FROM error_log ORDER BY id DESC');
}
