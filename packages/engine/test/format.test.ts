import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatArea,
  formatKg,
  formatMeters,
  formatMm,
  formatMoney,
  formatMoneyPerM2,
  formatNumber,
  formatPercent,
  formatQty,
  formatSize,
  matchesSearch,
  NBSP,
  normalizeSearch,
  parseDecimal,
  parseMoney,
  slugify,
} from '../src/format';
import { ceilEps, ceilTo, roundHalfAway, roundMm, roundMoney } from '../src/round';

const sp = (s: string) => s.replaceAll(NBSP, ' ');

describe('làm tròn', () => {
  it('nửa ra xa số 0 theo số thập phân như Excel', () => {
    assert.equal(roundHalfAway(2012.65, 1), 2012.7);
    assert.equal(roundHalfAway(1.005, 2), 1.01);
    assert.equal(roundHalfAway(0.5), 1);
    assert.equal(roundHalfAway(2.5), 3);
    assert.equal(roundHalfAway(-2.5), -3);
    assert.equal(roundHalfAway(-0.4), 0);
    assert.equal(roundHalfAway(0), 0);
    assert.equal(roundHalfAway(1e21, 1), 1e21);
    assert.equal(roundHalfAway(1e-7, 2), 0);
    assert.ok(Number.isNaN(roundHalfAway(Number.NaN)));
    assert.equal(roundMm(2012.649), 2012.6);
    assert.equal(roundMoney(1234.5), 1235);
  });

  it('làm tròn lên bỏ qua sai số dưới 1e-9 (BR-04)', () => {
    assert.equal(ceilEps(8.64), 9);
    assert.equal(ceilEps(3), 3);
    assert.equal(ceilEps(3 + 1e-12), 3);
    assert.equal(ceilEps(0.1 * 3 * 10), 3, '0,1×3×10 = 3,0000000000000004 vẫn lấy 3');
    assert.equal(ceilEps(17.3364), 18);
  });

  it('làm tròn lên bội số', () => {
    assert.equal(ceilTo(2_361_440.6, 10_000), 2_370_000);
    assert.equal(ceilTo(2_360_000, 10_000), 2_360_000);
    assert.throws(() => ceilTo(1, 0), RangeError);
  });
});

describe('định dạng (NFR-USE-03)', () => {
  it('tiền: 1.234.567 đ với khoảng trắng không ngắt', () => {
    assert.equal(formatMoney(1234567), `1.234.567${NBSP}đ`);
    assert.equal(formatMoney(1234567.5), `1.234.568${NBSP}đ`);
    assert.equal(formatMoney(0), `0${NBSP}đ`);
    assert.equal(formatMoney(-1500), `-1.500${NBSP}đ`);
    assert.equal(sp(formatMoneyPerM2(2_370_000)), '2.370.000 đ/m²');
  });

  it('mm không có dấu ngăn nghìn', () => {
    assert.equal(sp(formatMm(2200)), '2200 mm');
    assert.equal(sp(formatMm(2012.6)), '2012,6 mm');
    assert.equal(sp(formatMm(12000)), '12000 mm');
    assert.equal(sp(formatSize(800, 2200)), '800 × 2200 mm');
    assert.ok(!formatSize(800, 2200).includes(' '), 'không có khoảng trắng thường');
  });

  it('diện tích, kg, mét, %, số lượng', () => {
    assert.equal(sp(formatArea(7.465)), '7,465 m²');
    assert.equal(sp(formatArea(1.76)), '1,76 m²');
    assert.equal(sp(formatKg(92.834)), '92,83 kg');
    assert.equal(sp(formatMeters(11.62)), '11,62 m');
    assert.equal(formatPercent(0.0729, 2), '7,29%');
    assert.equal(formatPercent(0.1), '10%');
    assert.equal(sp(formatQty(8.64, 'chai')), '8,64 chai');
    assert.equal(formatNumber(1234.5, { maxDecimals: 1 }), '1.234,5');
    assert.equal(formatNumber(1.5, { maxDecimals: 2, minDecimals: 2 }), '1,50');
    assert.equal(formatNumber(Number.NaN), '—');
  });

  it('đọc số người dùng gõ: dấu phẩy hoặc chấm, 1 chữ số thập phân', () => {
    assert.equal(parseDecimal('2200'), 2200);
    assert.equal(parseDecimal(' 2012,6 '), 2012.6);
    assert.equal(parseDecimal('2012.6'), 2012.6);
    assert.equal(parseDecimal('2012,65'), null);
    assert.equal(parseDecimal('2012,65', { maxDecimals: 2 }), 2012.65);
    assert.equal(parseDecimal(''), null);
    assert.equal(parseDecimal('abc'), null);
    assert.equal(parseDecimal('12a'), null);
    assert.equal(parseDecimal('3', { maxDecimals: 0 }), 3);
    assert.equal(parseDecimal('3,5', { maxDecimals: 0 }), null);
  });

  it('đọc số tiền', () => {
    assert.equal(parseMoney('1.234.567'), 1234567);
    assert.equal(parseMoney('1 234 567 đ'), 1234567);
    assert.equal(parseMoney('250000'), 250000);
    assert.equal(parseMoney(''), null);
    assert.equal(parseMoney('12a'), null);
  });
});

describe('tìm kiếm bỏ dấu', () => {
  it('xing fa, XINGFA, Xingfa đều khớp', () => {
    for (const q of ['xing fa', 'xingfa', 'Xingfa', 'XINGFA']) {
      assert.ok(matchesSearch(q, 'Nhôm Xingfa 55'), q);
    }
  });

  it('tiếng Việt có dấu, đ/Đ', () => {
    assert.equal(normalizeSearch('Anh Đoài – Đồng Nai'), 'anhdoaidongnai');
    assert.ok(matchesSearch('dong nai', '53 Bình Hạ, Đồng Nai'));
    assert.ok(matchesSearch('doai', null, undefined, 'Anh Đoài'));
    assert.ok(!matchesSearch('hanh', 'Anh Đoài'));
    assert.ok(matchesSearch('', 'bất kỳ'));
  });

  it('mã nhôm có gạch nối', () => {
    assert.ok(matchesSearch('xf c3328', 'XF-C3328'));
    assert.ok(matchesSearch('c3328', 'XF-C3328'));
  });

  it('tên file an toàn', () => {
    assert.equal(slugify('Nhà anh Tuấn – Đồng Nai!'), 'nha-anh-tuan-dong-nai');
  });
});
