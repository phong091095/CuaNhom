import { findTemplate } from '@matadoor/data';
import { exprText, paramValueLabel, templateNames } from '../templateText';

const DI = findTemplate('xf55-cua-di-1-canh')!;
const LUA = findTemplate('xf55-cua-so-lua')!;

describe('chữ cho mẫu cửa (D4)', () => {
  it('công thức chiều dài cắt đọc được, hằng số thành số', () => {
    const canh = DI.profiles.find((p) => p.role === 'canh_ngang')!;
    expect(exprText(DI, canh.length)).toBe('Rộng − 36 × 2 − 5 × 2');
    const nep = DI.profiles.find((p) => p.role === 'nep_dung')!;
    expect(exprText(DI, nep.length)).toBe('Cánh đứng − 68,2 × 2');
    expect(exprText(DI, DI.glass[0]!.width)).toBe('Nẹp kính ngang + 15 × 2');
  });

  it('điều kiện kiểm tra và biến dẫn xuất', () => {
    const rong = DI.checks.find((c) => c.id === 'rong')!;
    expect(exprText(DI, rong.when)).toBe('Rộng < 600 hoặc Rộng > 1200');
    expect(exprText(DI, DI.derived[0]!.expr)).toBe('nếu Cao > 2400 thì 4, không thì 3');
    const rong2 = LUA.checks.find((c) => c.id === 'rong2')!;
    expect(exprText(LUA, rong2.when)).toBe('Số cánh = 2 và (Rộng < 800 hoặc Rộng > 2400)');
    expect(exprText(LUA, LUA.profiles.find((p) => p.role === 'trung_gian')!.qty)).toBe('nếu Số cánh = 4 thì 1, không thì 0');
  });

  it('tên biến kính, số thanh, chu vi', () => {
    const n = templateNames(DI);
    expect(n('kinh_weight')).toBe('Khối lượng 1 tấm kính');
    expect(n('canh_ngang_qty')).toBe('Số thanh cánh ngang');
    expect(n('glass_perimeter_total')).toBe('Tổng chu vi kính (mm)');
    expect(n('la')).toBe('la');
  });

  it('nhãn giá trị tham số', () => {
    expect(paramValueLabel(DI, 'huongMo', 1)).toBe('Mở vào trong');
    expect(paramValueLabel(DI, 'kheHoChan', 8.5)).toBe('8,5\u00a0mm');
    expect(paramValueLabel(DI, 'kheHoChan', undefined)).toBe('10\u00a0mm');
    expect(paramValueLabel(LUA, 'soCanh', 4)).toBe('4 cánh');
    expect(paramValueLabel(DI, 'khongCo', 3)).toBe('3');
  });
});
