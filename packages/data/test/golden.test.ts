/**
 * Đáp án mẫu SRS 10.4 (NFR-ACC-01): kích thước cắt nhôm và kính phải khớp 100%.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectCutPieces,
  computeDoor,
  optimizeCuts,
  suggestOp2Price,
  summarizeProject,
  type DoorInput,
  type DoorResult,
} from '@matadoor/engine';
import golden from '../src/golden/srs-tc.json';
import { buildPriceBook, findTemplate, MATERIALS } from '../src/index';

const BOOK = buildPriceBook(MATERIALS);

function run(templateId: string, input: DoorInput): DoorResult {
  const t = findTemplate(templateId);
  assert.ok(t, `không có mẫu ${templateId}`);
  return computeDoor(t, input, BOOK);
}

describe('đáp án mẫu một bộ cửa (TC-01, 02, 03, 05, 06)', () => {
  for (const tc of golden.doors) {
    it(`${tc.id} – ${tc.requirement}`, () => {
      const r = run(tc.template, tc.input as DoorInput);
      assert.deepEqual(r.dataErrors, []);
      const e = tc.expect as {
        ok?: boolean;
        profiles?: Record<string, [number, number]>;
        glass?: Record<string, [number, number, number]>;
        accessories?: Record<string, [number, number]>;
        checks?: [string, string | null, string][];
      };
      if (e.ok !== undefined) assert.equal(r.ok, e.ok);
      for (const [role, [length, qty]] of Object.entries(e.profiles ?? {})) {
        const p = r.profiles.find((x) => x.role === role);
        assert.ok(p, `thiếu thanh ${role}`);
        assert.equal(p.length, length, `${role}: chiều dài`);
        assert.equal(p.qty, qty, `${role}: số thanh`);
      }
      for (const [key, [w, h, qty]] of Object.entries(e.glass ?? {})) {
        const g = r.glass.find((x) => x.key === key);
        assert.ok(g, `thiếu kính ${key}`);
        assert.deepEqual([g.width, g.height, g.qty], [w, h, qty], `kính ${key}`);
      }
      for (const [code, [raw, qty]] of Object.entries(e.accessories ?? {})) {
        const a = r.accessories.find((x) => x.code === code);
        assert.ok(a, `thiếu phụ kiện ${code}`);
        assert.ok(Math.abs(a.raw - raw) < 1e-9, `${code}: số lẻ ${a.raw} ≠ ${raw}`);
        assert.equal(a.qty, qty, `${code}: số lấy`);
      }
      for (const [level, field, text] of e.checks ?? []) {
        assert.ok(
          r.checks.some((c) => c.level === level && (field === null || c.field === field) && c.message.replaceAll('\u00A0', ' ').includes(text)),
          `thiếu kiểm tra ${level} "${text}": ${JSON.stringify(r.checks)}`,
        );
      }
    });
  }
});

describe('đáp án mẫu cấp dự án (TC-04, TC-07)', () => {
  const projectOf = (id: string) => {
    const p = golden.projects.find((x) => x.id === id)!;
    return {
      spec: p,
      doors: p.doors.map((d, i) => ({ id: String(i), symbol: d.symbol, result: run(d.template, d.input as DoorInput) })),
    };
  };

  it('TC-04: nêm kính cộng số lẻ các bộ rồi làm tròn → 18 (không phải 19)', () => {
    const { doors } = projectOf('TC-04');
    const s = summarizeProject(doors, BOOK);
    const nem = s.accessories.find((a) => a.code === 'PK-NEM-5')!;
    assert.equal(nem.qty, 18);
    const perDoor = doors.reduce((sum, d) => sum + d.result.accessories.find((a) => a.code === 'PK-NEM-5')!.qty, 0);
    assert.equal(perDoor, 19, 'nếu làm tròn từng bộ rồi cộng sẽ ra 19 – đây là cách SAI');
  });

  it('TC-07: tổng diện tích 7,465 m²; OP1 17.628.149 đ → đơn giá OP2 gợi ý 2.370.000 đ/m²', () => {
    const { spec, doors } = projectOf('TC-07');
    const expect = spec.expect as { area: number; op1FromSrs: number; op2Suggested: number };
    const s = summarizeProject(doors, BOOK);
    assert.ok(Math.abs(s.area - expect.area) < 1e-9);
    // OP1 của SRS dùng bảng giá trong cửa_mẫu.xlsx (chưa có); bảng giá tạm cho OP1 khác,
    // nên ở đây kiểm quy tắc gợi ý OP2 (BR-10) với đúng số OP1 của SRS.
    assert.equal(suggestOp2Price(expect.op1FromSrs, s.area), expect.op2Suggested);
    assert.ok(s.op1 > 0);
  });
});

describe('đáp án mẫu sơ đồ cắt (TC-10)', () => {
  for (const tc of golden.cut) {
    it(`${tc.id} – báo thanh dài hơn cây nhôm`, () => {
      const r = run(tc.template, tc.input as DoorInput);
      const groups = collectCutPieces([{ id: '1', symbol: 'D1', result: r }]);
      for (const [code, length] of tc.expect.tooLong as [string, number][]) {
        const plan = optimizeCuts(code, groups.get(code)!, tc.settings);
        assert.ok(
          plan.tooLong.some((p) => p.length === length),
          `${code}: phải báo đoạn ${length} mm dài hơn cây ${tc.settings.barLength} mm`,
        );
      }
    });
  }
});
