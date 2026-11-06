/** @jest-environment node */
import * as doors from '@/db/repos/doors';
import { listMaterials } from '@/db/repos/materials';
import * as projects from '@/db/repos/projects';
import type { SqlDb } from '@/db/sql';
import { freshDb, installTestClock } from '@/db/testing/setup';
import { NotFoundError } from '../errors';
import { formatMm } from '@matadoor/engine';
import { aluminumGroups, angleText, doorSpecs, perUnit, profileSubtitle } from '../doorDetail';
import { computeSingleDoor } from '../projectCalc';

let db: SqlDb;
beforeEach(async () => {
  installTestClock();
  db = await freshDb();
});

const di = (symbol: string, qty = 1) => ({ symbol, templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W: 800, H: 2200, qty });

describe('chi tiết một bộ cửa (D6)', () => {
  it('TC-01: chiều dài cắt và kính đúng đáp án SRS', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const d = await doors.createDoor(db, p.id, di('D1'));
    const c = await computeSingleDoor(db, d.id);
    expect(c.result.ok).toBe(true);
    const byRole = Object.fromEntries(c.result.profiles.map((l) => [l.role, l]));
    expect([formatMm(byRole.canh_ngang!.length), byRole.canh_ngang!.qtyPerSet]).toEqual(['718\u00a0mm', 2]);
    expect([formatMm(byRole.canh_dung!.length), byRole.canh_dung!.qtyPerSet]).toEqual(['2149\u00a0mm', 2]);
    expect([formatMm(byRole.nep_dung!.length), byRole.nep_dung!.qtyPerSet]).toEqual(['2012,6\u00a0mm', 2]);
    expect(c.result.glass[0]).toMatchObject({ width: 574, height: 2007.6, qtyPerSet: 1 });
    expect(c.project.id).toBe(p.id);
    expect(c.newerTemplateVersion).toBeNull();
  });

  it('nhôm gom theo mã, số cho 1 bộ dù bộ cửa có nhiều bộ', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const one = await computeSingleDoor(db, (await doors.createDoor(db, p.id, di('D1', 1))).id);
    const three = await computeSingleDoor(db, (await doors.createDoor(db, p.id, di('D2', 3))).id);
    const mats = await listMaterials(db, 'nhom');
    const g1 = aluminumGroups(one.result, mats);
    const g3 = aluminumGroups(three.result, mats);
    expect(g1.map((g) => g.code)).toEqual(['XF-C3328', 'XF-C3303', 'XF-NEP-55']);
    const khung = g1[0]!;
    // Khung: 2 × 2200 + 800 = 5,2 m; 5,2 m ÷ 5,8 m/cây; 1,95 kg/m.
    expect(khung.meters).toBeCloseTo(5.2, 6);
    expect(khung.bars).toBeCloseTo(5.2 / 5.8, 6);
    expect(khung.kg).toBeCloseTo(5.2 * 1.95, 6);
    expect(khung.barPrice).toBe(520000);
    expect(khung.cost).toBeCloseTo(5.2 * (520000 / 5.8), 3);
    expect(g3.map((g) => g.cost)).toEqual(g1.map((g) => expect.closeTo(g.cost, 3)));
    expect(aluminumGroups(one.result, [])[0]).toMatchObject({ barPrice: null, bars: null });
  });

  it('thông số đã nhập đọc theo nhãn mẫu', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const d = await doors.createDoor(db, p.id, { ...di('D1', 2), params: { huongMo: 1, kheHoChan: 8 }, color: 'Trắng sữa', location: 'Tầng 1', note: 'Gấp' });
    const c = await computeSingleDoor(db, d.id);
    const specs = doorSpecs(c.door, c.template, new Map([['KINH-TRANG-8', 'Kính trắng 8 ly']]));
    const map = Object.fromEntries(specs.map((s) => [s.label, s.value]));
    expect(map).toMatchObject({
      'Mẫu cửa': 'Cửa đi mở quay 1 cánh · phiên bản 1',
      'Rộng × Cao': '800 × 2200 mm',
      'Số bộ': '2 bộ',
      'Khe hở chân': '8 mm',
      'Hướng mở': 'Mở vào trong',
      'Loại kính': 'Kính trắng 8 ly',
      'Màu nhôm': 'Trắng sữa',
      'Vị trí': 'Tầng 1',
      'Ghi chú': 'Gấp',
    });
    expect(doorSpecs({ ...c.door, color: null, location: '', note: '' }, null, new Map()).map((s) => s.label)).toEqual(['Rộng × Cao', 'Số bộ', 'Màu nhôm']);
  });

  it('chữ phụ của thanh nhôm', () => {
    expect(angleText('45/45')).toBe('45°/45°');
    expect(angleText(undefined)).toBeNull();
    const l = { role: 'a', label: 'A', code: 'X', name: 'X', length: 718, qtyPerSet: 2, qty: 2, totalM: 1.436, kg: 1, cost: 1, sale: 1 };
    expect(profileSubtitle({ ...l, angle: '45/45', position: 'Trên, dưới' })).toBe('Cắt 45°/45° · 2 thanh · Trên, dưới');
    expect(profileSubtitle(l)).toBe('2 thanh');
    expect(perUnit(230000, 'm²')).toBe('230.000\u00a0đ/m²');
    expect(perUnit(120000, 'cái')).toBe('120.000\u00a0đ/cái');
  });

  it('bộ cửa đã xóa hoặc dự án đã xóa thì báo không tìm thấy', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const d = await doors.createDoor(db, p.id, di('D1'));
    await doors.softDeleteDoors(db, [d.id]);
    await expect(computeSingleDoor(db, d.id)).rejects.toBeInstanceOf(NotFoundError);
    await doors.restoreDoor(db, d.id);
    await projects.softDeleteProject(db, p.id);
    await expect(computeSingleDoor(db, d.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(computeSingleDoor(db, 'khong-co')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('mất bản chụp mẫu: vẫn mở được, báo lỗi dữ liệu', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const d = await doors.createDoor(db, p.id, di('D1'));
    await db.run('DELETE FROM template_snapshots');
    const c = await computeSingleDoor(db, d.id);
    expect(c.template).toBeNull();
    expect(c.result.dataErrors[0]).toMatch(/Không có dữ liệu mẫu/);
  });
});
