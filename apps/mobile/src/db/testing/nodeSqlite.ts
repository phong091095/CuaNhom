/**
 * Adapter node:sqlite → SqlDb, CHỈ dùng trong test (Jest, môi trường node).
 * Lấy module qua process.getBuiltinModule để Jest không phải tự phân giải "node:sqlite".
 */
import { makeTransaction, type SqlDb, type SqlValue } from '../sql';

interface NodeStatement {
  run(...params: SqlValue[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  all(...params: SqlValue[]): unknown[];
  get(...params: SqlValue[]): unknown;
}
interface NodeDatabase {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
}

export function openMemoryDatabase(path = ':memory:'): SqlDb {
  const mod = (process as unknown as { getBuiltinModule(id: string): { DatabaseSync: new (p: string) => NodeDatabase } }).getBuiltinModule(
    'node:sqlite',
  );
  const db = new mod.DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;
  return {
    exec: async (sql) => db.exec(sql),
    run: async (sql, params = []) => {
      const r = db.prepare(sql).run(...params);
      return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
    },
    getAll: async <T>(sql: string, params: readonly SqlValue[] = []) => db.prepare(sql).all(...params).map((r) => plain<T>(r)),
    getFirst: async <T>(sql: string, params: readonly SqlValue[] = []) => {
      const r = db.prepare(sql).get(...params);
      return r === undefined ? null : plain<T>(r);
    },
    transaction: makeTransaction(
      async () => db.exec('BEGIN'),
      async () => db.exec('COMMIT'),
      async () => db.exec('ROLLBACK'),
    ),
    close: async () => db.close(),
  };
}
