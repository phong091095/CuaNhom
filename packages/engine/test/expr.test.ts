import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compile, evaluate, ExprError } from '../src/expr';

const ev = (src: string | number, scope: Record<string, number> = {}) => evaluate(src, scope);

describe('biểu thức – tính toán (BR-12)', () => {
  it('số, cộng trừ nhân chia, thứ tự ưu tiên', () => {
    assert.equal(ev('1 + 2 * 3'), 7);
    assert.equal(ev('(1 + 2) * 3'), 9);
    assert.equal(ev('10 - 4 - 3'), 3);
    assert.equal(ev('100 / 4 / 5'), 5);
    assert.equal(ev('2012.6'), 2012.6);
    assert.equal(ev('.5 + .5'), 1);
    assert.equal(ev(42), 42);
  });

  it('dấu trừ một ngôi và ký hiệu Unicode × ÷ −', () => {
    assert.equal(ev('-3 + 5'), 2);
    assert.equal(ev('--3'), 3);
    assert.equal(ev('+3'), 3);
    assert.equal(ev('W − 36×2 − 5×2', { W: 800 }), 718);
    assert.equal(ev('10 ÷ 4'), 2.5);
  });

  it('biến, ví dụ công thức SRS 4.1', () => {
    assert.equal(ev('W - khungChiem*2 - 5*2', { W: 800, khungChiem: 36 }), 718);
    assert.equal(ev('nep_ngang + 30', { nep_ngang: 544 }), 574);
  });

  it('so sánh trả về 1/0, kể cả ≤ ≥ ≠ và "=" một dấu', () => {
    assert.equal(ev('3 > 2'), 1);
    assert.equal(ev('3 < 2'), 0);
    assert.equal(ev('2 <= 2'), 1);
    assert.equal(ev('2 >= 3'), 0);
    assert.equal(ev('2 == 2'), 1);
    assert.equal(ev('2 != 2'), 0);
    assert.equal(ev('2 ≤ 3'), 1);
    assert.equal(ev('2 ≥ 3'), 0);
    assert.equal(ev('2 ≠ 3'), 1);
    assert.equal(ev('soCanh = 2', { soCanh: 2 }), 1);
    assert.equal(ev('0.1 + 0.2 == 0.3'), 1, 'so bằng có dung sai dấu phẩy động');
  });

  it('và / hoặc / không, kể cả && || !', () => {
    assert.equal(ev('1 and 0'), 0);
    assert.equal(ev('1 and 2'), 1);
    assert.equal(ev('0 or 0'), 0);
    assert.equal(ev('0 or 3'), 1);
    assert.equal(ev('not 0'), 1);
    assert.equal(ev('not 5'), 0);
    assert.equal(ev('1 && 1 || 0'), 1);
    assert.equal(ev('!1'), 0);
    assert.equal(ev('W < 600 or W > 1200', { W: 1500 }), 1);
    assert.equal(ev('W < 600 or W > 1200', { W: 900 }), 0);
  });

  it('và/hoặc tính tắt: không tính vế sau khi đã biết kết quả', () => {
    assert.equal(ev('0 and x', {}), 0);
    assert.equal(ev('1 or x', {}), 1);
  });

  it('toán tử ba ngôi, lồng nhau, ví dụ soBanLe', () => {
    assert.equal(ev('H > 2400 ? 4 : 3', { H: 2600 }), 4);
    assert.equal(ev('H > 2400 ? 4 : 3', { H: 2200 }), 3);
    assert.equal(ev('x > 2 ? 1 : x > 1 ? 2 : 3', { x: 1.5 }), 2);
    assert.equal(ev('soCanh == 4 ? 1 : 0', { soCanh: 2 }), 0);
  });

  it('hàm ceil floor round min max abs', () => {
    assert.equal(ev('ceil(8.64)'), 9);
    assert.equal(ev('floor(8.64)'), 8);
    assert.equal(ev('round(2.5)'), 3);
    assert.equal(ev('round(-2.5)'), -3);
    assert.equal(ev('round(2012.65, 1)'), 2012.7);
    assert.equal(ev('min(3, 1, 2)'), 1);
    assert.equal(ev('max(3, 1, 2)'), 3);
    assert.equal(ev('abs(-4)'), 4);
    assert.equal(ev('max(W, H) / 2', { W: 800, H: 2200 }), 1100);
  });

  it('liệt kê biến dùng tới', () => {
    const c = compile('max(W, H) > 2400 ? soCanh * 2 : khe');
    assert.deepEqual([...c.vars].sort(), ['H', 'W', 'khe', 'soCanh']);
  });

  it('bộ nhớ đệm trả về cùng đối tượng cho cùng chuỗi', () => {
    assert.equal(compile('W + 1'), compile('W + 1'));
  });
});

describe('biểu thức – lỗi', () => {
  const code = (fn: () => unknown) => {
    try {
      fn();
    } catch (e) {
      assert.ok(e instanceof ExprError, 'phải là ExprError');
      return e.code;
    }
    assert.fail('không ném lỗi');
  };

  it('biến chưa định nghĩa là lỗi dữ liệu', () => {
    assert.equal(code(() => ev('W + x', { W: 1 })), 'undefined-var');
  });

  it('không đọc biến từ prototype (constructor, __proto__, toString)', () => {
    assert.equal(code(() => ev('constructor')), 'undefined-var');
    assert.equal(code(() => ev('toString')), 'undefined-var');
    assert.equal(code(() => ev('__proto__')), 'undefined-var');
  });

  it('hàm lạ và sai số tham số', () => {
    assert.equal(code(() => compile('eval(1)')), 'unknown-fn');
    assert.equal(code(() => compile('sqrt(4)')), 'unknown-fn');
    assert.equal(code(() => compile('ceil(1, 2)')), 'arity');
    assert.equal(code(() => compile('min()')), 'arity');
  });

  it('cú pháp sai có vị trí', () => {
    assert.equal(code(() => compile('')), 'syntax');
    assert.equal(code(() => compile('1 +')), 'syntax');
    assert.equal(code(() => compile('(1 + 2')), 'syntax');
    assert.equal(code(() => compile('1 2')), 'syntax');
    assert.equal(code(() => compile('a ? b')), 'syntax');
    assert.equal(code(() => compile('1 < 2 < 3')), 'syntax');
    assert.equal(code(() => compile('W; alert(1)')), 'syntax');
    assert.equal(code(() => compile('"abc"')), 'syntax');
    assert.equal(code(() => compile('max(1,')), 'syntax');
    assert.equal(code(() => compile(')')), 'syntax');
    try {
      compile('1 + * 2');
    } catch (e) {
      assert.ok(e instanceof ExprError);
      assert.equal(e.pos, 4);
      assert.match(e.message, /vị trí 5/);
    }
  });

  it('chia cho 0 và số không hợp lệ', () => {
    assert.equal(code(() => ev('1 / (W - W)', { W: 3 })), 'div-zero');
    assert.equal(code(() => compile(Number.NaN)), 'not-finite');
  });
});
