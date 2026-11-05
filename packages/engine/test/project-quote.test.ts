import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeDoor } from '../src/compute';
import { collectCutPieces, cutGroupKey, summarizeProject, unitPriceForQuote } from '../src/project';
import {
  buildQuoteLines,
  computeQuoteTotals,
  formatQuoteNumber,
  suggestOp2Price,
  validateDiscount,
  validateVatRate,
} from '../src/quote';
import type { QuoteDoorInput } from '../src/quote';
import { BOOK, fixtureTemplate } from './fixtures';

const t = fixtureTemplate();
const d1 = { id: 'a', symbol: 'D1', result: computeDoor(t, { W: 800, H: 2200, qty: 2 }, BOOK) };
const d2 = { id: 'b', symbol: 'D2', color: 'Nâu', result: computeDoor(t, { W: 900, H: 2100, qty: 1 }, BOOK) };

describe('tổng hợp dự án (FR-BOM-04)', () => {
  const s = summarizeProject([d1, d2], BOOK);

  it('số bộ, diện tích, giá vốn cộng theo từng bộ', () => {
    assert.equal(s.doors, 2);
    assert.equal(s.sets, 3);
    assert.ok(Math.abs(s.area - (1.76 * 2 + 1.89)) < 1e-9);
    assert.ok(Math.abs(s.cost.total - (d1.result.cost.total + d2.result.cost.total)) < 1e-6);
    assert.deepEqual(s.invalidDoors, []);
  });

  it('phụ kiện: cộng số lẻ các bộ rồi mới làm tròn lên (BR-04)', () => {
    const keo = s.accessories.find((a) => a.code === 'KEO')!;
    const raw = d1.result.accessories.find((a) => a.code === 'KEO')!.raw + d2.result.accessories.find((a) => a.code === 'KEO')!.raw;
    assert.ok(Math.abs(keo.raw - raw) < 1e-9);
    assert.equal(keo.qty, Math.ceil(raw - 1e-9));
    assert.equal(keo.cost, keo.qty * 50_000);
    assert.deepEqual(
      keo.items.map((i) => i.symbol),
      ['D1', 'D2'],
    );
  });

  it('nhôm tách theo màu (cây khác màu là hàng khác)', () => {
    const keys = s.profiles.map((p) => p.key);
    assert.ok(keys.includes('KHUNG'));
    assert.ok(keys.includes(cutGroupKey('KHUNG', 'Nâu')));
    assert.equal(cutGroupKey('KHUNG', 'Nâu'), 'KHUNG · Nâu');
  });

  it('kính gom theo mã, ghi từng bộ', () => {
    assert.equal(s.glass.length, 1);
    assert.equal(s.glass[0]!.panes, 2 * 2 + 2);
    assert.equal(s.glass[0]!.items.length, 2);
  });

  it('nhân công cộng theo m²', () => {
    assert.ok(Math.abs(s.labor[0]!.qty - s.area) < 1e-9);
  });

  it('OP1 = Σ giá bán 1 bộ làm tròn × số bộ', () => {
    assert.equal(s.op1, unitPriceForQuote(d1.result) * 2 + unitPriceForQuote(d2.result));
  });

  it('bộ cửa lỗi được liệt kê; lỗi dữ liệu thì không cộng', () => {
    const bad = { id: 'c', symbol: 'D3', result: computeDoor(t, { W: 1500, H: 2200, qty: 1 }, BOOK) };
    const broken = { id: 'd', symbol: 'D4', result: { ...d1.result, dataErrors: ['x'] } };
    const s2 = summarizeProject([d1, bad, broken], BOOK);
    assert.deepEqual(s2.invalidDoors, ['D3', 'D4']);
    assert.equal(s2.sets, 3);
  });
});

describe('đoạn cắt của dự án', () => {
  it('mỗi thanh của mỗi bộ là một đoạn, có ký hiệu bộ cửa (FR-BOM-05)', () => {
    const g = collectCutPieces([d1, d2]);
    const khung = g.get('KHUNG')!;
    assert.equal(khung.length, (2 + 1) * 2);
    assert.ok(khung.every((p) => p.symbol === 'D1'));
    assert.equal(g.get('KHUNG · Nâu')!.length, 3);
    assert.equal(khung.find((p) => p.role === 'khung_dung')!.angle, '45/45');
  });
});

describe('báo giá OP1/OP2 (FR-QUO-01, BR-10)', () => {
  it('TC-07: OP1 17.628.149 đ trên 7,465 m² → gợi ý 2.370.000 đ/m²', () => {
    assert.equal(suggestOp2Price(17_628_149, 7.465), 2_370_000);
  });

  it('diện tích 0 → không gợi ý', () => {
    assert.equal(suggestOp2Price(1000, 0), 0);
  });

  const doors: QuoteDoorInput[] = [
    { id: 'a', symbol: 'D1', name: 'Cửa đi', W: 800, H: 2200, qty: 2, area: 3.52, salePerSet: 1_234_567.6, costPerSet: 1_000_000 },
    { id: 'b', symbol: 'S1', name: 'Cửa sổ', W: 1400, H: 1350, qty: 1, area: 1.89, salePerSet: 999_999.4, costPerSet: 800_000 },
  ];

  it('OP1: đơn giá làm tròn đến đồng, thành tiền = đơn giá × số bộ', () => {
    const lines = buildQuoteLines(doors, 'op1');
    assert.equal(lines[0]!.unitPrice, 1_234_568);
    assert.equal(lines[0]!.total, 2_469_136);
    assert.equal(lines[1]!.total, 999_999);
    assert.equal(lines[0]!.unit, 'bộ');
  });

  it('OP2: đơn giá m² × diện tích từng dòng', () => {
    const lines = buildQuoteLines(doors, 'op2', 1_200_000);
    assert.equal(lines[0]!.unit, 'm²');
    assert.equal(lines[0]!.total, 4_224_000);
    assert.equal(lines[1]!.total, 2_268_000);
  });

  it('tạm tính = tổng các dòng đã in; chiết khấu rồi VAT', () => {
    const lines = buildQuoteLines(doors, 'op1');
    const t1 = computeQuoteTotals(lines, { type: 'percent', value: 5 }, 0.08);
    assert.equal(t1.subtotal, 3_469_135);
    assert.equal(t1.discountAmount, 173_457);
    assert.equal(t1.afterDiscount, 3_295_678);
    assert.equal(t1.vat, 263_654);
    assert.equal(t1.total, 3_559_332);
    const t2 = computeQuoteTotals(lines, { type: 'amount', value: 69_135 }, null);
    assert.equal(t2.total, 3_400_000);
    assert.equal(t2.vat, 0);
    const t3 = computeQuoteTotals(lines, null, 0.1);
    assert.equal(t3.discountAmount, 0);
    assert.equal(t3.vat, 346_914);
  });

  it('chiết khấu, thuế suất không hợp lệ', () => {
    assert.equal(validateDiscount({ type: 'percent', value: 120 }, 100), 'Chiết khấu tối đa 100%');
    assert.equal(validateDiscount({ type: 'amount', value: 200 }, 100), 'Chiết khấu không được lớn hơn tạm tính');
    assert.equal(validateDiscount({ type: 'amount', value: -1 }, 100), 'Chiết khấu không được âm');
    assert.equal(validateDiscount(null, 100), null);
    assert.equal(validateVatRate(1.5), 'Thuế suất VAT phải trong khoảng 0–100%');
    assert.equal(validateVatRate(null), null);
    assert.throws(() => computeQuoteTotals([], { type: 'amount', value: 1 }, null), RangeError);
    assert.throws(() => computeQuoteTotals([], null, -0.1), RangeError);
  });

  it('số báo giá BG-YYMM-NNN', () => {
    assert.equal(formatQuoteNumber(new Date(2026, 10, 5), 1), 'BG-2611-001');
    assert.equal(formatQuoteNumber(new Date(2027, 0, 31), 1234), 'BG-2701-1234');
  });
});
