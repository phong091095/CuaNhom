/**
 * Tính một bộ cửa từ mẫu + đầu vào + bảng giá (SRS mục 4.1, 4.2).
 *
 * Thứ tự (BR-01): tham số → hằng số → biến dẫn xuất → nhôm (theo thứ tự dòng) → kính
 * → phụ kiện → nhân công → kiểm tra kỹ thuật.
 */

import { compile, evaluate, ExprError } from './expr';
import { ceilEps, roundMm } from './round';
import { formatNumber } from './format';
import type {
  AccessoryLine,
  CheckResult,
  DoorInput,
  DoorResult,
  DoorTemplate,
  Expr,
  GlassLine,
  LaborLine,
  MaterialGroup,
  MoneyByGroup,
  PriceBook,
  PricedMaterial,
  ProfileLine,
} from './types';

/** Khối lượng riêng kính dùng cho BR-07: kg / (m² · mm). */
export const GLASS_KG_PER_M2_MM = 2.5;

class DataError extends Error {}

function emptyMoney(): MoneyByGroup {
  return { nhom: 0, kinh: 0, phukien: 0, nhancong: 0, total: 0 };
}

function addMoney(m: MoneyByGroup, group: MaterialGroup, amount: number): void {
  m[group] += amount;
  m.total += amount;
}

/** Tên biến kính theo key của dòng kính. */
export function glassKey(key: string | undefined): string {
  return key ?? 'kinh';
}

/** Biến dẫn xuất người dùng không được đặt trùng (tên dành riêng). */
export const RESERVED_VARS = ['W', 'H', 'area', 'glass_perimeter_total'] as const;

/**
 * Chèn giá trị biến vào câu thông báo: "Cánh rộng {canh_ngang} mm" → "Cánh rộng 1050 mm".
 * Biến không có thì giữ nguyên.
 */
export function interpolate(message: string, scope: Record<string, number>): string {
  return message.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (all, name: string) =>
    Object.prototype.hasOwnProperty.call(scope, name)
      ? formatNumber(scope[name]!, { maxDecimals: 1, grouping: false })
      : all,
  );
}

function material(book: PriceBook, code: string, group: MaterialGroup, where: string): PricedMaterial {
  const m = Object.prototype.hasOwnProperty.call(book, code) ? book[code] : undefined;
  if (!m) throw new DataError(`${where}: không có vật tư mã "${code}" trong bảng giá`);
  if (m.group !== group) {
    throw new DataError(`${where}: vật tư "${code}" thuộc nhóm "${m.group}", cần nhóm "${group}"`);
  }
  return m;
}

function emptyResult(input: DoorInput, dataErrors: string[], scope: Record<string, number>): DoorResult {
  const areaPerSet = (input.W * input.H) / 1e6;
  return {
    ok: false,
    dataErrors,
    checks: [],
    areaPerSet,
    area: areaPerSet * input.qty,
    qty: input.qty,
    profiles: [],
    glass: [],
    accessories: [],
    labor: [],
    cost: emptyMoney(),
    sale: emptyMoney(),
    profit: 0,
    salePerSet: 0,
    costPerSet: 0,
    salePerM2: 0,
    scope,
  };
}

/** Kiểm đầu vào cơ bản (không phụ thuộc mẫu). Lỗi ở đây chặn tính tiếp. */
export function validateInput(input: DoorInput): CheckResult[] {
  const out: CheckResult[] = [];
  if (!Number.isFinite(input.W) || input.W <= 0) {
    out.push({ id: 'input.W', level: 'error', message: 'Nhập chiều rộng lớn hơn 0', field: 'W' });
  }
  if (!Number.isFinite(input.H) || input.H <= 0) {
    out.push({ id: 'input.H', level: 'error', message: 'Nhập chiều cao lớn hơn 0', field: 'H' });
  }
  if (!Number.isInteger(input.qty) || input.qty < 1) {
    out.push({ id: 'input.qty', level: 'error', message: 'Số bộ phải là số nguyên từ 1 trở lên', field: 'qty' });
  }
  return out;
}

function isInt(x: number): boolean {
  return Math.abs(x - Math.round(x)) < 1e-9;
}

/**
 * Tính một bộ cửa. Không ném lỗi: lỗi dữ liệu nằm trong `dataErrors`,
 * lỗi người dùng nằm trong `checks` (mức error), cả hai làm `ok = false`.
 */
export function computeDoor(template: DoorTemplate, input: DoorInput, book: PriceBook): DoorResult {
  const scope: Record<string, number> = Object.create(null) as Record<string, number>;

  const inputChecks = validateInput(input);
  if (inputChecks.length > 0) {
    const r = emptyResult({ ...input, qty: Math.max(1, Math.floor(input.qty) || 1) }, [], scope);
    r.checks = inputChecks;
    return r;
  }

  const sets = input.qty;
  let where = '';
  const ev = (expr: Expr, at: string): number => {
    where = at;
    return evaluate(compile(expr), scope);
  };

  const checks: CheckResult[] = [];
  const profiles: ProfileLine[] = [];
  const glass: GlassLine[] = [];
  const accessories: AccessoryLine[] = [];
  const labor: LaborLine[] = [];
  const cost = emptyMoney();
  const sale = emptyMoney();

  try {
    // Biến cơ bản
    scope.W = input.W;
    scope.H = input.H;
    scope.area = (input.W * input.H) / 1e6;

    // 1. Tham số
    for (const p of template.params) {
      let v = input.params?.[p.key];
      if (v === undefined || !Number.isFinite(v)) v = p.default;
      if (p.type === 'choice' && p.options && !p.options.some((o) => o.value === v)) {
        checks.push({
          id: `param.${p.key}`,
          level: 'error',
          message: `${p.label}: giá trị ${formatNumber(v)} không có trong danh sách`,
          field: p.key,
        });
      }
      if (p.type === 'number') {
        if (p.min !== undefined && v < p.min) {
          checks.push({
            id: `param.${p.key}`,
            level: 'error',
            message: `${p.label} tối thiểu ${formatNumber(p.min, { grouping: false })}${p.unit ? ` ${p.unit}` : ''}`,
            field: p.key,
          });
        }
        if (p.max !== undefined && v > p.max) {
          checks.push({
            id: `param.${p.key}`,
            level: 'error',
            message: `${p.label} tối đa ${formatNumber(p.max, { grouping: false })}${p.unit ? ` ${p.unit}` : ''}`,
            field: p.key,
          });
        }
      }
      scope[p.key] = v;
    }

    // 2. Hằng số
    for (const [key, c] of Object.entries(template.constants)) {
      scope[key] = c.value;
    }

    // 3. Biến dẫn xuất
    for (const d of template.derived) {
      scope[d.key] = ev(d.expr, `derived.${d.key}`);
    }

    // 4. Nhôm
    for (const row of template.profiles) {
      const length = roundMm(ev(row.length, `profiles.${row.role}.length`));
      const qtyPerSet = ev(row.qty, `profiles.${row.role}.qty`);
      if (!isInt(qtyPerSet) || qtyPerSet < 0) {
        throw new DataError(`profiles.${row.role}.qty: số thanh phải là số nguyên ≥ 0 (đang là ${qtyPerSet})`);
      }
      const q = Math.round(qtyPerSet);
      scope[row.role] = length;
      scope[`${row.role}_qty`] = q;
      scope[`${row.role}_total`] = length * q;
      if (q === 0) continue; // BR-03
      const m = material(book, row.code, 'nhom', `profiles.${row.role}`);
      if (length <= 0) {
        checks.push({
          id: `cut.${row.role}`,
          level: 'error',
          message: `Chiều dài cắt "${row.label}" không hợp lệ (${formatNumber(length, { maxDecimals: 1, grouping: false })} mm) – kiểm tra kích thước`,
        });
      }
      const qty = q * sets;
      const totalM = (length / 1000) * qty;
      const lineCost = totalM * m.costPrice;
      const lineSale = totalM * m.salePrice;
      profiles.push({
        role: row.role,
        label: row.label,
        code: row.code,
        name: m.name,
        length,
        qtyPerSet: q,
        qty,
        ...(row.angle !== undefined ? { angle: row.angle } : {}),
        ...(row.position !== undefined ? { position: row.position } : {}),
        totalM,
        kg: totalM * (m.kgPerM ?? 0),
        cost: lineCost,
        sale: lineSale,
      });
      addMoney(cost, 'nhom', lineCost);
      addMoney(sale, 'nhom', lineSale);
    }

    // 5. Kính
    let perimeter = 0;
    for (const row of template.glass) {
      const key = glassKey(row.key);
      const width = roundMm(ev(row.width, `glass.${key}.width`));
      const height = roundMm(ev(row.height, `glass.${key}.height`));
      const qtyPerSet = ev(row.qty, `glass.${key}.qty`);
      if (!isInt(qtyPerSet) || qtyPerSet < 0) {
        throw new DataError(`glass.${key}.qty: số tấm phải là số nguyên ≥ 0 (đang là ${qtyPerSet})`);
      }
      const q = Math.round(qtyPerSet);
      const chosen = input.glass?.[key];
      let code = row.defaultCode;
      if (chosen !== undefined && chosen !== row.defaultCode) {
        const cm = Object.prototype.hasOwnProperty.call(book, chosen) ? book[chosen] : undefined;
        if (cm && cm.group === 'kinh') code = chosen;
        else {
          checks.push({
            id: `glass.${key}.code`,
            level: 'warning',
            message: `Không tìm thấy loại kính đã chọn, tạm dùng kính mặc định của mẫu`,
            field: `glass.${key}`,
          });
        }
      }
      const m = material(book, code, 'kinh', `glass.${key}`);
      const areaEach = (width * height) / 1e6;
      const weightEach = areaEach * (m.thicknessMm ?? 0) * GLASS_KG_PER_M2_MM;
      scope[`${key}_w`] = width;
      scope[`${key}_h`] = height;
      scope[`${key}_qty`] = q;
      scope[`${key}_area`] = areaEach;
      scope[`${key}_weight`] = weightEach;
      if (q === 0) continue; // BR-03
      if (width <= 0 || height <= 0) {
        checks.push({
          id: `glass.${key}.size`,
          level: 'error',
          message: `Kích thước kính "${row.label}" không hợp lệ – kiểm tra kích thước cửa`,
        });
      }
      perimeter += 2 * (width + height) * q;
      const qty = q * sets;
      const area = areaEach * qty;
      const lineCost = area * m.costPrice;
      const lineSale = area * m.salePrice;
      glass.push({
        key,
        label: row.label,
        code,
        name: m.name,
        width,
        height,
        qtyPerSet: q,
        qty,
        areaEach,
        area,
        weightEach,
        cost: lineCost,
        sale: lineSale,
      });
      addMoney(cost, 'kinh', lineCost);
      addMoney(sale, 'kinh', lineSale);
    }
    scope.glass_perimeter_total = perimeter;

    // 6. Phụ kiện (BR-04: số lẻ × số bộ rồi làm tròn lên)
    for (const row of template.accessories) {
      const rawPerSet = ev(row.qty, `accessories.${row.code}.qty`);
      if (rawPerSet < 0) throw new DataError(`accessories.${row.code}.qty: số lượng âm (${rawPerSet})`);
      if (rawPerSet === 0) continue; // BR-03
      const m = material(book, row.code, 'phukien', `accessories.${row.code}`);
      const raw = rawPerSet * sets;
      const qty = ceilEps(raw);
      const lineCost = qty * m.costPrice;
      const lineSale = qty * m.salePrice;
      accessories.push({
        code: row.code,
        name: m.name,
        unit: m.unit,
        rawPerSet,
        raw,
        qty,
        cost: lineCost,
        sale: lineSale,
        ...(row.note !== undefined ? { note: row.note } : {}),
      });
      addMoney(cost, 'phukien', lineCost);
      addMoney(sale, 'phukien', lineSale);
    }

    // 7. Nhân công (BR-05: theo m², không làm tròn)
    for (const row of template.labor) {
      const qtyPerSet = ev(row.qty, `labor.${row.code}.qty`);
      if (qtyPerSet < 0) throw new DataError(`labor.${row.code}.qty: khối lượng âm (${qtyPerSet})`);
      if (qtyPerSet === 0) continue;
      const m = material(book, row.code, 'nhancong', `labor.${row.code}`);
      const qty = qtyPerSet * sets;
      const lineCost = qty * m.costPrice;
      const lineSale = qty * m.salePrice;
      labor.push({ code: row.code, name: m.name, unit: m.unit, qtyPerSet, qty, cost: lineCost, sale: lineSale });
      addMoney(cost, 'nhancong', lineCost);
      addMoney(sale, 'nhancong', lineSale);
    }

    // 8. Kiểm tra kỹ thuật (BR-11)
    for (const c of template.checks) {
      if (ev(c.when, `checks.${c.id}`) !== 0) {
        checks.push({
          id: c.id,
          level: c.level,
          message: interpolate(c.message, scope),
          ...(c.field !== undefined ? { field: c.field } : {}),
        });
      }
    }
  } catch (e) {
    if (e instanceof ExprError) {
      return emptyResult(input, [`${where}: ${e.message}`], { ...scope });
    }
    if (e instanceof DataError) {
      return emptyResult(input, [e.message], { ...scope });
    }
    throw e;
  }

  const areaPerSet = scope.area!;
  const area = areaPerSet * sets;
  const order: Record<string, number> = { error: 0, warning: 1, info: 2 };
  checks.sort((a, b) => order[a.level]! - order[b.level]!);

  return {
    ok: !checks.some((c) => c.level === 'error'),
    dataErrors: [],
    checks,
    areaPerSet,
    area,
    qty: sets,
    profiles,
    glass,
    accessories,
    labor,
    cost,
    sale,
    profit: sale.total - cost.total,
    salePerSet: sale.total / sets,
    costPerSet: cost.total / sets,
    salePerM2: area > 0 ? sale.total / area : 0,
    scope: { ...scope },
  };
}
