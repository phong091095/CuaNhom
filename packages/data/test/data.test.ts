import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeDoor, validateTemplate, MATERIAL_GROUPS, TEMPLATE_GROUP_LABELS } from '@matadoor/engine';
import golden from '../src/golden/srs-tc.json';
import {
  buildPriceBook,
  DEFAULT_GROUP_FACTORS,
  findTemplate,
  hasCustomSalePrice,
  MATERIALS,
  pricePerKg,
  salePriceOf,
  SYSTEMS,
  findSystem,
  TEMPLATES,
  toPricedMaterial,
  validateFactor,
  visibleTemplates,
  type MaterialRecord,
} from '../src/index';
import { buildLock, canonicalJson, type LockFile } from '../scripts/lockfile';

const BOOK = buildPriceBook(MATERIALS);

describe('bảng vật tư mặc định', () => {
  it('mã không trùng, nhóm hợp lệ, giá dương', () => {
    const codes = new Set<string>();
    for (const m of MATERIALS) {
      assert.ok(!codes.has(m.code), `trùng mã ${m.code}`);
      codes.add(m.code);
      assert.ok(MATERIAL_GROUPS.includes(m.group), m.code);
      assert.ok(m.costPrice > 0, m.code);
      assert.ok(m.priceStatus === 'that' || m.priceStatus === 'tam', m.code);
    }
  });

  it('nhôm có kg/m và dài cây; kính có độ dày', () => {
    for (const m of MATERIALS) {
      if (m.group === 'nhom') assert.ok(m.kgPerM! > 0 && m.barLengthMm! > 0, m.code);
      if (m.group === 'kinh') assert.ok(m.thicknessMm! > 0, m.code);
    }
  });

  it('có đủ bốn nhóm', () => {
    for (const g of MATERIAL_GROUPS) assert.ok(MATERIALS.some((m) => m.group === g), g);
  });
});

describe('mẫu cửa', () => {
  it('hệ nhôm có danh sách màu gợi ý (tên không trùng, mã màu hợp lệ)', () => {
    for (const sys of SYSTEMS) {
      assert.ok(sys.colors.length > 0, sys.id);
      assert.equal(new Set(sys.colors.map((c) => c.name)).size, sys.colors.length);
      for (const c of sys.colors) assert.match(c.hex, /^#[0-9A-F]{6}$/i);
    }
    assert.equal(findSystem('xingfa55')?.name, 'Xingfa hệ 55');
    assert.equal(findSystem('khong-co'), undefined);
  });

  it('id không trùng, thuộc hệ nhôm có thật, nhóm hợp lệ', () => {
    const ids = new Set<string>();
    for (const t of TEMPLATES) {
      assert.ok(!ids.has(t.id), t.id);
      ids.add(t.id);
      assert.ok(SYSTEMS.some((s) => s.id === t.system), t.id);
      assert.ok(t.group in TEMPLATE_GROUP_LABELS, t.id);
    }
  });

  for (const t of TEMPLATES) {
    it(`${t.id}: dữ liệu hợp lệ (biểu thức, biến, mã vật tư)`, () => {
      assert.deepEqual(validateTemplate(t, BOOK), []);
    });
    it(`${t.id}: kích thước mặc định tính được, không lỗi`, () => {
      const r = computeDoor(t, { W: t.defaults.W, H: t.defaults.H, qty: 1 }, BOOK);
      assert.deepEqual(r.dataErrors, []);
      assert.equal(r.ok, true, JSON.stringify(r.checks));
      assert.ok(r.sale.total > r.cost.total);
    });
  }

  it('mỗi mẫu "verified" có ít nhất một ca đáp án mẫu (SRS 4.4)', () => {
    const used = new Set<string>([
      ...golden.doors.map((d) => d.template),
      ...golden.cut.map((d) => d.template),
      ...golden.projects.flatMap((p) => p.doors.map((d) => d.template)),
    ]);
    for (const t of TEMPLATES.filter((x) => x.status === 'verified')) {
      assert.ok(used.has(t.id), `mẫu ${t.id} chưa có đáp án mẫu`);
    }
  });

  it('bản phát hành chỉ hiện mẫu đã kiểm, xếp theo thứ tự', () => {
    const draft = { ...TEMPLATES[0]!, id: 'nhap', status: 'draft' as const, order: 0 };
    assert.ok(!visibleTemplates(false).some((t) => t.status === 'draft'));
    assert.deepEqual(
      visibleTemplates(true).map((t) => t.id),
      TEMPLATES.map((t) => t.id),
    );
    assert.equal(findTemplate('khong-co'), undefined);
    assert.equal(draft.status, 'draft');
  });
});

describe('khóa phiên bản mẫu (templates.lock.json)', () => {
  const lockPath = fileURLToPath(new URL('../templates.lock.json', import.meta.url));
  const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as LockFile;

  it('nội dung mẫu khớp lock; đổi công thức thì phải tăng version và chạy `npm run lock`', () => {
    const now = buildLock(TEMPLATES);
    for (const [id, e] of Object.entries(now)) {
      const prev = lock[id];
      assert.ok(prev, `mẫu mới "${id}" chưa có trong lock: chạy npm run lock -w @matadoor/data`);
      if (prev.sha256 !== e.sha256) {
        assert.ok(e.version > prev.version, `mẫu "${id}" đổi nội dung mà version vẫn ${e.version}: hãy tăng version`);
        assert.fail(`mẫu "${id}" đã tăng version: chạy npm run lock -w @matadoor/data để cập nhật lock`);
      }
      assert.equal(prev.version, e.version, `lock của "${id}" lệch version`);
    }
  });

  it('JSON chuẩn hóa không phụ thuộc thứ tự khóa', () => {
    assert.equal(canonicalJson({ b: 1, a: [1, { d: 2, c: null }] }), canonicalJson({ a: [1, { c: null, d: 2 }], b: 1 }));
  });
});

describe('quy đổi giá (FR-MAT-02, Q1)', () => {
  const c3328 = MATERIALS.find((m) => m.code === 'XF-C3328')!;

  it('nhôm: giá cây → giá mét theo dài cây', () => {
    const p = toPricedMaterial(c3328, DEFAULT_GROUP_FACTORS);
    assert.ok(Math.abs(p.costPrice - 520_000 / 5.8) < 1e-6);
    assert.ok(Math.abs(p.salePrice - (520_000 * 1.1) / 5.8) < 1e-6);
    assert.equal(p.unit, 'm');
  });

  it('₫/kg tham khảo = giá cây ÷ (dài cây × kg/m) ≈ 45.977 (ghi chú thiết kế)', () => {
    assert.equal(Math.round(pricePerKg(c3328)!), 45_977);
    assert.equal(pricePerKg(MATERIALS.find((m) => m.group === 'kinh')!), null);
  });

  it('giá bán = giá gốc × hệ số nhóm, trừ khi có giá riêng', () => {
    const m: MaterialRecord = { code: 'X', name: 'X', group: 'phukien', unit: 'cái', costPrice: 100 };
    assert.ok(Math.abs(salePriceOf(m, { ...DEFAULT_GROUP_FACTORS, phukien: 1.25 }) - 125) < 1e-9);
    assert.equal(hasCustomSalePrice(m), false);
    const custom = { ...m, salePrice: 150 };
    assert.equal(salePriceOf(custom, DEFAULT_GROUP_FACTORS), 150);
    assert.equal(hasCustomSalePrice(custom), true);
    assert.equal(hasCustomSalePrice({ ...m, salePrice: null }), false);
  });

  it('nhôm thiếu dài cây là lỗi dữ liệu', () => {
    assert.throws(() => toPricedMaterial({ ...c3328, barLengthMm: 0 }, DEFAULT_GROUP_FACTORS), /thiếu chiều dài cây/);
  });

  it('hệ số nhóm hợp lệ 1–5', () => {
    assert.equal(validateFactor(1.1), null);
    assert.match(validateFactor(0.9)!, /chiết khấu/);
    assert.equal(validateFactor(6), 'Hệ số tối đa 5');
    assert.equal(validateFactor(Number.NaN), 'Nhập hệ số');
  });
});
