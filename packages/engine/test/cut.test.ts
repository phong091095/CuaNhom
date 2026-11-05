import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CUT_SETTINGS, optimizeAll, optimizeCuts, usableLength, validateCutSettings } from '../src/cut';
import type { CutPiece } from '../src/cut';

const piece = (length: number, symbol = 'D1', role = 'r'): CutPiece => ({ length, symbol, role, label: role });

describe('tối ưu cắt FFD (SRS 4.3)', () => {
  const S = { barLength: 5800, kerf: 4, trim: 10 };

  it('phần dùng được = dài cây − 2 × bỏ đầu', () => {
    assert.equal(usableLength(S), 5780);
  });

  it('xếp đoạn dài trước, mạch cưa tính cho mỗi đoạn sau đoạn đầu', () => {
    const plan = optimizeCuts('C1', [piece(2000), piece(3000), piece(772)], S);
    assert.equal(plan.bars.length, 1);
    const b = plan.bars[0]!;
    assert.deepEqual(
      b.pieces.map((p) => p.length),
      [3000, 2000, 772],
    );
    assert.equal(b.kerfLength, 8);
    assert.equal(b.piecesLength, 5780 - 8);
    assert.equal(b.remaining, 0);
    // Kiểm tra mỗi cây: đoạn + mạch cưa (n−1) + bỏ đầu 2 × trim + dư = dài cây
    assert.equal(b.piecesLength + b.kerfLength + 2 * S.trim + b.remaining, S.barLength);
  });

  it('không đủ chỗ cho mạch cưa thì mở cây mới', () => {
    const plan = optimizeCuts('C1', [piece(3000), piece(2780)], S);
    assert.equal(plan.bars.length, 2, '3000 + 4 + 2780 = 5784 > 5780');
    const plan2 = optimizeCuts('C1', [piece(3000), piece(2776)], S);
    assert.equal(plan2.bars.length, 1, '3000 + 4 + 2776 = 5780 vừa khít');
  });

  it('first fit: đoạn nhỏ lấp vào cây đầu còn chỗ', () => {
    const plan = optimizeCuts('C1', [piece(4000), piece(4000), piece(1700), piece(1700)], S);
    assert.equal(plan.bars.length, 2);
    assert.deepEqual(
      plan.bars.map((b) => b.pieces.map((p) => p.length)),
      [
        [4000, 1700],
        [4000, 1700],
      ],
    );
  });

  it('đoạn dài hơn phần dùng được bị báo riêng (FR-CUT-03, TC-10)', () => {
    const plan = optimizeCuts('C3328', [piece(2200, 'D1', 'khung_dung'), piece(800)], {
      barLength: 2000,
      kerf: 4,
      trim: 10,
    });
    assert.equal(plan.tooLong.length, 1);
    assert.equal(plan.tooLong[0]!.length, 2200);
    assert.equal(plan.bars.length, 1);
  });

  it('hao hụt = 1 − tổng đoạn / (số cây × dài cây); cận dưới', () => {
    const plan = optimizeCuts('C1', [piece(2880), piece(2880), piece(2880)], S);
    assert.equal(plan.bars.length, 2, '2880 + 4 + 2880 = 5764 ≤ 5780: hai đoạn một cây');
    assert.equal(plan.totalLength, 8640);
    assert.equal(plan.lowerBound, 2);
    assert.ok(Math.abs(plan.waste - (1 - 8640 / 11600)) < 1e-12);
    const plan2 = optimizeCuts('C1', [piece(2900), piece(2900), piece(2900)], S);
    assert.equal(plan2.bars.length, 3, '2900 + 4 + 2900 = 5804 > 5780: mỗi đoạn một cây');
  });

  it('không có đoạn nào', () => {
    const plan = optimizeCuts('C1', [], S);
    assert.equal(plan.bars.length, 0);
    assert.equal(plan.waste, 0);
    assert.equal(plan.lowerBound, 0);
  });

  it('kết quả ổn định khi đoạn bằng nhau (xếp theo ký hiệu)', () => {
    const plan = optimizeCuts('C1', [piece(1000, 'D10'), piece(1000, 'D2'), piece(1000, 'D1')], S);
    assert.deepEqual(
      plan.bars[0]!.pieces.map((p) => p.symbol),
      ['D1', 'D2', 'D10'],
    );
  });

  it('thiết lập cắt không hợp lệ', () => {
    assert.deepEqual(validateCutSettings(DEFAULT_CUT_SETTINGS), []);
    assert.equal(validateCutSettings({ barLength: 0, kerf: -1, trim: -1 }).length, 3);
    assert.deepEqual(validateCutSettings({ barLength: 100, kerf: 4, trim: 60 }), ['Phần bỏ hai đầu lớn hơn chiều dài cây']);
    assert.throws(() => optimizeCuts('C', [piece(1)], { barLength: 0, kerf: 4, trim: 10 }), RangeError);
  });

  it('tối ưu nhiều nhóm theo thứ tự mã', () => {
    const groups = new Map([
      ['C3328', [piece(2200)]],
      ['C3303', [piece(2149)]],
    ]);
    const plans = optimizeAll(groups, S);
    assert.deepEqual(
      plans.map((p) => p.code),
      ['C3303', 'C3328'],
    );
  });
});

describe('chất lượng cắt (SRS 4.3)', () => {
  // Bộ sinh số giả ngẫu nhiên có hạt giống để test lặp lại được.
  function rng(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 2 ** 32;
    };
  }
  const S = { barLength: 5800, kerf: 4, trim: 10 };

  type Kind = 'khung-cua-di' | 'canh-cua-di' | 'cua-lua' | 'hon-hop';
  /** Đoạn của MỘT mã nhôm trong một dự án ngẫu nhiên dưới 50 bộ, kích thước kiểu cửa thật. */
  function project(rand: () => number, kind: Kind): CutPiece[] {
    const out: CutPiece[] = [];
    const doors = 1 + Math.floor(rand() * 49);
    for (let d = 0; d < doors; d++) {
      const sym = `D${d + 1}`;
      const add = (len: number, n: number) => {
        for (let i = 0; i < n; i++) out.push(piece(Math.round(len * 10) / 10, sym));
      };
      if (kind === 'khung-cua-di') {
        const W = 600 + Math.round(rand() * 600);
        const H = 1900 + Math.round(rand() * 900);
        add(H, 2);
        add(W, 1);
      } else if (kind === 'canh-cua-di') {
        const W = 600 + Math.round(rand() * 600);
        const H = 1900 + Math.round(rand() * 900);
        add(H - 51, 2);
        add(W - 82, 2);
      } else if (kind === 'cua-lua') {
        const W = 1200 + Math.round(rand() * 2400);
        const H = 600 + Math.round(rand() * 1400);
        const n = rand() < 0.5 ? 2 : 4;
        add(H - 78, 2 * n);
        add((W - 78 + (39 * n) / 2) / n, 2 * n);
      } else {
        const W = 600 + Math.round(rand() * 2400);
        const H = 1000 + Math.round(rand() * 1800);
        add(H, 2);
        add(W, 2);
        add(Math.max(200, H - 51), 2);
        add(Math.max(200, W / 2 - 40), 2);
      }
    }
    return out;
  }

  it('không bao giờ dùng nhiều cây hơn FFD; không ít hơn cận dưới', () => {
    const rand = rng(1);
    for (const kind of ['khung-cua-di', 'canh-cua-di', 'cua-lua', 'hon-hop'] as Kind[]) {
      for (let k = 0; k < 40; k++) {
        const plan = optimizeCuts('X', project(rand, kind), S);
        assert.ok(plan.bars.length <= plan.ffdBars, `${kind} ${k}`);
        assert.ok(plan.bars.length >= plan.lowerBoundStrong && plan.lowerBoundStrong >= plan.lowerBound);
        // Mọi cây hợp lệ: đoạn + mạch cưa ≤ phần dùng được
        for (const b of plan.bars) assert.ok(b.remaining >= -1e-6);
      }
    }
  });

  it('đủ mọi đoạn, không mất, không trùng', () => {
    const ps = project(rng(2), 'hon-hop');
    const plan = optimizeCuts('X', ps, S);
    const placed = plan.bars.flatMap((b) => b.pieces);
    assert.equal(placed.length + plan.tooLong.length, ps.length);
    assert.deepEqual(
      placed.map((p) => p.length).sort((a, b) => a - b),
      ps.map((p) => p.length).sort((a, b) => a - b),
    );
  });

  it('cùng đầu vào cho cùng sơ đồ cắt (thứ tự đầu vào khác nhau)', () => {
    const ps = project(rng(3), 'cua-lua');
    const a = optimizeCuts('X', ps, S);
    const b = optimizeCuts('X', [...ps].reverse(), S);
    assert.deepEqual(
      a.bars.map((x) => x.pieces.map((p) => `${p.symbol}:${p.length}`)),
      b.bars.map((x) => x.pieces.map((p) => `${p.symbol}:${p.length}`)),
    );
  });

  it('ví dụ cho thấy tiêu chí "≤ cận dưới SRS + 1" không phải lúc nào cũng đạt được', () => {
    // 49 cửa đi 1200 × 2800: 98 thanh 2800 (một cây chỉ chứa được 2 thanh, dư 176 mm – không thanh 1200 nào vừa)
    // và 49 thanh 1200 (tối đa 4 thanh một cây). Tối ưu thật = 49 + ceil(49 / 4) = 62 cây,
    // trong khi cận dưới SRS = ceil(333200 / 5780) = 58. Không thuật toán nào đạt ≤ 59.
    const ps: CutPiece[] = [];
    for (let d = 1; d <= 49; d++) ps.push(piece(2800, `D${d}`), piece(2800, `D${d}`), piece(1200, `D${d}`));
    const plan = optimizeCuts('C3328', ps, S);
    assert.equal(plan.lowerBound, 58);
    assert.equal(plan.bars.length, 62, 'engine đạt đúng tối ưu');
  });

  it('dự án hỗn hợp dưới 50 bộ: ≤ cận dưới SRS + 1 (200 dự án)', () => {
    const rand = rng(20261105);
    for (let k = 0; k < 200; k++) {
      const plan = optimizeCuts('X', project(rand, 'hon-hop'), S);
      assert.ok(plan.bars.length <= plan.lowerBound + 1, `dự án ${k}: ${plan.bars.length} cây, cận dưới ${plan.lowerBound}`);
    }
  });

  it('cửa lùa: ≤ cận dưới chặt + 1 ở mọi dự án; cửa đi: ≤ cận dưới chặt + 2', () => {
    const rand = rng(7);
    const gap: Record<Kind, number> = { 'khung-cua-di': 0, 'canh-cua-di': 0, 'cua-lua': 0, 'hon-hop': 0 };
    for (const kind of Object.keys(gap) as Kind[]) {
      for (let k = 0; k < 100; k++) {
        const plan = optimizeCuts('X', project(rand, kind), S);
        gap[kind] = Math.max(gap[kind], plan.bars.length - plan.lowerBoundStrong);
      }
    }
    assert.ok(gap['cua-lua'] <= 1, JSON.stringify(gap));
    assert.ok(gap['hon-hop'] <= 1, JSON.stringify(gap));
    assert.ok(gap['canh-cua-di'] <= 2, JSON.stringify(gap));
    assert.ok(gap['khung-cua-di'] <= 3, JSON.stringify(gap));
  });
});
