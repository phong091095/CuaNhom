/**
 * Từ bảng vật tư (giá gốc theo đơn vị mua) ra bảng giá engine dùng (SRS FR-MAT-02, Q1).
 *
 * - Nhôm mua theo cây: giá gốc là ₫/cây; engine tính theo m dài: ₫/m = ₫/cây ÷ (dài cây / 1000).
 *   (Ghi chú thiết kế: nhôm tính theo CÂY, quy đổi ra kg; ₫/kg chỉ là dòng phụ.)
 * - Giá bán = giá gốc × hệ số lợi nhuận của NHÓM vật tư, trừ khi vật tư có giá bán riêng.
 */

import type { MaterialGroup, PriceBook, PricedMaterial } from '@matadoor/engine';

/** that: số thật của gói; tam: giá tạm của gói; xuong: xưởng tự đặt/sửa. */
export type PriceStatus = 'that' | 'tam' | 'xuong';

/** Một dòng vật tư (gói kèm hoặc đã được người dùng sửa giá). */
export interface MaterialRecord {
  code: string;
  name: string;
  group: MaterialGroup;
  /** Đơn vị tính của engine: nhôm "m", kính "m²", phụ kiện theo đơn vị riêng, nhân công "m²". */
  unit: string;
  kgPerM?: number;
  /** Nhôm: chiều dài cây dùng để quy giá cây ra giá mét. */
  barLengthMm?: number;
  /** Kính: tổng độ dày các lớp kính (mm), không tính khe khí. */
  thicknessMm?: number;
  /** Giá gốc theo đơn vị mua: nhôm ₫/cây, còn lại ₫/đơn vị. */
  costPrice: number;
  /** Giá bán riêng theo đơn vị mua (nếu có) – bỏ qua hệ số nhóm. */
  salePrice?: number | null;
  priceStatus?: PriceStatus;
  note?: string;
}

export type GroupFactors = Record<MaterialGroup, number>;

/** Hệ số lợi nhuận mặc định theo nhóm: +10% (thiết kế B3 "Báo giá (+10%)"). */
export const DEFAULT_GROUP_FACTORS: Readonly<GroupFactors> = { nhom: 1.1, kinh: 1.1, phukien: 1.1, nhancong: 1.1 };

/** Hệ số quy đổi từ đơn vị mua sang đơn vị tính của engine. */
export function purchaseUnitsPerEngineUnit(m: MaterialRecord): number {
  if (m.group === 'nhom') {
    const bar = m.barLengthMm;
    if (!bar || bar <= 0) throw new Error(`Nhôm "${m.code}" thiếu chiều dài cây`);
    return 1000 / bar; // 1 m = 1000 / dài cây (cây)
  }
  return 1;
}

/** Giá bán theo đơn vị mua. */
export function salePriceOf(m: MaterialRecord, factors: GroupFactors): number {
  return m.salePrice ?? m.costPrice * factors[m.group];
}

/** Có đang dùng giá bán riêng không (huy hiệu "Giá riêng"). */
export function hasCustomSalePrice(m: MaterialRecord): boolean {
  return m.salePrice !== undefined && m.salePrice !== null;
}

/** ₫/kg tham khảo cho nhôm = giá cây ÷ (dài cây × kg/m). */
export function pricePerKg(m: MaterialRecord): number | null {
  if (m.group !== 'nhom' || !m.kgPerM || !m.barLengthMm) return null;
  return m.costPrice / ((m.barLengthMm / 1000) * m.kgPerM);
}

export function toPricedMaterial(m: MaterialRecord, factors: GroupFactors): PricedMaterial {
  const k = purchaseUnitsPerEngineUnit(m);
  return {
    code: m.code,
    name: m.name,
    group: m.group,
    unit: m.unit,
    ...(m.kgPerM !== undefined ? { kgPerM: m.kgPerM } : {}),
    ...(m.thicknessMm !== undefined ? { thicknessMm: m.thicknessMm } : {}),
    costPrice: m.costPrice * k,
    salePrice: salePriceOf(m, factors) * k,
  };
}

export function buildPriceBook(materials: readonly MaterialRecord[], factors: GroupFactors = DEFAULT_GROUP_FACTORS): PriceBook {
  const book: Record<string, PricedMaterial> = Object.create(null) as Record<string, PricedMaterial>;
  for (const m of materials) book[m.code] = toPricedMaterial(m, factors);
  return book;
}

/** Kiểm hệ số nhóm: 1,0 – 5,0 (không bán dưới giá gốc qua hệ số; muốn giảm giá dùng chiết khấu). */
export function validateFactor(f: number): string | null {
  if (!Number.isFinite(f)) return 'Nhập hệ số';
  if (f < 1) return 'Hệ số không nhỏ hơn 1 (muốn bớt giá cho khách, dùng chiết khấu ở báo giá)';
  if (f > 5) return 'Hệ số tối đa 5';
  return null;
}
