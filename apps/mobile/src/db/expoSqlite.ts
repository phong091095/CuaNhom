/**
 * Adapter expo-sqlite → SqlDb. Bật WAL và khóa ngoại cho mỗi kết nối (ngoài giao dịch).
 */
import * as SQLite from 'expo-sqlite';
import { makeTransaction, type SqlDb, type SqlValue } from './sql';

export async function openExpoDatabase(name: string): Promise<SqlDb> {
  const db = await SQLite.openDatabaseAsync(name);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const p = (params?: readonly SqlValue[]) => (params ? [...params] : []);
  return {
    exec: (sql) => db.execAsync(sql),
    run: async (sql, params) => {
      const r = await db.runAsync(sql, p(params));
      return { changes: r.changes, lastInsertRowId: r.lastInsertRowId };
    },
    getAll: (sql, params) => db.getAllAsync(sql, p(params)),
    getFirst: (sql, params) => db.getFirstAsync(sql, p(params)),
    // BEGIN/COMMIT trực tiếp trên cùng kết nối: mọi truy vấn của app đi qua một chủ sở hữu (client.ts)
    // nên không có truy vấn lạ chen vào; chạy được cả trên web (withExclusiveTransactionAsync thì không).
    transaction: makeTransaction(
      () => db.execAsync('BEGIN'),
      () => db.execAsync('COMMIT'),
      () => db.execAsync('ROLLBACK'),
    ),
    close: () => db.closeAsync(),
  };
}
