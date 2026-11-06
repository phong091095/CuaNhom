import { NBSP } from '@matadoor/engine';
import { buildPriceBook, findTemplate, MATERIALS } from '@matadoor/data';
import { doorValues, evaluateDoorForm, fieldOrder, locationSuggestions, newDoorValues, toDoorInput } from '../doorForm';
import type { DoorItem } from '../types';

const BOOK = buildPriceBook(MATERIALS);
const DI = findTemplate('xf55-cua-di-1-canh')!;
const LUA = findTemplate('xf55-cua-so-lua')!;
const sp = (s: string | undefined) => (s ?? '').replaceAll(NBSP, ' ');

describe('form nhập bộ cửa (D5)', () => {
  it('bộ cửa mới: W, H trống; tham số mặc định; kính mặc định hoặc kính dùng lần trước', () => {
    const v = newDoorValues(DI, { symbol: 'D1' });
    expect(v).toMatchObject({ symbol: 'D1', W: '', H: '', qty: 1, params: { kheHoChan: '10', huongMo: '0', benBanLe: '0' }, glass: { kinh: 'KINH-TRANG-8' }, color: null });
    expect(newDoorValues(DI, { symbol: 'D2', lastGlass: { kinh: 'KINH-CL-8' }, color: 'Nâu cà phê' })).toMatchObject({ glass: { kinh: 'KINH-CL-8' }, color: 'Nâu cà phê' });
  });

  it('W/H trống: chưa báo lỗi đỏ cho tới khi chạm ô, nhưng chưa cho lưu', () => {
    const ev = evaluateDoorForm(DI, newDoorValues(DI, { symbol: 'D1' }), BOOK, []);
    expect(ev.errors).toEqual({});
    expect(ev.canSave).toBe(false);
    expect(ev.result).toBeNull();
    const ev2 = evaluateDoorForm(DI, newDoorValues(DI, { symbol: 'D1' }), BOOK, [], { W: true, H: true });
    expect(ev2.errors).toEqual({ W: 'Nhập chiều rộng W (mm), ví dụ 800', H: 'Nhập chiều cao H (mm), ví dụ 2200' });
    expect(ev2.errorCount).toBe(2);
  });

  it('nhận "2012,6" và "800"; tính được và cho lưu', () => {
    const ev = evaluateDoorForm(DI, { ...newDoorValues(DI, { symbol: 'D1' }), W: '800', H: '2200,0' }, BOOK, []);
    expect(ev.canSave).toBe(true);
    expect(ev.input).toMatchObject({ W: 800, H: 2200, qty: 1 });
    expect(ev.result!.profiles.find((p) => p.role === 'canh_ngang')!.length).toBe(718);
  });

  it('số sai dạng: lỗi dưới đúng ô', () => {
    const ev = evaluateDoorForm(DI, { ...newDoorValues(DI, { symbol: 'D1' }), W: '80a', H: '2200,55', params: { kheHoChan: '', huongMo: '0', benBanLe: '0' } }, BOOK, []);
    expect(ev.errors.W).toMatch(/số mm/);
    expect(ev.errors.H).toMatch(/1 chữ số thập phân/);
    expect(ev.errors.kheHoChan).toBe('Nhập khe hở chân');
    expect(ev.canSave).toBe(false);
  });

  it('TC-05: rộng 1500 → lỗi dưới ô W, khóa lưu', () => {
    const ev = evaluateDoorForm(DI, { ...newDoorValues(DI, { symbol: 'D1' }), W: '1500', H: '2200' }, BOOK, []);
    expect(sp(ev.errors.W)).toBe('Rộng cửa đi 1 cánh nên trong khoảng 600–1200 mm');
    expect(ev.canSave).toBe(false);
    expect(ev.errorCount).toBe(1);
  });

  it('TC-06: 900 × 2600 → thông báo 4 bản lề ở khối kiểm tra, vẫn lưu được', () => {
    const ev = evaluateDoorForm(DI, { ...newDoorValues(DI, { symbol: 'D1' }), W: '900', H: '2600' }, BOOK, []);
    expect(ev.general.map((c) => [c.level, sp(c.message)])).toEqual([['info', 'Cửa cao trên 2400 mm nên dùng 4 bản lề (đã tính 4 bản lề)']]);
    expect(ev.canSave).toBe(true);
  });

  it('cảnh báo gắn vào ô (không chặn lưu): cánh lùa rộng hơn 1000 mm', () => {
    const v = { ...newDoorValues(LUA, { symbol: 'S1' }), W: '2300', H: '1400' };
    const ev = evaluateDoorForm(LUA, v, BOOK, []);
    expect(ev.canSave).toBe(true);
    expect(ev.general.some((c) => c.level === 'warning' && /Cánh rộng/.test(c.message))).toBe(true);
  });

  it('ký hiệu trùng trong dự án', () => {
    const ev = evaluateDoorForm(DI, { ...newDoorValues(DI, { symbol: 'd1' }), W: '800', H: '2200' }, BOOK, ['D1']);
    expect(ev.errors.symbol).toBe('Ký hiệu “d1” đã có trong dự án');
    expect(ev.canSave).toBe(false);
  });

  it('số bộ ngoài khoảng', () => {
    const ev = evaluateDoorForm(DI, { ...newDoorValues(DI, { symbol: 'D1' }), W: '800', H: '2200', qty: 0 }, BOOK, []);
    expect(ev.errors.qty).toMatch(/1 đến 999/);
  });

  it('đổi số cánh của cửa lùa đổi kết quả (tham số lựa chọn)', () => {
    const v = { ...newDoorValues(LUA, { symbol: 'S1' }), W: '2500', H: '1350', params: { soCanh: '4' } };
    const ev = evaluateDoorForm(LUA, v, BOOK, []);
    expect(ev.result!.glass[0]).toMatchObject({ width: 525, height: 1172, qty: 4 });
  });

  it('chuyển sang đầu vào lưu DB; mở lại để sửa ra đúng giá trị', () => {
    const v = { ...newDoorValues(DI, { symbol: 'D1' }), W: '850', H: '2250', qty: 2, params: { kheHoChan: '8,5', huongMo: '1', benBanLe: '0' }, color: 'Ghi xám', location: 'Tầng 2' };
    const ev = evaluateDoorForm(DI, v, BOOK, []);
    const input = toDoorInput(DI, v, ev);
    expect(input).toMatchObject({ symbol: 'D1', templateId: DI.id, templateVersion: DI.version, W: 850, H: 2250, qty: 2, params: { kheHoChan: 8.5, huongMo: 1, benBanLe: 0 }, color: 'Ghi xám', location: 'Tầng 2' });
    const door: DoorItem = { ...input, id: 'x', projectId: 'p', params: input.params!, glass: input.glass!, color: 'Ghi xám', location: 'Tầng 2', note: null, sortOrder: 1, createdAt: 0, updatedAt: 0, deletedAt: null };
    expect(doorValues(door, DI)).toMatchObject({ W: '850', H: '2250', qty: 2, params: { kheHoChan: '8,5', huongMo: '1' }, location: 'Tầng 2', note: '' });
    expect(() => toDoorInput(DI, newDoorValues(DI, { symbol: 'D1' }), evaluateDoorForm(DI, newDoorValues(DI, { symbol: 'D1' }), BOOK, []))).toThrow();
  });

  it('thứ tự ô để nhảy tới lỗi đầu tiên', () => {
    expect(fieldOrder(DI)).toEqual(['symbol', 'qty', 'huongMo', 'benBanLe', 'W', 'H', 'kheHoChan', 'glass.kinh']);
  });

  it('NFR-PER-01: đánh giá form (đọc số + tính một bộ) đủ nhanh để cập nhật mỗi lần gõ', () => {
    const v = { ...newDoorValues(LUA, { symbol: 'S1' }), W: '2500', H: '1350', params: { soCanh: '4' } };
    evaluateDoorForm(LUA, v, BOOK, []);
    const n = 200;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) evaluateDoorForm(LUA, { ...v, W: String(2000 + i) }, BOOK, ['S2']);
    const avg = (performance.now() - t0) / n;
    // Máy chạy test nhanh hơn máy chuẩn Helio G85 cỡ 5–10 lần: 5 ms ở đây ≈ ≤ 50 ms trên máy chuẩn.
    expect(avg).toBeLessThan(5);
  });

  it('vị trí gợi ý: đã dùng trước, rồi vị trí thường gặp, không trùng, tối đa 8', () => {
    expect(locationSuggestions(['Tầng 2 – P. ngủ', null, 'Tầng 1', ''])).toEqual(['Tầng 2 – P. ngủ', 'Tầng 1', 'Tầng 2', 'P. khách', 'P. ngủ', 'Bếp', 'WC', 'Ban công']);
  });
});
