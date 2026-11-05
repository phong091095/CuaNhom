/**
 * Giao diện SQL nhỏ mà mọi repository dùng. Có hai bản cài đặt:
 * - `expoSqlite.ts` cho app (expo-sqlite);
 * - `testing/nodeSqlite.ts` cho test (node:sqlite) – chạy được trong CI, không cần máy ảo.
 */

export type SqlValue = string | number | null;

export interface RunResult {
  changes: number;
  lastInsertRowId: number;
}

export interface SqlDb {
  /** Chạy câu SQL tĩnh (có thể nhiều câu), KHÔNG gắn tham số. Chỉ dùng cho DDL/PRAGMA cố định. */
  exec(sql: string): Promise<void>;
  run(sql: string, params?: readonly SqlValue[]): Promise<RunResult>;
  getAll<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  getFirst<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
  /**
   * Giao dịch: thành công thì COMMIT, lỗi thì ROLLBACK rồi ném lại lỗi.
   * Gọi lồng nhau thì phần trong nhập vào giao dịch ngoài (không mở giao dịch mới).
   */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Tạo `transaction` hỗ trợ lồng nhau từ ba lệnh BEGIN/COMMIT/ROLLBACK. */
export function makeTransaction(
  begin: () => Promise<void>,
  commit: () => Promise<void>,
  rollback: () => Promise<void>,
): SqlDb['transaction'] {
  let depth = 0;
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (depth > 0) return fn();
    depth++;
    await begin();
    try {
      const out = await fn();
      await commit();
      return out;
    } catch (e) {
      await rollback();
      throw e;
    } finally {
      depth--;
    }
  };
}
