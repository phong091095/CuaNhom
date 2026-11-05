/**
 * Sao lưu và khôi phục (SRS FR-SET-03, 5.2): một file JSON gồm Workshop (kèm logo), Material, Project,
 * DoorItem, Quote, bản chụp mẫu cửa và phiên bản lược đồ.
 * Không gồm: nháp, nhật ký sử dụng/lỗi, cài đặt riêng của máy (khóa "device.*").
 *
 * Khôi phục = thay toàn bộ dữ liệu (trong một giao dịch, lỗi thì không đổi gì).
 * File của bản app mới hơn (lược đồ cao hơn) bị từ chối.
 */
import { BACKUP_TABLES, SCHEMA_VERSION, type BackupTable } from './schema';
import type { SqlDb, SqlValue } from './sql';

export const BACKUP_APP = 'MATADOOR';
export const BACKUP_KIND = 'sao-luu';
export const BACKUP_FORMAT = 1;

type Row = Record<string, SqlValue>;

export interface BackupFile {
  app: typeof BACKUP_APP;
  kind: typeof BACKUP_KIND;
  format: number;
  schemaVersion: number;
  appVersion: string;
  dataVersion: string;
  /** Thời điểm tạo (ms). */
  createdAt: number;
  tables: Record<BackupTable, Row[]>;
}

export interface BackupSummary {
  createdAt: number;
  appVersion: string;
  schemaVersion: number;
  projects: number;
  doors: number;
  quotes: number;
  hasLogo: boolean;
  workshopName: string;
}

/** Cột của từng bảng, lấy từ chính DB – dùng làm danh sách cho phép khi khôi phục. */
async function columnsOf(db: SqlDb, table: BackupTable): Promise<string[]> {
  const rows = await db.getAll<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map((r) => r.name);
}

export async function dumpAll(db: SqlDb, meta: { appVersion: string; dataVersion: string; createdAt: number }): Promise<BackupFile> {
  const tables = {} as Record<BackupTable, Row[]>;
  for (const t of BACKUP_TABLES) {
    const where = t === 'settings' ? " WHERE key NOT LIKE 'device.%'" : '';
    tables[t] = await db.getAll<Row>(`SELECT * FROM ${t}${where}`);
  }
  return {
    app: BACKUP_APP,
    kind: BACKUP_KIND,
    format: BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion: meta.appVersion,
    dataVersion: meta.dataVersion,
    createdAt: meta.createdAt,
    tables,
  };
}

export function serializeBackup(b: BackupFile): string {
  return JSON.stringify(b);
}

/** Tên file gợi ý: MATADOOR_saoluu_2026-11-05.json */
export function backupFileName(at: Date): string {
  const d = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
  return `MATADOOR_saoluu_${d}.json`;
}

/**
 * Nâng file sao lưu từ lược đồ cũ lên mới: BACKUP_UPGRADES[n] đưa bảng từ n − 1 lên n.
 * Hiện chỉ có lược đồ 1 nên chưa có bước nào.
 */
export const BACKUP_UPGRADES: Record<number, (tables: Record<string, Row[]>) => Record<string, Row[]>> = {};

export type ParseResult = { ok: true; backup: BackupFile; summary: BackupSummary } | { ok: false; error: string };

const NOT_BACKUP = 'File này không phải bản sao lưu MATADOOR';

/** Cột bắt buộc tối thiểu của từng bảng để dữ liệu dùng được. */
const REQUIRED: Partial<Record<BackupTable, string[]>> = {
  projects: ['id', 'name'],
  door_items: ['id', 'project_id', 'symbol', 'template_id', 'template_version', 'w', 'h', 'qty'],
  quotes: ['id', 'project_id', 'number', 'doc'],
  materials: ['code', 'grp', 'cost_price'],
  template_snapshots: ['template_id', 'version', 'json'],
};

function isRow(x: unknown): x is Row {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  return Object.values(x).every((v) => v === null || typeof v === 'string' || typeof v === 'number');
}

/** Đọc và kiểm file sao lưu; không đụng tới DB. */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: NOT_BACKUP };
  }
  if (raw === null || typeof raw !== 'object') return { ok: false, error: NOT_BACKUP };
  const f = raw as Partial<BackupFile> & { tables?: unknown };
  if (f.app !== BACKUP_APP || f.kind !== BACKUP_KIND || typeof f.schemaVersion !== 'number') return { ok: false, error: NOT_BACKUP };
  if (f.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: 'File sao lưu được tạo từ bản app mới hơn. Hãy cập nhật app rồi khôi phục lại.' };
  }
  if (f.tables === null || typeof f.tables !== 'object') return { ok: false, error: 'File sao lưu bị hỏng (thiếu dữ liệu)' };
  let tables = f.tables as Record<string, unknown>;
  for (const t of BACKUP_TABLES) {
    const list = tables[t] ?? [];
    if (!Array.isArray(list) || !list.every(isRow)) return { ok: false, error: `File sao lưu bị hỏng (bảng ${t})` };
    for (const col of REQUIRED[t] ?? []) {
      if (list.some((r) => (r as Row)[col] === undefined || (r as Row)[col] === null)) {
        return { ok: false, error: `File sao lưu bị hỏng (bảng ${t} thiếu ${col})` };
      }
    }
  }
  let rowTables = Object.fromEntries(BACKUP_TABLES.map((t) => [t, (tables[t] as Row[] | undefined) ?? []])) as Record<string, Row[]>;
  for (let v = f.schemaVersion + 1; v <= SCHEMA_VERSION; v++) {
    const up = BACKUP_UPGRADES[v];
    if (!up) return { ok: false, error: `Không nâng được file sao lưu lên lược đồ ${v}` };
    rowTables = up(rowTables);
  }
  tables = rowTables;
  // Khóa ngoại: bộ cửa và báo giá phải thuộc dự án có trong file.
  const projectIds = new Set((rowTables.projects ?? []).map((p) => p.id));
  for (const t of ['door_items', 'quotes'] as const) {
    if ((rowTables[t] ?? []).some((r) => !projectIds.has(r.project_id ?? null))) {
      return { ok: false, error: `File sao lưu bị hỏng (${t === 'door_items' ? 'bộ cửa' : 'báo giá'} không thuộc dự án nào)` };
    }
  }
  const backup: BackupFile = {
    app: BACKUP_APP,
    kind: BACKUP_KIND,
    format: typeof f.format === 'number' ? f.format : BACKUP_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    appVersion: typeof f.appVersion === 'string' ? f.appVersion : '',
    dataVersion: typeof f.dataVersion === 'string' ? f.dataVersion : '',
    createdAt: typeof f.createdAt === 'number' ? f.createdAt : 0,
    tables: rowTables as Record<BackupTable, Row[]>,
  };
  const ws = backup.tables.workshop[0];
  return {
    ok: true,
    backup,
    summary: {
      createdAt: backup.createdAt,
      appVersion: backup.appVersion,
      schemaVersion: f.schemaVersion,
      projects: backup.tables.projects.filter((p) => p.deleted_at === null || p.deleted_at === undefined).length,
      doors: backup.tables.door_items.filter((d) => d.deleted_at === null || d.deleted_at === undefined).length,
      quotes: backup.tables.quotes.length,
      hasLogo: typeof ws?.logo === 'string' && ws.logo.length > 0,
      workshopName: typeof ws?.name === 'string' ? ws.name : '',
    },
  };
}

/**
 * Thay toàn bộ dữ liệu bằng nội dung file sao lưu (đã qua parseBackup).
 * Chỉ chèn những cột có thật trong bảng (bỏ qua khóa lạ – an toàn với file bị sửa tay).
 * Giữ nháp, nhật ký và cài đặt riêng của máy.
 */
export async function replaceAll(db: SqlDb, backup: BackupFile): Promise<void> {
  await db.transaction(async () => {
    for (const t of [...BACKUP_TABLES].reverse()) {
      await db.run(t === 'settings' ? "DELETE FROM settings WHERE key NOT LIKE 'device.%'" : `DELETE FROM ${t}`);
    }
    for (const t of BACKUP_TABLES) {
      const allowed = new Set(await columnsOf(db, t));
      for (const row of backup.tables[t]) {
        if (t === 'settings' && String(row.key ?? '').startsWith('device.')) continue;
        const cols = Object.keys(row).filter((c) => allowed.has(c));
        if (cols.length === 0) continue;
        await db.run(
          `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
          cols.map((c) => row[c] ?? null),
        );
      }
    }
    // File cũ/hỏng không có dòng xưởng thì tạo lại dòng mặc định.
    await db.run('INSERT OR IGNORE INTO workshop (id) VALUES (1)');
  });
}
