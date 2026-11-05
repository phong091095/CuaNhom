/**
 * Lược đồ dữ liệu người dùng (SRS mục 5) và migration.
 *
 * Quy tắc đổi lược đồ (KE_HOACH_TRIEN_KHAI mục 1):
 *  1. Thêm một phần tử vào MIGRATIONS, tăng SCHEMA_VERSION.
 *  2. Thêm hàm nâng cấp file sao lưu cũ ở backup.ts (BACKUP_UPGRADES) nếu cột/bảng đổi.
 *  3. Thêm test nâng cấp từ DB bản trước và khôi phục file sao lưu bản trước.
 */
import type { SqlDb } from './sql';

export const SCHEMA_VERSION = 1;

/** Tên file DB trên máy. */
export const DATABASE_NAME = 'matadoor.db';

const V1 = `
CREATE TABLE workshop (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  logo TEXT,
  quote_note TEXT NOT NULL DEFAULT '',
  vat_enabled INTEGER NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 0.08,
  bar_length REAL NOT NULL DEFAULT 5800,
  kerf REAL NOT NULL DEFAULT 4,
  trim REAL NOT NULL DEFAULT 10,
  factor_nhom REAL NOT NULL DEFAULT 1.1,
  factor_kinh REAL NOT NULL DEFAULT 1.1,
  factor_phukien REAL NOT NULL DEFAULT 1.1,
  factor_nhancong REAL NOT NULL DEFAULT 1.1,
  updated_at INTEGER NOT NULL DEFAULT 0
);
INSERT INTO workshop (id) VALUES (1);

CREATE TABLE settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE materials (
  code TEXT PRIMARY KEY NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('bundled', 'user')),
  name TEXT NOT NULL,
  grp TEXT NOT NULL CHECK (grp IN ('nhom', 'kinh', 'phukien', 'nhancong')),
  unit TEXT NOT NULL,
  kg_per_m REAL,
  bar_length_mm REAL,
  thickness_mm REAL,
  cost_price REAL NOT NULL,
  sale_price REAL,
  price_status TEXT,
  price_edited INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  customer TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'bao_gia' CHECK (status IN ('bao_gia', 'dat_coc', 'gia_cong', 'da_lap')),
  bar_length REAL NOT NULL,
  kerf REAL NOT NULL,
  trim REAL NOT NULL,
  op2_price REAL,
  note TEXT NOT NULL DEFAULT '',
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX projects_live ON projects (deleted_at, updated_at);

CREATE TABLE door_items (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  template_id TEXT NOT NULL,
  template_version INTEGER NOT NULL,
  w REAL NOT NULL,
  h REAL NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 1),
  params TEXT NOT NULL DEFAULT '{}',
  glass TEXT NOT NULL DEFAULT '{}',
  color TEXT,
  location TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE INDEX door_items_project ON door_items (project_id, deleted_at, sort_order);

CREATE TABLE quotes (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('op1', 'op2')),
  audience TEXT NOT NULL CHECK (audience IN ('khach', 'noi_bo')),
  total REAL NOT NULL,
  doc TEXT NOT NULL,
  file_name TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX quotes_project ON quotes (project_id, created_at);

CREATE TABLE template_snapshots (
  template_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  json TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  PRIMARY KEY (template_id, version)
);

CREATE TABLE drafts (
  key TEXT PRIMARY KEY NOT NULL,
  json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  project_id TEXT,
  door_id TEXT,
  value REAL
);
CREATE INDEX events_ts ON events (ts);

CREATE TABLE error_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  screen TEXT
);
`;

/** MIGRATIONS[n] đưa DB từ phiên bản n − 1 lên n. */
export const MIGRATIONS: Record<number, string> = {
  1: V1,
};

export class NewerSchemaError extends Error {
  constructor(readonly found: number) {
    super(`Dữ liệu trên máy thuộc bản app mới hơn (lược đồ ${found}, app hỗ trợ ${SCHEMA_VERSION}). Hãy cập nhật app.`);
    this.name = 'NewerSchemaError';
  }
}

export async function getSchemaVersion(db: SqlDb): Promise<number> {
  const row = await db.getFirst<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/**
 * Đưa DB lên SCHEMA_VERSION. Mỗi bước nâng cấp và việc ghi user_version nằm trong cùng giao dịch,
 * lỗi thì không đổi gì. DB của bản app mới hơn thì từ chối (không đụng dữ liệu).
 */
export async function migrate(db: SqlDb, target = SCHEMA_VERSION): Promise<{ from: number; to: number }> {
  const from = await getSchemaVersion(db);
  if (from > SCHEMA_VERSION) throw new NewerSchemaError(from);
  for (let v = from + 1; v <= target; v++) {
    const sql = MIGRATIONS[v];
    if (!sql) throw new Error(`Thiếu migration lên phiên bản ${v}`);
    await db.transaction(async () => {
      await db.exec(sql);
      await db.exec(`PRAGMA user_version = ${v}`);
    });
  }
  return { from, to: Math.max(from, target) };
}

/** Các bảng thuộc file sao lưu (SRS 5.2), theo thứ tự chèn khi khôi phục (bảng cha trước). */
export const BACKUP_TABLES = [
  'workshop',
  'settings',
  'materials',
  'template_snapshots',
  'projects',
  'door_items',
  'quotes',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];
