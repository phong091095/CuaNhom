/**
 * Cài đặt dạng khóa–giá trị. Khóa bắt đầu bằng "device." là của riêng máy (không vào file sao lưu).
 */
import type { SqlDb } from '../sql';

export const SETTING_KEYS = {
  themeMode: 'themeMode',
  lastBackupAt: 'device.lastBackupAt',
  dataVersionSeen: 'device.dataVersionSeen',
  quoteSeqPrefix: 'quoteSeq.',
} as const;

export async function getSetting(db: SqlDb, key: string): Promise<string | null> {
  const r = await db.getFirst<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return r?.value ?? null;
}

export async function setSetting(db: SqlDb, key: string, value: string): Promise<void> {
  await db.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    key,
    value,
  ]);
}

export async function deleteSetting(db: SqlDb, key: string): Promise<void> {
  await db.run('DELETE FROM settings WHERE key = ?', [key]);
}
