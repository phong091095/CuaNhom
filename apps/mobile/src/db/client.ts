/**
 * Chủ sở hữu duy nhất của kết nối DB trong app. Mọi truy vấn đi qua getDb(), nên giao dịch
 * BEGIN/COMMIT trên cùng kết nối không bị truy vấn lạ chen vào.
 */
import { openExpoDatabase } from './expoSqlite';
import { initDatabase, type InitReport } from './init';
import { DATABASE_NAME } from './schema';
import type { SqlDb } from './sql';

let ready: Promise<{ db: SqlDb; report: InitReport }> | null = null;

/** Mở và chuẩn bị DB (một lần); lỗi thì lần gọi sau thử lại. */
export function openAppDatabase(): Promise<{ db: SqlDb; report: InitReport }> {
  if (!ready) {
    ready = (async () => {
      const db = await openExpoDatabase(DATABASE_NAME);
      const report = await initDatabase(db);
      return { db, report };
    })();
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

export async function getDb(): Promise<SqlDb> {
  return (await openAppDatabase()).db;
}

/** Chỉ dùng trong test: thay DB bằng DB trong bộ nhớ đã khởi tạo. */
export function setDbForTests(db: SqlDb, report?: InitReport): void {
  ready = Promise.resolve({
    db,
    report: report ?? {
      migratedFrom: 0,
      materialsAdded: 0,
      materialsUpdated: 0,
      snapshotsAdded: 0,
      snapshotConflicts: [],
      purged: { projects: 0, doors: 0, events: 0 },
    },
  });
}
