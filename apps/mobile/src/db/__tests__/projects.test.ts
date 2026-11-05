/** @jest-environment node */
import { ValidationError, NotFoundError } from '@/domain/errors';
import * as doors from '../repos/doors';
import * as projects from '../repos/projects';
import * as quotes from '../repos/quotes';
import * as trash from '../repos/trash';
import { updateWorkshop } from '../repos/workshop';
import type { SqlDb } from '../sql';
import { freshDb, installTestClock, type TestClock } from '../testing/setup';

let db: SqlDb;
let clock: TestClock;

beforeEach(async () => {
  clock = installTestClock();
  db = await freshDb();
});

const door = (symbol: string, extra: Partial<Parameters<typeof doors.createDoor>[2]> = {}) => ({
  symbol,
  templateId: 'xf55-cua-di-1-canh',
  templateVersion: 1,
  W: 800,
  H: 2200,
  qty: 1,
  ...extra,
});

describe('dự án – tạo, sửa (FR-PRJ-01, 03)', () => {
  it('chỉ tên công trình là bắt buộc; lấy tham số cắt mặc định của xưởng', async () => {
    await expect(projects.createProject(db, { name: '   ' })).rejects.toMatchObject({ field: 'name' });
    await updateWorkshop(db, { defaultCut: { barLength: 6000, kerf: 5, trim: 15 } });
    const p = await projects.createProject(db, { name: ' Nhà anh Đoài ', customer: 'Anh Đoài', phone: '0923 456 789' });
    expect(p).toMatchObject({ name: 'Nhà anh Đoài', customer: 'Anh Đoài', status: 'bao_gia', cut: { barLength: 6000, kerf: 5, trim: 15 }, op2Price: null });
  });

  it('sửa thông tin, trạng thái, tham số cắt, đơn giá OP2', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    clock.advance(1000);
    const u = await projects.updateProject(db, p.id, { status: 'dat_coc', op2Price: 2_370_000, cut: { barLength: 2000, kerf: 4, trim: 10 } });
    expect(u).toMatchObject({ status: 'dat_coc', op2Price: 2_370_000, cut: { barLength: 2000 } });
    expect(u.updatedAt).toBeGreaterThan(p.updatedAt);
    await expect(projects.updateProject(db, p.id, { op2Price: 0 })).rejects.toBeInstanceOf(ValidationError);
    await expect(projects.updateProject(db, p.id, { status: 'xyz' as never })).rejects.toMatchObject({ field: 'status' });
    await expect(projects.updateProject(db, 'khong-co', { name: 'x' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('gợi ý SĐT sai dạng, không chặn', () => {
    expect(projects.phoneHint('0923 456 789')).toBeNull();
    expect(projects.phoneHint('+84923456789')).toBeNull();
    expect(projects.phoneHint('')).toBeNull();
    expect(projects.phoneHint('028 3822 1234')).toBeNull();
    expect(projects.phoneHint('(028) 3822-1234')).toBeNull();
    expect(projects.phoneHint('0923 45')).toMatch(/chưa đúng/);
  });
});

describe('danh sách dự án (FR-PRJ-02)', () => {
  it('mới sửa trước; thêm bộ cửa cũng đưa dự án lên đầu; đếm số loại và số bộ', async () => {
    const a = await projects.createProject(db, { name: 'Dự án A' });
    clock.advance(1000);
    const b = await projects.createProject(db, { name: 'Dự án B' });
    expect((await projects.listProjects(db)).map((p) => p.id)).toEqual([b.id, a.id]);
    clock.advance(1000);
    await doors.createDoor(db, a.id, door('D1', { qty: 3 }));
    await doors.createDoor(db, a.id, door('D2', { qty: 2 }));
    const list = await projects.listProjects(db);
    expect(list.map((p) => p.id)).toEqual([a.id, b.id]);
    expect(list[0]).toMatchObject({ doorCount: 2, setCount: 5 });
    expect(list[1]).toMatchObject({ doorCount: 0, setCount: 0 });
  });

  it('tìm không phân biệt dấu theo tên công trình, khách, SĐT, địa chỉ', async () => {
    await projects.createProject(db, { name: 'Nhà phố', customer: 'Chị Hạnh', address: 'Biên Hòa, Đồng Nai' });
    await projects.createProject(db, { name: 'Văn phòng', customer: 'Anh Tuấn', phone: '0977 654 321' });
    expect((await projects.listProjects(db, 'hanh')).map((p) => p.customer)).toEqual(['Chị Hạnh']);
    expect((await projects.listProjects(db, 'dong nai')).length).toBe(1);
    expect((await projects.listProjects(db, '0977654')).map((p) => p.name)).toEqual(['Văn phòng']);
    expect((await projects.listProjects(db, 'VAN PHONG')).length).toBe(1);
    expect((await projects.listProjects(db, '')).length).toBe(2);
  });
});

describe('xóa mềm 30 ngày, khôi phục (Q2)', () => {
  it('xóa → ẩn khỏi danh sách, vào thùng rác; khôi phục → về như cũ', async () => {
    const p = await projects.createProject(db, { name: 'Anh Đoài' });
    await doors.createDoor(db, p.id, door('D1'));
    await projects.softDeleteProject(db, p.id);
    expect(await projects.listProjects(db)).toEqual([]);
    const t = await trash.listTrash(db);
    expect(t).toEqual([expect.objectContaining({ kind: 'project', id: p.id, title: 'Anh Đoài' })]);
    expect(trash.daysLeft(t[0]!, clock.now())).toBe(30);
    await expect(projects.softDeleteProject(db, p.id)).rejects.toBeInstanceOf(NotFoundError);
    await projects.restoreProject(db, p.id);
    const list = await projects.listProjects(db);
    expect(list.map((x) => [x.id, x.doorCount])).toEqual([[p.id, 1]]);
    await expect(projects.restoreProject(db, p.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('khôi phục dự án không khôi phục bộ cửa đã xóa riêng từ trước', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const d1 = await doors.createDoor(db, p.id, door('D1'));
    await doors.createDoor(db, p.id, door('D2'));
    await doors.softDeleteDoors(db, [d1.id]);
    await projects.softDeleteProject(db, p.id);
    await projects.restoreProject(db, p.id);
    expect((await doors.listDoors(db, p.id)).map((d) => d.symbol)).toEqual(['D2']);
    expect((await trash.listTrash(db)).map((x) => x.title)).toEqual(['D1 · A']);
  });

  it('quá 30 ngày thì xóa hẳn (kèm bộ cửa, báo giá); chưa tới hạn thì giữ', async () => {
    const old = await projects.createProject(db, { name: 'Cũ' });
    await doors.createDoor(db, old.id, door('D1'));
    await quotes.saveQuote(db, { projectId: old.id, mode: 'op1', audience: 'khach', total: 1, doc: {} });
    const keep = await projects.createProject(db, { name: 'Giữ' });
    const dk = await doors.createDoor(db, keep.id, door('D1'));
    await projects.softDeleteProject(db, old.id);
    clock.advanceDays(10);
    await doors.softDeleteDoors(db, [dk.id]);
    clock.advanceDays(20); // dự án "Cũ" tròn 30 ngày; bộ cửa của "Giữ" mới 20 ngày
    const r = await trash.purgeExpired(db, clock.now());
    expect(r).toMatchObject({ projects: 1, doors: 0 });
    expect(await db.getAll('SELECT id FROM door_items WHERE project_id = ?', [old.id])).toEqual([]);
    expect(await db.getAll('SELECT id FROM quotes WHERE project_id = ?', [old.id])).toEqual([]);
    clock.advanceDays(10);
    expect((await trash.purgeExpired(db, clock.now())).doors).toBe(1);
    expect(await trash.listTrash(db)).toEqual([]);
  });

  it('xóa hẳn từ thùng rác', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const d = await doors.createDoor(db, p.id, door('D1'));
    await doors.softDeleteDoors(db, [d.id]);
    await trash.hardDeleteDoor(db, d.id);
    await projects.softDeleteProject(db, p.id);
    await projects.hardDeleteProject(db, p.id);
    expect(await projects.getProject(db, p.id)).toBeNull();
    expect(await trash.listTrash(db)).toEqual([]);
  });
});

describe('nhân bản dự án (FR-PRJ-03)', () => {
  it('chép bộ cửa đang có và tham số, không chép báo giá, trạng thái về Báo giá', async () => {
    const p = await projects.createProject(db, { name: 'Anh Đoài', customer: 'Đoài' });
    await projects.updateProject(db, p.id, { status: 'gia_cong', op2Price: 2_000_000, cut: { barLength: 6000, kerf: 4, trim: 10 } });
    await doors.createDoor(db, p.id, door('D1', { color: 'Nâu', location: 'Tầng 2', params: { kheHoChan: 8 }, glass: { kinh: 'KINH-CL-8' } }));
    const d2 = await doors.createDoor(db, p.id, door('D2'));
    await doors.softDeleteDoors(db, [d2.id]);
    await quotes.saveQuote(db, { projectId: p.id, mode: 'op1', audience: 'khach', total: 1, doc: {} });
    const c = await projects.duplicateProject(db, p.id);
    expect(c).toMatchObject({ name: 'Anh Đoài (bản sao)', customer: 'Đoài', status: 'bao_gia', op2Price: 2_000_000, cut: { barLength: 6000 } });
    const cd = await doors.listDoors(db, c.id);
    expect(cd).toEqual([
      expect.objectContaining({ symbol: 'D1', color: 'Nâu', location: 'Tầng 2', params: { kheHoChan: 8 }, glass: { kinh: 'KINH-CL-8' }, templateVersion: 1 }),
    ]);
    expect(await quotes.listQuotes(db, c.id)).toEqual([]);
    await expect(projects.duplicateProject(db, 'khong-co')).rejects.toBeInstanceOf(NotFoundError);
  });
});
