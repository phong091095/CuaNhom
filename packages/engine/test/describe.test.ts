import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeExpr } from '../src/expr/describe';

const NAMES: Record<string, string> = { W: 'Rộng', H: 'Cao', soCanh: 'Số cánh', canh_ngang: 'Cánh ngang', khungChiem: '36' };
const n = (v: string) => NAMES[v] ?? v;

describe('biểu thức sang chữ (D4)', () => {
  it('so sánh và logic', () => {
    assert.equal(describeExpr('soCanh == 2 and W < 800', n), 'Số cánh = 2 và Rộng < 800');
    assert.equal(describeExpr('W < 600 or W > 1200', n), 'Rộng < 600 hoặc Rộng > 1200');
    assert.equal(describeExpr('W <= 600 or not (H >= 2400)', n), 'Rộng ≤ 600 hoặc không (Cao ≥ 2400)');
    assert.equal(describeExpr('soCanh != 4', n), 'Số cánh ≠ 4');
  });

  it('phép tính với ký hiệu × ÷ −, chỉ thêm ngoặc khi cần', () => {
    assert.equal(describeExpr('W - khungChiem * 2 - 5 * 2', n), 'Rộng − 36 × 2 − 5 × 2');
    assert.equal(describeExpr('(W - 78 + 39) / soCanh', n), '(Rộng − 78 + 39) ÷ Số cánh');
    assert.equal(describeExpr('W - (H - 1)', n), 'Rộng − (Cao − 1)');
    assert.equal(describeExpr('(W + H) * 2', n), '(Rộng + Cao) × 2');
    assert.equal(describeExpr('-W + 1', n), '−Rộng + 1');
    assert.equal(describeExpr('2012.6', n), '2012,6');
    assert.equal(describeExpr(36, n), '36');
  });

  it('điều kiện và hàm', () => {
    assert.equal(describeExpr('H > 2400 ? 4 : 3', n), 'nếu Cao > 2400 thì 4, không thì 3');
    assert.equal(describeExpr('round((2 * H + W) / 520)', n), 'làm tròn((2 × Cao + Rộng) ÷ 520)');
    assert.equal(describeExpr('max(W, H) + ceil(1.5) + floor(2) + min(1, 2) + abs(-3)', n), 'lớn nhất(Rộng; Cao) + làm tròn lên(1,5) + làm tròn xuống(2) + nhỏ nhất(1; 2) + trị tuyệt đối(−3)');
  });

  it('không có bảng tên thì giữ tên biến; biểu thức sai trả nguyên văn', () => {
    assert.equal(describeExpr('W + 1'), 'W + 1');
    assert.equal(describeExpr('1 +'), '1 +');
  });
});
