/**
 * Số liệu cho màn Chi tiết bộ cửa (D6 · SRS SCR-05, FR-BOM-01…03): nhôm gom theo mã, thông số đã nhập.
 * Chỉ gom và đổi đơn vị từ kết quả engine, không có công thức tính cắt ở đây.
 * Mọi số là cho 1 bộ (như artboard "Chi phí 1 bộ" và khối giá ở form D5).
 */
import { formatMoney, formatMoneyPerM2, formatSize, glassKey, type DoorResult, type DoorTemplate, type PriceBook, type ProfileLine } from '@matadoor/engine';
import { findSystem } from '@matadoor/data';
import { paramValueLabel } from './templateText';
import type { DoorItem, MaterialRow } from './types';

export interface AluGroup {
  code: string;
  name: string;
  /** Giá gốc 1 cây (₫/cây) theo Thư viện; null nếu vật tư không còn. */
  barPrice: number | null;
  barLengthMm: number | null;
  kgPerM: number | null;
  lines: ProfileLine[];
  /** Tổng mét dài dùng cho 1 bộ. */
  meters: number;
  /** Số cây quy đổi (mét dùng ÷ chiều dài cây) – chưa gồm hao hụt. */
  bars: number | null;
  kg: number;
  /** Tiền nhôm giá gốc cho 1 bộ (theo chiều dài dùng). */
  cost: number;
}

/** Nhôm gom theo mã profile, giữ thứ tự xuất hiện trong mẫu. */
export function aluminumGroups(r: DoorResult, materials: readonly MaterialRow[]): AluGroup[] {
  const per = r.qty > 0 ? r.qty : 1;
  const groups = new Map<string, AluGroup>();
  for (const l of r.profiles) {
    let g = groups.get(l.code);
    if (!g) {
      const m = materials.find((x) => x.code === l.code);
      g = {
        code: l.code,
        name: l.name,
        barPrice: m?.costPrice ?? null,
        barLengthMm: m?.barLengthMm ?? null,
        kgPerM: m?.kgPerM ?? null,
        lines: [],
        meters: 0,
        bars: null,
        kg: 0,
        cost: 0,
      };
      groups.set(l.code, g);
    }
    g.lines.push(l);
    g.meters += l.totalM / per;
    g.kg += l.kg / per;
    g.cost += l.cost / per;
  }
  for (const g of groups.values()) g.bars = g.barLengthMm ? (g.meters * 1000) / g.barLengthMm : null;
  return [...groups.values()];
}

/** "45/45" → "45°/45°". */
export function angleText(angle: string | undefined): string | null {
  if (!angle) return null;
  return angle
    .split('/')
    .map((a) => `${a.trim()}°`)
    .join('/');
}

export interface SpecRow {
  label: string;
  value: string;
}

/** Bảng "Thông số" của bộ cửa: những gì đã nhập, đọc theo nhãn của mẫu. */
export function doorSpecs(door: DoorItem, template: DoorTemplate | null, glassNames: ReadonlyMap<string, string>): SpecRow[] {
  const rows: SpecRow[] = [];
  if (template) {
    rows.push({ label: 'Mẫu cửa', value: `${template.name} · phiên bản ${template.version}` });
    rows.push({ label: 'Hệ nhôm', value: findSystem(template.system)?.name ?? template.system });
  }
  rows.push({ label: 'Rộng × Cao', value: formatSize(door.W, door.H) });
  rows.push({ label: 'Số bộ', value: `${door.qty} bộ` });
  if (template) {
    for (const p of template.params) rows.push({ label: p.label, value: paramValueLabel(template, p.key, door.params[p.key]) });
    for (const g of template.glass) {
      const code = door.glass[glassKey(g.key)] ?? g.defaultCode;
      rows.push({ label: template.glass.length > 1 ? g.label : 'Loại kính', value: glassNames.get(code) ?? code });
    }
  }
  rows.push({ label: 'Màu nhôm', value: door.color ?? 'Chưa chọn' });
  if (door.location) rows.push({ label: 'Vị trí', value: door.location });
  if (door.note) rows.push({ label: 'Ghi chú', value: door.note });
  return rows;
}

/** Đơn giá gốc theo đơn vị tính (₫/m², ₫/cái…) từ bảng giá. */
export function unitCost(book: PriceBook, code: string): number | null {
  return book[code]?.costPrice ?? null;
}

/** Dòng con của một thanh nhôm: "Cắt 45°/45° · 2 thanh · Trên, dưới". */
export function profileSubtitle(l: ProfileLine): string {
  const a = angleText(l.angle);
  return [a ? `Cắt ${a}` : null, `${l.qtyPerSet} thanh`, l.position ?? null].filter(Boolean).join(' · ');
}

/** Đơn giá theo đơn vị: "230.000 đ/m²", "120.000 đ/cái". */
export function perUnit(price: number, unit: string): string {
  return unit === 'm²' ? formatMoneyPerM2(price) : `${formatMoney(price)}/${unit}`;
}
