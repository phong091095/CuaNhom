/**
 * Tổng hợp vật tư cả dự án (SRS FR-BOM-04, FR-CUT-04, BR-04).
 * Phụ kiện: cộng số lẻ của các bộ rồi mới làm tròn lên.
 */

import { ceilEps, roundMoney } from './round';
import type { CutPiece } from './cut';
import type { DoorResult, MoneyByGroup, PriceBook } from './types';

export interface ProjectDoor {
  id: string;
  /** Ký hiệu bộ cửa: D1, S2… */
  symbol: string;
  /** Màu nhôm (FR-DOR-05). Cây khác màu là hàng khác nhau nên tách nhóm khi cắt và tổng hợp. */
  color?: string | null;
  result: DoorResult;
}

export interface ProfileSummary {
  /** Khóa nhóm: mã nhôm, kèm màu nếu có. */
  key: string;
  code: string;
  name: string;
  color: string | null;
  /** Số đoạn cần cắt. */
  pieces: number;
  totalM: number;
  kg: number;
  /** Tiền ước tính theo chiều dài dùng (giá gốc). */
  cost: number;
  sale: number;
}

export interface GlassSummaryItem {
  symbol: string;
  width: number;
  height: number;
  qty: number;
}

export interface GlassSummary {
  code: string;
  name: string;
  panes: number;
  area: number;
  weight: number;
  cost: number;
  sale: number;
  items: GlassSummaryItem[];
}

export interface AccessorySummaryItem {
  symbol: string;
  /** Số lẻ của bộ cửa này (đã nhân số bộ). */
  raw: number;
}

export interface AccessorySummary {
  code: string;
  name: string;
  unit: string;
  /** Tổng số lẻ của cả dự án. */
  raw: number;
  /** Số lấy = làm tròn lên tổng số lẻ (BR-04). */
  qty: number;
  costPrice: number;
  salePrice: number;
  cost: number;
  sale: number;
  items: AccessorySummaryItem[];
}

export interface LaborSummary {
  code: string;
  name: string;
  unit: string;
  qty: number;
  cost: number;
  sale: number;
}

export interface ProjectSummary {
  doors: number;
  sets: number;
  area: number;
  profiles: ProfileSummary[];
  glass: GlassSummary[];
  accessories: AccessorySummary[];
  labor: LaborSummary[];
  /** Tổng giá vốn các bộ (cộng theo từng bộ cửa). */
  cost: MoneyByGroup;
  /** Tổng giá bán các bộ (số thực). */
  sale: MoneyByGroup;
  /** OP1 = Σ (giá bán 1 bộ làm tròn đến đồng × số bộ) – BR-10. */
  op1: number;
  /** Số bộ cửa có lỗi (không tính được hoặc có lỗi chặn lưu). */
  invalidDoors: string[];
}

export function cutGroupKey(code: string, color?: string | null): string {
  return color ? `${code} · ${color}` : code;
}

function zero(): MoneyByGroup {
  return { nhom: 0, kinh: 0, phukien: 0, nhancong: 0, total: 0 };
}

function addInto(a: MoneyByGroup, b: MoneyByGroup): void {
  a.nhom += b.nhom;
  a.kinh += b.kinh;
  a.phukien += b.phukien;
  a.nhancong += b.nhancong;
  a.total += b.total;
}

/** Giá bán 1 bộ đưa lên báo giá: làm tròn đến đồng (để khách nhân tay ra đúng thành tiền). */
export function unitPriceForQuote(result: DoorResult): number {
  return roundMoney(result.salePerSet);
}

export function summarizeProject(doors: readonly ProjectDoor[], book: PriceBook): ProjectSummary {
  const profiles = new Map<string, ProfileSummary>();
  const glass = new Map<string, GlassSummary>();
  const acc = new Map<string, AccessorySummary>();
  const labor = new Map<string, LaborSummary>();
  const cost = zero();
  const sale = zero();
  let area = 0;
  let sets = 0;
  let op1 = 0;
  const invalidDoors: string[] = [];

  for (const d of doors) {
    const r = d.result;
    if (r.dataErrors.length > 0 || !r.ok) invalidDoors.push(d.symbol);
    if (r.dataErrors.length > 0) continue;
    sets += r.qty;
    area += r.area;
    addInto(cost, r.cost);
    addInto(sale, r.sale);
    op1 += unitPriceForQuote(r) * r.qty;

    for (const p of r.profiles) {
      const color = d.color ?? null;
      const key = cutGroupKey(p.code, color);
      let s = profiles.get(key);
      if (!s) {
        s = { key, code: p.code, name: p.name, color, pieces: 0, totalM: 0, kg: 0, cost: 0, sale: 0 };
        profiles.set(key, s);
      }
      s.pieces += p.qty;
      s.totalM += p.totalM;
      s.kg += p.kg;
      s.cost += p.cost;
      s.sale += p.sale;
    }
    for (const g of r.glass) {
      let s = glass.get(g.code);
      if (!s) {
        s = { code: g.code, name: g.name, panes: 0, area: 0, weight: 0, cost: 0, sale: 0, items: [] };
        glass.set(g.code, s);
      }
      s.panes += g.qty;
      s.area += g.area;
      s.weight += g.weightEach * g.qty;
      s.cost += g.cost;
      s.sale += g.sale;
      s.items.push({ symbol: d.symbol, width: g.width, height: g.height, qty: g.qty });
    }
    for (const a of r.accessories) {
      let s = acc.get(a.code);
      if (!s) {
        const m = book[a.code];
        s = {
          code: a.code,
          name: a.name,
          unit: a.unit,
          raw: 0,
          qty: 0,
          costPrice: m?.costPrice ?? 0,
          salePrice: m?.salePrice ?? 0,
          cost: 0,
          sale: 0,
          items: [],
        };
        acc.set(a.code, s);
      }
      s.raw += a.raw;
      s.items.push({ symbol: d.symbol, raw: a.raw });
    }
    for (const l of r.labor) {
      let s = labor.get(l.code);
      if (!s) {
        s = { code: l.code, name: l.name, unit: l.unit, qty: 0, cost: 0, sale: 0 };
        labor.set(l.code, s);
      }
      s.qty += l.qty;
      s.cost += l.cost;
      s.sale += l.sale;
    }
  }

  for (const s of acc.values()) {
    s.qty = ceilEps(s.raw);
    s.cost = s.qty * s.costPrice;
    s.sale = s.qty * s.salePrice;
  }

  const byCode = (a: { code: string }, b: { code: string }) => a.code.localeCompare(b.code, 'vi', { numeric: true });
  return {
    doors: doors.length,
    sets,
    area,
    profiles: [...profiles.values()].sort((a, b) => a.key.localeCompare(b.key, 'vi', { numeric: true })),
    glass: [...glass.values()].sort(byCode),
    accessories: [...acc.values()].sort(byCode),
    labor: [...labor.values()].sort(byCode),
    cost,
    sale,
    op1,
    invalidDoors,
  };
}

/** Các đoạn cần cắt của cả dự án, gom theo (mã nhôm, màu). Mỗi thanh của mỗi bộ là một đoạn. */
export function collectCutPieces(doors: readonly ProjectDoor[]): Map<string, CutPiece[]> {
  const groups = new Map<string, CutPiece[]>();
  for (const d of doors) {
    if (d.result.dataErrors.length > 0) continue;
    for (const p of d.result.profiles) {
      if (p.length <= 0) continue;
      const key = cutGroupKey(p.code, d.color ?? null);
      let list = groups.get(key);
      if (!list) {
        list = [];
        groups.set(key, list);
      }
      for (let i = 0; i < p.qty; i++) {
        list.push({
          length: p.length,
          symbol: d.symbol,
          role: p.role,
          label: p.label,
          doorId: d.id,
          ...(p.angle !== undefined ? { angle: p.angle } : {}),
        });
      }
    }
  }
  return groups;
}
