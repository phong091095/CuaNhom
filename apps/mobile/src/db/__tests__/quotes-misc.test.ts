/** @jest-environment node */
import { TEMPLATES } from '@matadoor/data';
import { NotFoundError } from '@/domain/errors';
import * as drafts from '../repos/drafts';
import * as events from '../repos/events';
import * as projects from '../repos/projects';
import * as quotes from '../repos/quotes';
import * as settings from '../repos/settings';
import * as snapshots from '../repos/snapshots';
import { getWorkshop, updateWorkshop } from '../repos/workshop';
import type { SqlDb } from '../sql';
import { freshDb, installTestClock, T0, type TestClock } from '../testing/setup';

let db: SqlDb;
let clock: TestClock;
beforeEach(async () => {
  clock = installTestClock();
  db = await freshDb();
});

describe('báo giá đã xuất (FR-MAT-03, Q2)', () => {
  it('số báo giá BG-YYMM-NNN tăng trong tháng, sang tháng mới đánh lại từ 001', async () => {
    expect(await quotes.nextQuoteNumber(db, new Date(2026, 10, 5))).toBe('BG-2611-001');
    expect(await quotes.nextQuoteNumber(db, new Date(2026, 10, 30))).toBe('BG-2611-002');
    expect(await quotes.nextQuoteNumber(db, new Date(2026, 11, 1))).toBe('BG-2612-001');
  });

  it('lưu bản chụp, đưa dự án lên đầu; lịch sử mới nhất trước; xóa ngay', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    clock.advance(1000);
    const doc = { lines: [{ symbol: 'D1', total: 2_469_136 }], prices: { 'XF-C3328': 520_000 } };
    const q1 = await quotes.saveQuote(db, { projectId: p.id, mode: 'op1', audience: 'khach', total: 2_469_136, doc, fileName: 'BaoGia_BG-2611-001.pdf' });
    clock.advance(1000);
    const q2 = await quotes.saveQuote(db, { projectId: p.id, mode: 'op2', audience: 'noi_bo', total: 2_500_000, doc: { x: 1 } });
    expect(q1).toMatchObject({ number: 'BG-2611-001', doc, fileName: 'BaoGia_BG-2611-001.pdf' });
    expect(q2.number).toBe('BG-2611-002');
    expect((await projects.getProject(db, p.id))!.updatedAt).toBe(T0 + 2000);
    expect((await quotes.listQuotes(db, p.id)).map((q) => q.number)).toEqual(['BG-2611-002', 'BG-2611-001']);
    await quotes.deleteQuote(db, q1.id);
    expect((await quotes.listQuotes(db, p.id)).length).toBe(1);
    await expect(quotes.deleteQuote(db, q1.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('không lưu cho dự án đã xóa; tổng âm là lỗi', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    await expect(quotes.saveQuote(db, { projectId: p.id, mode: 'op1', audience: 'khach', total: -1, doc: {} })).rejects.toMatchObject({ field: 'total' });
    await projects.softDeleteProject(db, p.id);
    await expect(quotes.saveQuote(db, { projectId: p.id, mode: 'op1', audience: 'khach', total: 1, doc: {} })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('thông tin xưởng (FR-SET-01, 02)', () => {
  it('mặc định: VAT tắt 8%, cây 5800 / mạch 4 / bỏ đầu 10, hệ số 1,1', async () => {
    expect(await getWorkshop(db)).toMatchObject({
      name: '',
      vatEnabled: false,
      vatRate: 0.08,
      defaultCut: { barLength: 5800, kerf: 4, trim: 10 },
      factors: { nhom: 1.1, kinh: 1.1, phukien: 1.1, nhancong: 1.1 },
      logo: null,
    });
  });

  it('cập nhật một phần; kiểm tham số cắt, hệ số, VAT, logo', async () => {
    const w = await updateWorkshop(db, { name: ' Nhôm kính Phát Đạt ', vatEnabled: true, logo: 'data:image/png;base64,AAAA', factors: { nhom: 1.15, kinh: 1.1, phukien: 1.1, nhancong: 1.1 } });
    expect(w).toMatchObject({ name: 'Nhôm kính Phát Đạt', vatEnabled: true, logo: 'data:image/png;base64,AAAA', factors: { nhom: 1.15 } });
    await expect(updateWorkshop(db, { defaultCut: { barLength: 100, kerf: 4, trim: 60 } })).rejects.toMatchObject({ field: 'defaultCut' });
    await expect(updateWorkshop(db, { factors: { ...w.factors, kinh: 0.9 } })).rejects.toMatchObject({ field: 'factors.kinh' });
    await expect(updateWorkshop(db, { vatRate: 1.5 })).rejects.toMatchObject({ field: 'vatRate' });
    await expect(updateWorkshop(db, { logo: 'http://x/logo.png' })).rejects.toMatchObject({ field: 'logo' });
  });
});

describe('cài đặt, nháp, nhật ký, bản chụp mẫu', () => {
  it('cài đặt khóa–giá trị', async () => {
    expect(await settings.getSetting(db, 'themeMode')).toBeNull();
    await settings.setSetting(db, 'themeMode', 'dark');
    await settings.setSetting(db, 'themeMode', 'light');
    expect(await settings.getSetting(db, 'themeMode')).toBe('light');
    await settings.deleteSetting(db, 'themeMode');
    expect(await settings.getSetting(db, 'themeMode')).toBeNull();
  });

  it('nháp form lưu, đọc, xóa (NFR-REL-01)', async () => {
    await drafts.saveDraft(db, 'door:new:p1', { W: '800', H: '22' });
    clock.advance(10);
    await drafts.saveDraft(db, 'door:new:p1', { W: '800', H: '2200' });
    expect(await drafts.loadDraft(db, 'door:new:p1')).toEqual({ value: { W: '800', H: '2200' }, updatedAt: T0 + 10 });
    await drafts.clearDraft(db, 'door:new:p1');
    expect(await drafts.loadDraft(db, 'door:new:p1')).toBeNull();
  });

  it('nhật ký sử dụng; nhật ký lỗi chỉ giữ 200 dòng mới nhất', async () => {
    await events.logEvent(db, 'app_open');
    await events.logEvent(db, 'door_saved', { projectId: 'p', doorId: 'd', value: 95 });
    expect((await events.listEvents(db)).map((e) => [e.type, e.value])).toEqual([
      ['app_open', null],
      ['door_saved', 95],
    ]);
    for (let i = 0; i < events.ERROR_LOG_KEEP + 5; i++) await events.logError(db, `lỗi ${i}`, 'stack', 'B1');
    const errs = await events.listErrors(db);
    expect(errs.length).toBe(events.ERROR_LOG_KEEP);
    expect(errs[0]!.message).toBe(`lỗi ${events.ERROR_LOG_KEEP + 4}`);
  });

  it('bản chụp mẫu: không ghi đè bản đã lưu, báo khi nội dung khác mà cùng version', async () => {
    const t = TEMPLATES[0]!;
    const changed = { ...t, constants: { ...t.constants, khungChiem: { value: 40 } } };
    const r = await snapshots.ensureTemplateSnapshots(db, [changed]);
    expect(r).toEqual({ added: 0, conflicts: [`${t.id}@${t.version}`] });
    expect((await snapshots.getTemplateSnapshot(db, t.id, t.version))!.constants.khungChiem!.value).toBe(36);
    const v2 = { ...changed, version: t.version + 1 };
    expect((await snapshots.ensureTemplateSnapshots(db, [v2])).added).toBe(1);
    expect((await snapshots.loadTemplateSnapshots(db)).size).toBe(TEMPLATES.length + 1);
    expect(await snapshots.getTemplateSnapshot(db, 'khong-co', 1)).toBeNull();
  });
});
