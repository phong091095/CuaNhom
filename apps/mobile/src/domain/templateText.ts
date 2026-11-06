/**
 * Chữ cho mẫu cửa (màn Thông số hệ D4, chi tiết cửa D6): tên biến tiếng Việt và nhãn giá trị tham số.
 * Hằng số hiện bằng chính giá trị (ví dụ "Rộng − 36 × 2") – bảng hằng số kèm ghi chú nằm riêng ở D4.
 */
import { describeExpr, formatNumber, glassKey, type DoorTemplate, type Expr, type NameResolver } from '@matadoor/engine';

export function templateNames(t: DoorTemplate): NameResolver {
  const map = new Map<string, string>([
    ['W', 'Rộng'],
    ['H', 'Cao'],
    ['area', 'Diện tích 1 bộ (m²)'],
    ['glass_perimeter_total', 'Tổng chu vi kính (mm)'],
  ]);
  for (const p of t.params) map.set(p.key, p.label);
  for (const [k, c] of Object.entries(t.constants)) map.set(k, formatNumber(c.value, { maxDecimals: 3, grouping: false }));
  for (const d of t.derived) map.set(d.key, d.label ?? d.key);
  for (const r of t.profiles) {
    map.set(r.role, r.label);
    map.set(`${r.role}_qty`, `Số thanh ${r.label.toLowerCase()}`);
    map.set(`${r.role}_total`, `Tổng dài ${r.label.toLowerCase()}`);
  }
  for (const g of t.glass) {
    const k = glassKey(g.key);
    const suffix = t.glass.length > 1 ? ` (${g.label.toLowerCase()})` : '';
    map.set(`${k}_w`, `Rộng kính${suffix}`);
    map.set(`${k}_h`, `Cao kính${suffix}`);
    map.set(`${k}_qty`, `Số tấm kính${suffix}`);
    map.set(`${k}_area`, `Diện tích 1 tấm kính${suffix}`);
    map.set(`${k}_weight`, `Khối lượng 1 tấm kính${suffix}`);
  }
  return (v) => map.get(v) ?? v;
}

/** Biểu thức của mẫu sang chữ theo tên biến của mẫu. */
export function exprText(t: DoorTemplate, e: Expr): string {
  return describeExpr(e, templateNames(t));
}

/** Nhãn giá trị tham số: lựa chọn → nhãn lựa chọn; số → "10 mm". */
export function paramValueLabel(t: DoorTemplate, key: string, value: number | undefined): string {
  const p = t.params.find((x) => x.key === key);
  if (!p) return value === undefined ? '—' : String(value);
  const v = value ?? p.default;
  if (p.type === 'choice') return p.options?.find((o) => o.value === v)?.label ?? String(v);
  return `${formatNumber(v, { maxDecimals: 1, grouping: false })}${p.unit ? `\u00a0${p.unit}` : ''}`;
}
