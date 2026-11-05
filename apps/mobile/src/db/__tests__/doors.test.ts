/** @jest-environment node */
import { NotFoundError, ValidationError } from '@/domain/errors';
import * as doors from '../repos/doors';
import * as projects from '../repos/projects';
import type { SqlDb } from '../sql';
import { freshDb, installTestClock, type TestClock } from '../testing/setup';

let db: SqlDb;
let clock: TestClock;
let pid: string;

const input = (symbol: string, extra: Partial<Parameters<typeof doors.createDoor>[2]> = {}) => ({
  symbol,
  templateId: 'xf55-cua-di-1-canh',
  templateVersion: 1,
  W: 800,
  H: 2200,
  qty: 1,
  ...extra,
});
const symbols = async () => (await doors.listDoors(db, pid)).map((d) => d.symbol);

beforeEach(async () => {
  clock = installTestClock();
  db = await freshDb();
  pid = (await projects.createProject(db, { name: 'Dự án thử' })).id;
});

describe('tạo và sửa bộ cửa (FR-DOR-02…08)', () => {
  it('lưu đủ trường, kể cả tham số, kính, màu, vị trí, ghi chú; thứ tự tăng dần', async () => {
    const d = await doors.createDoor(db, pid, input('D1', { qty: 2, params: { kheHoChan: 8 }, glass: { kinh: 'KINH-CL-8' }, color: ' Nâu cà phê ', location: 'Tầng 2 – P. ngủ', note: 'Khách muốn mở vào' }));
    expect(d).toMatchObject({ symbol: 'D1', qty: 2, params: { kheHoChan: 8 }, glass: { kinh: 'KINH-CL-8' }, color: 'Nâu cà phê', location: 'Tầng 2 – P. ngủ', sortOrder: 1 });
    const d2 = await doors.createDoor(db, pid, input('D2', { color: '  ' }));
    expect(d2).toMatchObject({ sortOrder: 2, color: null });
  });

  it('ký hiệu không được trùng trong dự án (không phân biệt hoa thường, khoảng trắng)', async () => {
    await doors.createDoor(db, pid, input('D1'));
    await expect(doors.createDoor(db, pid, input(' d1 '))).rejects.toMatchObject({ field: 'symbol', message: 'Ký hiệu “d1” đã có trong dự án' });
    await expect(doors.createDoor(db, pid, input(''))).rejects.toMatchObject({ field: 'symbol' });
    const d2 = await doors.createDoor(db, pid, input('D2'));
    await expect(doors.updateDoor(db, d2.id, input('D1'))).rejects.toMatchObject({ field: 'symbol' });
    expect((await doors.updateDoor(db, d2.id, input('D2', { W: 900 }))).W).toBe(900);
  });

  it('kiểm W, H, số bộ, độ dài chữ', async () => {
    await expect(doors.createDoor(db, pid, input('D1', { W: 0 }))).rejects.toMatchObject({ field: 'W' });
    await expect(doors.createDoor(db, pid, input('D1', { H: Number.NaN }))).rejects.toMatchObject({ field: 'H' });
    await expect(doors.createDoor(db, pid, input('D1', { qty: 1.5 }))).rejects.toMatchObject({ field: 'qty' });
    await expect(doors.createDoor(db, pid, input('D1', { templateId: '' }))).rejects.toMatchObject({ field: 'templateId' });
    await expect(doors.createDoor(db, pid, input('D1', { note: 'x'.repeat(201) }))).rejects.toMatchObject({ field: 'note' });
    await expect(doors.createDoor(db, 'khong-co', input('D1'))).rejects.toBeInstanceOf(NotFoundError);
  });

  it('gợi ý ký hiệu: số lớn nhất + 1 theo tiền tố, tính cả bộ đã xóa', async () => {
    expect(await doors.suggestSymbol(db, pid, 'D')).toBe('D1');
    const d1 = await doors.createDoor(db, pid, input('D1'));
    await doors.createDoor(db, pid, input('D7'));
    await doors.createDoor(db, pid, input('S1', { templateId: 'xf55-cua-so-lua' }));
    await doors.softDeleteDoors(db, [d1.id]);
    expect(await doors.suggestSymbol(db, pid, 'D')).toBe('D8');
    expect(await doors.suggestSymbol(db, pid, 'S')).toBe('S2');
    expect(await doors.suggestSymbol(db, pid, 'V')).toBe('V1');
  });

  it('mọi thay đổi bộ cửa cập nhật ngày sửa của dự án', async () => {
    const before = (await projects.getProject(db, pid))!.updatedAt;
    clock.advance(5000);
    const d = await doors.createDoor(db, pid, input('D1'));
    const t1 = (await projects.getProject(db, pid))!.updatedAt;
    expect(t1).toBe(before + 5000);
    clock.advance(5000);
    await doors.updateDoor(db, d.id, input('D1', { W: 900 }));
    expect((await projects.getProject(db, pid))!.updatedAt).toBe(t1 + 5000);
  });
});

describe('xóa, khôi phục, nhân bản, sắp xếp', () => {
  it('xóa nhiều bộ (D1 chọn nhiều); xóa lại bộ đã xóa không tính', async () => {
    const a = await doors.createDoor(db, pid, input('D1'));
    const b = await doors.createDoor(db, pid, input('D2'));
    await doors.createDoor(db, pid, input('D3'));
    expect(await doors.softDeleteDoors(db, [a.id, b.id, a.id, 'khong-co'])).toBe(2);
    expect(await symbols()).toEqual(['D3']);
    expect(await doors.softDeleteDoors(db, [])).toBe(0);
  });

  it('khôi phục về chỗ cũ; ký hiệu đã bị dùng thì đổi sang ký hiệu kế tiếp', async () => {
    const a = await doors.createDoor(db, pid, input('D1'));
    await doors.createDoor(db, pid, input('D2'));
    await doors.softDeleteDoors(db, [a.id]);
    expect(await doors.restoreDoor(db, a.id)).toEqual({ symbol: 'D1', renamed: false });
    expect(await symbols()).toEqual(['D1', 'D2']);
    await doors.softDeleteDoors(db, [a.id]);
    await doors.createDoor(db, pid, input('D1'));
    expect(await doors.restoreDoor(db, a.id)).toEqual({ symbol: 'D3', renamed: true });
    await expect(doors.restoreDoor(db, a.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('không khôi phục được bộ cửa khi dự án của nó đang trong thùng rác', async () => {
    const a = await doors.createDoor(db, pid, input('D1'));
    await doors.softDeleteDoors(db, [a.id]);
    await projects.softDeleteProject(db, pid);
    await expect(doors.restoreDoor(db, a.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('nhân bản: ngay sau bộ gốc, ký hiệu kế tiếp cùng tiền tố, giữ mọi thông số', async () => {
    const a = await doors.createDoor(db, pid, input('D1', { qty: 2, color: 'Trắng' }));
    await doors.createDoor(db, pid, input('D2'));
    const c = await doors.duplicateDoor(db, a.id);
    expect(c).toMatchObject({ symbol: 'D3', qty: 2, color: 'Trắng' });
    expect(await symbols()).toEqual(['D1', 'D3', 'D2']);
  });

  it('sắp xếp lại và chuyển lên/xuống', async () => {
    const a = await doors.createDoor(db, pid, input('D1'));
    const b = await doors.createDoor(db, pid, input('D2'));
    const c = await doors.createDoor(db, pid, input('D3'));
    await doors.reorderDoors(db, pid, [c.id, a.id, b.id]);
    expect(await symbols()).toEqual(['D3', 'D1', 'D2']);
    await doors.moveDoor(db, b.id, -1);
    expect(await symbols()).toEqual(['D3', 'D2', 'D1']);
    await doors.moveDoor(db, c.id, -1); // đã ở đầu: không đổi
    expect(await symbols()).toEqual(['D3', 'D2', 'D1']);
    await expect(doors.reorderDoors(db, pid, [a.id, b.id])).rejects.toBeInstanceOf(ValidationError);
  });
});
