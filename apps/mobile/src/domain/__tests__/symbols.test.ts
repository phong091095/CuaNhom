import { isSymbolTaken, nextSymbol, normalizeSymbol, parseSymbol, validateSymbol } from '../symbols';

describe('ký hiệu bộ cửa (FR-DOR-02)', () => {
  it('tách tiền tố và số', () => {
    expect(parseSymbol('D12')).toEqual({ prefix: 'D', n: 12 });
    expect(parseSymbol(' CD3 ')).toEqual({ prefix: 'CD', n: 3 });
    expect(parseSymbol('Cửa chính')).toEqual({ prefix: 'Cửa chính', n: null });
  });

  it('số mới = số lớn nhất cùng tiền tố + 1, không lấp chỗ trống', () => {
    expect(nextSymbol('D', [])).toBe('D1');
    expect(nextSymbol('D', ['D1', 'D3', 'S9', 'd5'])).toBe('D6');
    expect(nextSymbol('S', ['D1', 'D3'])).toBe('S1');
  });

  it('so trùng không phân biệt hoa thường và khoảng trắng', () => {
    expect(normalizeSymbol(' d1 ')).toBe('D1');
    expect(isSymbolTaken('d1', ['D1'])).toBe(true);
    expect(validateSymbol('', [])).toMatch(/Nhập ký hiệu/);
    expect(validateSymbol('D1', ['d1 '])).toBe('Ký hiệu “D1” đã có trong dự án');
    expect(validateSymbol('X'.repeat(13), [])).toMatch(/tối đa 12/);
    expect(validateSymbol('D2', ['D1'])).toBeNull();
  });
});
