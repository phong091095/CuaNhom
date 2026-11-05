/** @jest-environment node */
import { backupFileName, dumpAll, parseBackup, replaceAll, serializeBackup, BACKUP_UPGRADES, type BackupFile } from '../backup';
import * as doors from '../repos/doors';
import * as drafts from '../repos/drafts';
import * as events from '../repos/events';
import * as m from '../repos/materials';
import * as projects from '../repos/projects';
import * as quotes from '../repos/quotes';
import * as settings from '../repos/settings';
import { updateWorkshop } from '../repos/workshop';
import { BACKUP_TABLES, SCHEMA_VERSION } from '../schema';
import type { SqlDb } from '../sql';
import { freshDb, installTestClock, T0 } from '../testing/setup';

const META = { appVersion: '0.1.0', dataVersion: '2026.11.05-1', createdAt: T0 };
const LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

async function sampleData(db: SqlDb) {
  await updateWorkshop(db, { name: 'Nhôm kính Phát Đạt', phone: '0909 000 111', logo: LOGO, quoteNote: 'Bảo hành 2 năm' });
  await settings.setSetting(db, 'themeMode', 'dark');
  await settings.setSetting(db, 'device.lastBackupAt', '123');
  await m.updateMaterialPrice(db, 'XF-C3328', { costPrice: 540_000 });
  await m.addUserGlass(db, { name: 'Kính mờ', thicknessMm: 5, costPrice: 180_000 });
  const p = await projects.createProject(db, { name: 'Anh Đoài', customer: 'Đoài', phone: '0923 456 789' });
  await doors.createDoor(db, p.id, { symbol: 'D1', templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W: 800, H: 2200, qty: 2, glass: { kinh: 'KU-001' }, color: 'Nâu' });
  const d2 = await doors.createDoor(db, p.id, { symbol: 'S1', templateId: 'xf55-cua-so-lua', templateVersion: 1, W: 1400, H: 1350, qty: 1, params: { soCanh: 2 } });
  await doors.softDeleteDoors(db, [d2.id]);
  await quotes.saveQuote(db, { projectId: p.id, mode: 'op1', audience: 'khach', total: 5_000_000, doc: { lines: [1, 2] } });
  const gone = await projects.createProject(db, { name: 'Đã xóa' });
  await projects.softDeleteProject(db, gone.id);
  await drafts.saveDraft(db, 'door:new', { W: '1' });
  await events.logEvent(db, 'app_open');
  return p;
}

async function tableDump(db: SqlDb) {
  const out: Record<string, unknown[]> = {};
  for (const t of BACKUP_TABLES) {
    out[t] = await db.getAll(`SELECT * FROM ${t}${t === 'settings' ? " WHERE key NOT LIKE 'device.%'" : ''} ORDER BY 1`);
  }
  return out;
}

let src: SqlDb;
beforeEach(async () => {
  installTestClock();
  src = await freshDb();
});

describe('sao lưu → khôi phục (FR-SET-03)', () => {
  it('khôi phục sang máy khác ra đúng dữ liệu, kể cả logo, bộ cửa đã xóa mềm, báo giá, bản chụp mẫu', async () => {
    await sampleData(src);
    const text = serializeBackup(await dumpAll(src, META));
    const parsed = parseBackup(text);
    if (!parsed.ok) throw new Error(parsed.error);
    expect(parsed.summary).toEqual({
      createdAt: T0,
      appVersion: '0.1.0',
      schemaVersion: SCHEMA_VERSION,
      projects: 1,
      doors: 1,
      quotes: 1,
      hasLogo: true,
      workshopName: 'Nhôm kính Phát Đạt',
    });
    const dst = await freshDb();
    await replaceAll(dst, parsed.backup);
    expect(await tableDump(dst)).toEqual(await tableDump(src));
    const w = await dst.getFirst<{ logo: string }>('SELECT logo FROM workshop');
    expect(w!.logo).toBe(LOGO);
  });

  it('không mang theo nháp, nhật ký, cài đặt riêng của máy; giữ những thứ đó ở máy nhận', async () => {
    await sampleData(src);
    const b = await dumpAll(src, META);
    expect(b.tables.settings.some((s) => String(s.key).startsWith('device.'))).toBe(false);
    expect(Object.keys(b.tables)).not.toContain('drafts');
    const dst = await freshDb();
    await settings.setSetting(dst, 'device.lastBackupAt', '999');
    await drafts.saveDraft(dst, 'k', 1);
    await replaceAll(dst, b);
    expect(await settings.getSetting(dst, 'device.lastBackupAt')).toBe('999');
    expect(await drafts.loadDraft(dst, 'k')).not.toBeNull();
    expect(await settings.getSetting(dst, 'themeMode')).toBe('dark');
  });

  it('khôi phục thay toàn bộ dữ liệu cũ', async () => {
    await sampleData(src);
    const b = await dumpAll(src, META);
    const dst = await freshDb();
    await projects.createProject(dst, { name: 'Dự án của máy nhận' });
    await replaceAll(dst, b);
    expect((await projects.listProjects(dst)).map((p) => p.name)).toEqual(['Anh Đoài']);
  });

  it('khôi phục lỗi giữa chừng thì không đổi gì (một giao dịch)', async () => {
    await sampleData(src);
    const b = await dumpAll(src, META);
    b.tables.door_items.push({ ...b.tables.door_items[0]!, id: 'x', qty: 0 }); // vi phạm CHECK qty >= 1
    const dst = await freshDb();
    await projects.createProject(dst, { name: 'Giữ nguyên' });
    await expect(replaceAll(dst, b)).rejects.toThrow();
    expect((await projects.listProjects(dst)).map((p) => p.name)).toEqual(['Giữ nguyên']);
  });

  it('bỏ qua cột lạ trong file (file bị sửa tay)', async () => {
    await sampleData(src);
    const b = await dumpAll(src, META);
    (b.tables.projects[0] as Record<string, unknown>)['cot_la; DROP TABLE projects'] = 'x';
    const dst = await freshDb();
    await replaceAll(dst, b);
    expect((await projects.listProjects(dst)).length).toBe(1);
  });

  it('tên file', () => {
    expect(backupFileName(new Date(2026, 10, 5))).toBe('MATADOOR_saoluu_2026-11-05.json');
  });
});

describe('đọc file sao lưu – từ chối file không hợp lệ', () => {
  const valid = async () => dumpAll(src, META);

  it('không phải JSON hoặc không phải file MATADOOR', () => {
    expect(parseBackup('abc')).toEqual({ ok: false, error: 'File này không phải bản sao lưu MATADOOR' });
    expect(parseBackup('null').ok).toBe(false);
    expect(parseBackup('{"app":"KHAC","kind":"sao-luu","schemaVersion":1,"tables":{}}').ok).toBe(false);
  });

  it('file từ bản app mới hơn', async () => {
    const b = { ...(await valid()), schemaVersion: SCHEMA_VERSION + 1 };
    const r = parseBackup(JSON.stringify(b));
    expect(r).toEqual({ ok: false, error: 'File sao lưu được tạo từ bản app mới hơn. Hãy cập nhật app rồi khôi phục lại.' });
  });

  it('bảng hỏng, thiếu cột bắt buộc, bộ cửa mồ côi', async () => {
    const b1 = await valid();
    (b1.tables as Record<string, unknown>).projects = 'x';
    expect(parseBackup(JSON.stringify(b1))).toMatchObject({ ok: false, error: 'File sao lưu bị hỏng (bảng projects)' });
    await sampleData(src);
    const b2 = await valid();
    delete b2.tables.projects[0]!.name;
    expect(parseBackup(JSON.stringify(b2))).toMatchObject({ ok: false, error: 'File sao lưu bị hỏng (bảng projects thiếu name)' });
    const b3 = await valid();
    b3.tables.door_items[0]!.project_id = 'khong-co';
    expect(parseBackup(JSON.stringify(b3))).toMatchObject({ ok: false, error: 'File sao lưu bị hỏng (bộ cửa không thuộc dự án nào)' });
    const b4 = { ...(await valid()), tables: null } as unknown as BackupFile;
    expect(parseBackup(JSON.stringify(b4))).toMatchObject({ ok: false, error: 'File sao lưu bị hỏng (thiếu dữ liệu)' });
    const b5 = await valid();
    (b5.tables.settings as unknown[]).push({ key: { x: 1 } });
    expect(parseBackup(JSON.stringify(b5))).toMatchObject({ ok: false, error: 'File sao lưu bị hỏng (bảng settings)' });
  });

  it('file lược đồ cũ hơn được nâng bằng BACKUP_UPGRADES (giả lập lược đồ 0 → 1)', async () => {
    await sampleData(src);
    const old = { ...(await valid()), schemaVersion: SCHEMA_VERSION - 1 };
    expect(parseBackup(JSON.stringify(old))).toMatchObject({ ok: false });
    BACKUP_UPGRADES[SCHEMA_VERSION] = (t) => ({ ...t, projects: (t.projects ?? []).map((p) => ({ ...p, note: 'đã nâng' })) });
    try {
      const r = parseBackup(JSON.stringify(old));
      if (!r.ok) throw new Error(r.error);
      expect(r.backup.schemaVersion).toBe(SCHEMA_VERSION);
      expect(r.backup.tables.projects.every((p) => p.note === 'đã nâng')).toBe(true);
    } finally {
      delete BACKUP_UPGRADES[SCHEMA_VERSION];
    }
  });
});
