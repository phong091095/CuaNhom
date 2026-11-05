import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeDoor, interpolate } from '../src/compute';
import { validateTemplate } from '../src/validate';
import { BOOK, fixtureTemplate } from './fixtures';

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

describe('computeDoor – thứ tự tính và dòng nhôm (BR-01…BR-03)', () => {
  const r = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1 }, BOOK);

  it('không có lỗi dữ liệu, được lưu', () => {
    assert.deepEqual(r.dataErrors, []);
    assert.equal(r.ok, true);
  });

  it('chiều dài cắt và số thanh', () => {
    const byRole = Object.fromEntries(r.profiles.map((p) => [p.role, p]));
    assert.equal(byRole.khung_dung!.length, 2200);
    assert.equal(byRole.khung_dung!.qty, 2);
    assert.equal(byRole.khung_ngang!.length, 800);
    assert.equal(byRole.canh_dung!.length, 2149);
    assert.equal(byRole.canh_dung!.qty, 4);
    assert.equal(byRole.canh_ngang!.length, 364);
    assert.equal(byRole.khung_ngang!.position, 'Trên');
    assert.equal(byRole.khung_dung!.angle, '45/45');
  });

  it('dòng có số lượng 0 bị bỏ qua nhưng biến vẫn có (BR-03)', () => {
    assert.ok(!r.profiles.some((p) => p.role === 'trung_gian'));
    assert.equal(r.scope.trung_gian, 2149);
    assert.equal(r.scope.trung_gian_qty, 0);
    assert.equal(r.scope.trung_gian_total, 0);
    assert.equal(r.accessories.filter((a) => a.code === 'BANLE').length, 1);
  });

  it('mỗi dòng nhôm tạo biến <vai_tro>, _qty, _total', () => {
    assert.equal(r.scope.canh_ngang, 364);
    assert.equal(r.scope.canh_ngang_qty, 4);
    assert.equal(r.scope.canh_ngang_total, 1456);
  });

  it('kính: kích thước làm tròn 0,1 mm, biến kinh_*, khối lượng BR-07', () => {
    const g = r.glass[0]!;
    assert.equal(g.width, 264);
    assert.equal(g.height, 2049, '2048,95 làm tròn nửa ra xa 0 thành 2049');
    assert.equal(g.qtyPerSet, 2);
    near(g.areaEach, 0.540936);
    near(g.weightEach, 0.540936 * 5 * 2.5);
    assert.equal(r.scope.kinh_w, 264);
    assert.equal(r.scope.kinh_qty, 2);
    assert.equal(r.scope.glass_perimeter_total, 2 * (264 + 2049) * 2);
  });

  it('phụ kiện: số lẻ rồi làm tròn lên (BR-04)', () => {
    const keo = r.accessories.find((a) => a.code === 'KEO')!;
    near(keo.rawPerSet, 2.88);
    assert.equal(keo.qty, 3);
    const nem = r.accessories.find((a) => a.code === 'NEM')!;
    near(nem.raw, 9.252);
    assert.equal(nem.qty, 10);
  });

  it('nhân công theo m², không làm tròn (BR-05)', () => {
    assert.equal(r.labor[0]!.qty, 1.76);
    near(r.labor[0]!.cost, 176_000);
  });

  it('tiền theo BR-06 và tổng theo nhóm', () => {
    near(r.cost.nhom, 5.2 * 100_000 + 10.052 * 50_000);
    near(r.cost.kinh, 1.081872 * 200_000);
    assert.equal(r.cost.phukien, 3 * 30_000 + 3 * 50_000 + 10 * 1_000);
    near(r.cost.total, 1_022_600 + 216_374.4 + 250_000 + 176_000);
    near(r.profit, r.sale.total - r.cost.total);
    near(r.salePerM2, r.sale.total / 1.76);
    near(r.costPerSet, r.cost.total);
  });

  it('khối lượng nhôm theo kg/m', () => {
    const khung = r.profiles.filter((p) => p.code === 'KHUNG').reduce((s, p) => s + p.kg, 0);
    near(khung, 5.2 * 2);
  });

  it('kiểm tra kỹ thuật: cảnh báo có chèn biến, xếp theo mức', () => {
    assert.deepEqual(
      r.checks.map((c) => [c.level, c.message]),
      [['warning', 'Cánh rộng 364 mm']],
    );
  });
});

describe('computeDoor – nhiều bộ, tham số, kính', () => {
  it('3 bộ: phụ kiện nhân số bộ rồi mới làm tròn', () => {
    const r = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 3 }, BOOK);
    const keo = r.accessories.find((a) => a.code === 'KEO')!;
    near(keo.raw, 8.64);
    assert.equal(keo.qty, 9);
    assert.equal(r.profiles[0]!.qty, 6);
    near(r.area, 1.76 * 3);
    near(r.salePerSet * 3, r.sale.total);
  });

  it('tham số 4 cánh bật dòng trung gian', () => {
    const r = computeDoor(fixtureTemplate(), { W: 1200, H: 2200, qty: 1, params: { soCanh: 4 } }, BOOK);
    const tg = r.profiles.find((p) => p.role === 'trung_gian')!;
    assert.equal(tg.qty, 1);
    assert.equal(r.scope.canh_ngang, (1200 - 72) / 4);
  });

  it('H > 2400: 4 bản lề và thông báo mức Thông tin', () => {
    const r = computeDoor(fixtureTemplate(), { W: 900, H: 2600, qty: 1 }, BOOK);
    assert.equal(r.accessories.find((a) => a.code === 'BANLE')!.qty, 4);
    assert.ok(r.checks.some((c) => c.level === 'info' && c.message === 'Dùng 4 bản lề'));
    assert.equal(r.ok, true, 'thông tin không chặn lưu');
  });

  it('lỗi chặn lưu và hiện dưới ô nhập (TC-05)', () => {
    const r = computeDoor(fixtureTemplate(), { W: 1500, H: 2200, qty: 1 }, BOOK);
    assert.equal(r.ok, false);
    const err = r.checks.find((c) => c.level === 'error')!;
    assert.equal(err.field, 'W');
    assert.match(err.message, /600–1200 mm/);
    assert.equal(r.checks[0]!.level, 'error', 'lỗi xếp trước');
  });

  it('tham số lựa chọn không hợp lệ hoặc ngoài khoảng là lỗi', () => {
    const r1 = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1, params: { soCanh: 3 } }, BOOK);
    assert.ok(r1.checks.some((c) => c.level === 'error' && c.field === 'soCanh'));
    const r2 = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1, params: { khe: 50 } }, BOOK);
    assert.ok(r2.checks.some((c) => c.level === 'error' && c.field === 'khe' && /tối đa 30 mm/.test(c.message)));
    const r3 = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1, params: { khe: -1 } }, BOOK);
    assert.ok(r3.checks.some((c) => c.level === 'error' && /tối thiểu 0/.test(c.message)));
    const r4 = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1, params: { khe: Number.NaN } }, BOOK);
    assert.equal(r4.scope.khe, 10, 'NaN lấy mặc định');
  });

  it('đổi kính: giá và khối lượng tính lại (FR-DOR-04)', () => {
    const r = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1, glass: { kinh: 'K8' } }, BOOK);
    const g = r.glass[0]!;
    assert.equal(g.code, 'K8');
    near(g.weightEach, g.areaEach * 8 * 2.5);
    near(r.cost.kinh, g.area * 300_000);
  });

  it('kính đã chọn không còn: cảnh báo và dùng kính mặc định', () => {
    const r = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1, glass: { kinh: 'KHONG_CO' } }, BOOK);
    assert.equal(r.glass[0]!.code, 'K5');
    assert.ok(r.checks.some((c) => c.level === 'warning' && c.field === 'glass.kinh'));
    const r2 = computeDoor(fixtureTemplate(), { W: 800, H: 2200, qty: 1, glass: { kinh: 'NEM' } }, BOOK);
    assert.equal(r2.glass[0]!.code, 'K5', 'mã không thuộc nhóm kính cũng không nhận');
  });

  it('chiều dài cắt ≤ 0 là lỗi (BR-11)', () => {
    const r = computeDoor(fixtureTemplate(), { W: 60, H: 2200, qty: 1 }, BOOK);
    assert.equal(r.ok, false);
    assert.ok(r.checks.some((c) => c.id === 'cut.canh_ngang'));
    assert.ok(r.checks.some((c) => c.id === 'glass.kinh.size'));
  });

  it('đầu vào không hợp lệ: không tính, báo lỗi đúng ô', () => {
    const r = computeDoor(fixtureTemplate(), { W: 0, H: Number.NaN, qty: 0 }, BOOK);
    assert.equal(r.ok, false);
    assert.deepEqual(
      r.checks.map((c) => c.field),
      ['W', 'H', 'qty'],
    );
    assert.equal(r.profiles.length, 0);
  });
});

describe('computeDoor – lỗi dữ liệu mẫu', () => {
  it('biến chưa định nghĩa', () => {
    const t = fixtureTemplate();
    t.derived.push({ key: 'x', expr: 'khongCo + 1' });
    const r = computeDoor(t, { W: 800, H: 2200, qty: 1 }, BOOK);
    assert.equal(r.ok, false);
    assert.match(r.dataErrors[0]!, /derived\.x: Biến "khongCo" chưa được định nghĩa/);
  });

  it('thiếu vật tư hoặc sai nhóm', () => {
    const t = fixtureTemplate();
    t.profiles[0]!.code = 'KHONG_CO';
    assert.match(computeDoor(t, { W: 800, H: 2200, qty: 1 }, BOOK).dataErrors[0]!, /không có vật tư mã "KHONG_CO"/);
    const t2 = fixtureTemplate();
    t2.accessories[0]!.code = 'K5';
    assert.match(computeDoor(t2, { W: 800, H: 2200, qty: 1 }, BOOK).dataErrors[0]!, /cần nhóm "phukien"/);
  });

  it('số thanh không nguyên, số lượng âm', () => {
    const t = fixtureTemplate();
    t.profiles[0]!.qty = 1.5;
    assert.match(computeDoor(t, { W: 800, H: 2200, qty: 1 }, BOOK).dataErrors[0]!, /số nguyên/);
    const t2 = fixtureTemplate();
    t2.glass[0]!.qty = -1;
    assert.match(computeDoor(t2, { W: 800, H: 2200, qty: 1 }, BOOK).dataErrors[0]!, /số tấm/);
    const t3 = fixtureTemplate();
    t3.accessories[0]!.qty = -2;
    assert.match(computeDoor(t3, { W: 800, H: 2200, qty: 1 }, BOOK).dataErrors[0]!, /âm/);
    const t4 = fixtureTemplate();
    t4.labor[0]!.qty = -2;
    assert.match(computeDoor(t4, { W: 800, H: 2200, qty: 1 }, BOOK).dataErrors[0]!, /âm/);
  });

  it('chia cho 0 trong công thức', () => {
    const t = fixtureTemplate();
    t.derived.push({ key: 'x', expr: '1 / (W - W)' });
    assert.match(computeDoor(t, { W: 800, H: 2200, qty: 1 }, BOOK).dataErrors[0]!, /Chia cho 0/);
  });
});

describe('validateTemplate', () => {
  it('mẫu thử hợp lệ', () => {
    assert.deepEqual(validateTemplate(fixtureTemplate(), BOOK), []);
  });

  it('bắt lỗi dùng biến trước khi định nghĩa, mã vật tư, trùng tên, tham số', () => {
    const t = fixtureTemplate();
    t.derived.unshift({ key: 'truoc', expr: 'canh_ngang + 1' });
    t.profiles.push({ role: 'khung_dung', label: 'Trùng', code: 'K5', length: 'W', qty: 1 });
    t.accessories.push({ code: 'KHONG_CO', qty: 1 });
    t.labor.push({ code: 'BANLE', qty: 'area' });
    t.glass.push({ key: 'fix', label: 'Ô fix', width: 'W +', height: 1, qty: 1, defaultCode: 'KHUNG' });
    t.params.push({ key: 'chon', label: 'Chọn', type: 'choice', default: 9, options: [{ value: 1, label: '1' }] });
    t.params.push({ key: 'rong', label: 'Rỗng', type: 'choice', default: 1 });
    t.params.push({ key: 'n', label: 'N', type: 'number', default: 5, min: 6, max: 4 });
    t.checks.push({ id: 'rong', level: 'error', when: 'W > 1', message: '{khongCo}' });
    t.constants['W'] = { value: 1 };
    t.version = 0;
    t.defaults.W = 0;
    const issues = validateTemplate(t, BOOK).map((i) => `${i.where}: ${i.message}`);
    const has = (re: RegExp) => assert.ok(issues.some((s) => re.test(s)), `thiếu: ${re}\n${issues.join('\n')}`);
    has(/derived\.truoc: Dùng biến "canh_ngang" trước khi định nghĩa/);
    has(/profiles\.khung_dung: Tên biến "khung_dung" bị trùng/);
    has(/profiles\.khung_dung\.code: Vật tư "K5" thuộc nhóm "kinh"/);
    has(/accessories\.KHONG_CO: Không có vật tư mã "KHONG_CO"/);
    has(/labor\.BANLE: Vật tư "BANLE" thuộc nhóm "phukien"/);
    has(/glass\.fix\.width: Biểu thức kết thúc đột ngột/);
    has(/glass\.fix\.defaultCode/);
    has(/params\.chon: Giá trị mặc định không có trong danh sách/);
    has(/params\.rong: Tham số lựa chọn phải có danh sách/);
    has(/params\.n: Mặc định nhỏ hơn tối thiểu/);
    has(/params\.n: Mặc định lớn hơn tối đa/);
    has(/checks\.rong: Mã kiểm tra bị trùng/);
    has(/checks\.rong\.message: Câu thông báo dùng biến lạ "khongCo"/);
    has(/vars: Không được đặt biến trùng tên dành riêng "W"/);
    has(/version/);
    has(/defaults/);
  });
});

describe('interpolate', () => {
  it('chèn số theo định dạng mm, giữ nguyên biến lạ', () => {
    assert.equal(interpolate('Cánh {a} mm, {b}', { a: 1050.25 }), 'Cánh 1050,3 mm, {b}');
  });
});
