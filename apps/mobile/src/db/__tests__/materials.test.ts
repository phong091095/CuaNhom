/** @jest-environment node */
import { MATERIALS, type MaterialRecord } from '@matadoor/data';
import { ValidationError } from '@/domain/errors';
import { loadPriceBook } from '@/domain/pricing';
import * as doors from '../repos/doors';
import * as m from '../repos/materials';
import * as projects from '../repos/projects';
import { updateWorkshop } from '../repos/workshop';
import type { SqlDb } from '../sql';
import { freshDb, installTestClock } from '../testing/setup';

let db: SqlDb;
beforeEach(async () => {
  installTestClock();
  db = await freshDb();
});

describe('bảng vật tư của xưởng (FR-MAT-01, 02)', () => {
  it('có đủ vật tư gói kèm, xếp theo nhóm nhôm → kính → phụ kiện → nhân công', async () => {
    const all = await m.listMaterials(db);
    expect(all.length).toBe(MATERIALS.length);
    expect(all[0]!.group).toBe('nhom');
    expect(all.at(-1)!.group).toBe('nhancong');
    expect((await m.listMaterials(db, 'kinh')).every((x) => x.group === 'kinh')).toBe(true);
  });

  it('sửa giá: đánh dấu đã sửa; gói dữ liệu mới không ghi đè giá đã sửa', async () => {
    await m.updateMaterialPrice(db, 'XF-C3328', { costPrice: 540_000 });
    const changed: MaterialRecord[] = MATERIALS.map((x) =>
      x.code === 'XF-C3328' || x.code === 'XF-C3303' ? { ...x, costPrice: x.costPrice + 10_000, name: `${x.name} (mới)` } : x,
    );
    const r = await m.syncBundledMaterials(db, changed);
    expect(r).toEqual({ added: 0, updated: 2 });
    const c3328 = (await m.getMaterial(db, 'XF-C3328'))!;
    expect(c3328).toMatchObject({ costPrice: 540_000, priceEdited: true, priceStatus: 'xuong' });
    expect(c3328.name).toMatch(/\(mới\)$/);
    expect((await m.getMaterial(db, 'XF-C3303'))!.costPrice).toBe(355_000);
  });

  it('giá riêng; về giá gói kèm', async () => {
    const x = await m.updateMaterialPrice(db, 'KINH-TRANG-8', { salePrice: 300_000 });
    expect(x.salePrice).toBe(300_000);
    const y = await m.resetMaterialPrice(db, 'KINH-TRANG-8', MATERIALS);
    expect(y).toMatchObject({ costPrice: 230_000, salePrice: null, priceEdited: false });
    await expect(m.updateMaterialPrice(db, 'KINH-TRANG-8', { costPrice: -1 })).rejects.toBeInstanceOf(ValidationError);
    await expect(m.updateMaterialPrice(db, 'KINH-TRANG-8', { costPrice: 0 })).rejects.toMatchObject({ field: 'costPrice' });
    await expect(m.updateMaterialPrice(db, 'KHONG', { costPrice: 1 })).rejects.toThrow('Không tìm thấy');
    await expect(m.resetMaterialPrice(db, 'KU-999', MATERIALS)).rejects.toBeInstanceOf(ValidationError);
  });

  it('ẩn/hiện; không ẩn được kính mặc định của mẫu', async () => {
    await m.setMaterialHidden(db, 'KINH-CL-10', true, ['KINH-TRANG-8']);
    expect((await m.getMaterial(db, 'KINH-CL-10'))!.hidden).toBe(true);
    await expect(m.setMaterialHidden(db, 'KINH-TRANG-8', true, ['KINH-TRANG-8'])).rejects.toMatchObject({ field: 'hidden' });
    await expect(m.setMaterialHidden(db, 'KHONG', true)).rejects.toThrow('Không tìm thấy');
  });

  it('thêm kính riêng KU-001, KU-002; kiểm độ dày và giá', async () => {
    const k1 = await m.addUserGlass(db, { name: 'Kính hộp 6-12A-6', thicknessMm: 12, costPrice: 650_000 });
    const k2 = await m.addUserGlass(db, { name: 'Kính mờ 5 ly', thicknessMm: 5, costPrice: 180_000, salePrice: 220_000 });
    expect([k1.code, k2.code]).toEqual(['KU-001', 'KU-002']);
    expect(k1).toMatchObject({ origin: 'user', group: 'kinh', unit: 'm²', thicknessMm: 12 });
    await expect(m.addUserGlass(db, { name: '', thicknessMm: 5, costPrice: 1 })).rejects.toMatchObject({ field: 'name' });
    await expect(m.addUserGlass(db, { name: 'x', thicknessMm: 50, costPrice: 1 })).rejects.toMatchObject({ field: 'thicknessMm' });
    await expect(m.addUserGlass(db, { name: 'x', thicknessMm: 5, costPrice: 0 })).rejects.toMatchObject({ field: 'costPrice' });
  });

  it('xóa: chỉ kính xưởng tự thêm và chưa bộ cửa nào dùng (kể cả bộ đã xóa mềm)', async () => {
    const k = await m.addUserGlass(db, { name: 'Kính mờ', thicknessMm: 5, costPrice: 180_000 });
    const p = await projects.createProject(db, { name: 'A' });
    const d = await doors.createDoor(db, p.id, { symbol: 'D1', templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W: 800, H: 2200, qty: 1, glass: { kinh: k.code } });
    await doors.softDeleteDoors(db, [d.id]);
    await expect(m.deleteUserMaterial(db, k.code)).rejects.toThrow(/đang dùng/);
    await expect(m.deleteUserMaterial(db, 'XF-C3328')).rejects.toThrow(/không xóa được/);
    const k2 = await m.addUserGlass(db, { name: 'Kính khác', thicknessMm: 5, costPrice: 1 });
    await m.deleteUserMaterial(db, k2.code);
    expect(await m.getMaterial(db, k2.code)).toBeNull();
  });

  it('bảng giá engine: giá nhôm theo m, giá bán theo hệ số nhóm của xưởng hoặc giá riêng', async () => {
    await updateWorkshop(db, { factors: { nhom: 1.2, kinh: 1.1, phukien: 1.1, nhancong: 1.1 } });
    await m.updateMaterialPrice(db, 'PK-TAYNAM-CD', { salePrice: 150_000 });
    const book = await loadPriceBook(db);
    expect(book['XF-C3328']!.costPrice).toBeCloseTo(520_000 / 5.8, 6);
    expect(book['XF-C3328']!.salePrice).toBeCloseTo((520_000 * 1.2) / 5.8, 6);
    expect(book['PK-TAYNAM-CD']!.salePrice).toBe(150_000);
  });
});
