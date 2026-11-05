/** @jest-environment node */
import { MATERIALS, TEMPLATES } from '@matadoor/data';
import { getSchemaVersion, migrate, MIGRATIONS, NewerSchemaError, SCHEMA_VERSION } from '../schema';
import { initDatabase } from '../init';
import { openMemoryDatabase } from '../testing/nodeSqlite';
import { installTestClock } from '../testing/setup';

beforeEach(() => installTestClock());

describe('migration', () => {
  it('DB mới lên đúng SCHEMA_VERSION, đủ bảng', async () => {
    const db = openMemoryDatabase();
    const r = await migrate(db);
    expect(r).toEqual({ from: 0, to: SCHEMA_VERSION });
    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);
    const tables = (await db.getAll<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")).map((t) => t.name);
    for (const t of ['workshop', 'settings', 'materials', 'projects', 'door_items', 'quotes', 'template_snapshots', 'drafts', 'events', 'error_log']) {
      expect(tables).toContain(t);
    }
    expect(await db.getFirst('SELECT id FROM workshop')).toEqual({ id: 1 });
  });

  it('chạy lại không đổi gì', async () => {
    const db = openMemoryDatabase();
    await migrate(db);
    expect(await migrate(db)).toEqual({ from: SCHEMA_VERSION, to: SCHEMA_VERSION });
  });

  it('DB của bản app mới hơn: từ chối, không đụng dữ liệu', async () => {
    const db = openMemoryDatabase();
    await migrate(db);
    await db.exec('PRAGMA user_version = 99');
    await expect(migrate(db)).rejects.toBeInstanceOf(NewerSchemaError);
    expect(await getSchemaVersion(db)).toBe(99);
  });

  it('migration lỗi thì cuộn lại cả bước đó (không nửa vời)', async () => {
    const db = openMemoryDatabase();
    await migrate(db);
    MIGRATIONS[SCHEMA_VERSION + 1] = 'CREATE TABLE tam (a INTEGER); THIS IS NOT SQL;';
    try {
      await expect(migrate(db, SCHEMA_VERSION + 1)).rejects.toThrow();
    } finally {
      delete MIGRATIONS[SCHEMA_VERSION + 1];
    }
    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);
    expect(await db.getFirst("SELECT name FROM sqlite_master WHERE name = 'tam'")).toBeNull();
  });

  it('thiếu migration là lỗi rõ ràng', async () => {
    const db = openMemoryDatabase();
    await expect(migrate(db, SCHEMA_VERSION + 5)).rejects.toThrow('Thiếu migration');
  });
});

describe('khởi tạo DB khi mở app', () => {
  it('chép vật tư gói kèm và bản chụp mẫu cửa; lần sau không thêm lại', async () => {
    const db = openMemoryDatabase();
    const first = await initDatabase(db);
    expect(first.migratedFrom).toBe(0);
    expect(first.materialsAdded).toBe(MATERIALS.length);
    expect(first.snapshotsAdded).toBe(TEMPLATES.length);
    expect(first.snapshotConflicts).toEqual([]);
    const again = await initDatabase(db);
    expect(again).toMatchObject({ migratedFrom: SCHEMA_VERSION, materialsAdded: 0, materialsUpdated: 0, snapshotsAdded: 0 });
  });

  it('khóa ngoại bật: bộ cửa không thể thuộc dự án không tồn tại', async () => {
    const db = openMemoryDatabase();
    await initDatabase(db);
    await expect(
      db.run("INSERT INTO door_items (id, project_id, symbol, template_id, template_version, w, h, qty, sort_order, created_at, updated_at) VALUES ('x', 'khong-co', 'D1', 't', 1, 1, 1, 1, 1, 0, 0)"),
    ).rejects.toThrow();
  });

  it('giao dịch lồng nhau nhập vào giao dịch ngoài; lỗi thì cuộn lại hết', async () => {
    const db = openMemoryDatabase();
    await initDatabase(db);
    await expect(
      db.transaction(async () => {
        await db.run("INSERT INTO settings (key, value) VALUES ('a', '1')");
        await db.transaction(async () => {
          await db.run("INSERT INTO settings (key, value) VALUES ('b', '2')");
        });
        throw new Error('hỏng');
      }),
    ).rejects.toThrow('hỏng');
    expect(await db.getAll("SELECT key FROM settings WHERE key IN ('a', 'b')")).toEqual([]);
  });
});
