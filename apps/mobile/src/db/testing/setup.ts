/**
 * Tạo DB trong bộ nhớ đã khởi tạo cho test, với đồng hồ và id cố định để kết quả lặp lại được.
 */
import { DAY_MS, setClock, setIdGenerator } from '../clock';
import { initDatabase } from '../init';
import type { SqlDb } from '../sql';
import { openMemoryDatabase } from './nodeSqlite';

/** 05/11/2026 08:00 giờ máy. */
export const T0 = new Date(2026, 10, 5, 8, 0, 0).getTime();

export interface TestClock {
  now: () => number;
  /** Tiến đồng hồ thêm `ms`. */
  advance: (ms: number) => void;
  advanceDays: (d: number) => void;
}

export function installTestClock(start = T0): TestClock {
  let t = start;
  let seq = 0;
  setClock(() => t);
  setIdGenerator(() => `id${String(++seq).padStart(4, '0')}`);
  return {
    now: () => t,
    advance: (ms) => {
      t += ms;
    },
    advanceDays: (d) => {
      t += d * DAY_MS;
    },
  };
}

export async function freshDb(): Promise<SqlDb> {
  const db = openMemoryDatabase();
  await initDatabase(db);
  return db;
}
