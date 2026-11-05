/**
 * Báo giá OP1 / OP2 (SRS FR-QUO-01, 05; BR-08, BR-10).
 *
 * Quy ước tiền trên bản gửi khách: mọi số in ra đều là số nguyên đồng và cộng tay được:
 * thành tiền = đơn giá đã làm tròn × số lượng; tạm tính = tổng các thành tiền đã in.
 */

import { ceilTo, roundMoney } from './round';

export type QuoteMode = 'op1' | 'op2';

/** Bước làm tròn lên của đơn giá OP2 gợi ý (BR-10). */
export const OP2_ROUND_STEP = 10_000;

export interface QuoteDoorInput {
  id: string;
  symbol: string;
  /** Tên mẫu cửa, ví dụ "Cửa đi mở quay 1 cánh". */
  name: string;
  W: number;
  H: number;
  qty: number;
  /** Diện tích tính giá của mọi bộ (BR-08). */
  area: number;
  /** Giá bán 1 bộ (số thực, từ engine). */
  salePerSet: number;
  /** Giá vốn 1 bộ (số thực) – chỉ dùng cho bản nội bộ. */
  costPerSet: number;
  /** Mô tả thêm: kính, màu, vị trí… */
  description?: string;
}

export interface QuoteLine {
  doorId: string;
  symbol: string;
  name: string;
  W: number;
  H: number;
  qty: number;
  area: number;
  /** OP1: đ/bộ. OP2: đ/m². */
  unitPrice: number;
  unit: 'bộ' | 'm²';
  /** Thành tiền (đồng, số nguyên). */
  total: number;
  description?: string;
}

export interface Discount {
  type: 'percent' | 'amount';
  value: number;
}

export interface QuoteTotals {
  subtotal: number;
  discountAmount: number;
  afterDiscount: number;
  /** Thuế suất 0..1, null là không tính VAT. */
  vatRate: number | null;
  vat: number;
  total: number;
}

/** Đơn giá OP2 gợi ý = OP1 / tổng diện tích, làm tròn lên bội 10.000 đ (BR-10). */
export function suggestOp2Price(op1: number, totalArea: number, step = OP2_ROUND_STEP): number {
  if (!(totalArea > 0)) return 0;
  return ceilTo(op1 / totalArea, step);
}

export function buildQuoteLines(doors: readonly QuoteDoorInput[], mode: QuoteMode, op2UnitPrice = 0): QuoteLine[] {
  return doors.map((d) => {
    const base = {
      doorId: d.id,
      symbol: d.symbol,
      name: d.name,
      W: d.W,
      H: d.H,
      qty: d.qty,
      area: d.area,
      ...(d.description !== undefined ? { description: d.description } : {}),
    };
    if (mode === 'op1') {
      const unitPrice = roundMoney(d.salePerSet);
      return { ...base, unitPrice, unit: 'bộ' as const, total: unitPrice * d.qty };
    }
    const unitPrice = roundMoney(op2UnitPrice);
    return { ...base, unitPrice, unit: 'm²' as const, total: roundMoney(unitPrice * d.area) };
  });
}

/** Kiểm chiết khấu: % trong 0–100, số tiền trong 0–tạm tính. Trả về câu lỗi hoặc null. */
export function validateDiscount(discount: Discount | null, subtotal: number): string | null {
  if (!discount) return null;
  if (!Number.isFinite(discount.value) || discount.value < 0) return 'Chiết khấu không được âm';
  if (discount.type === 'percent' && discount.value > 100) return 'Chiết khấu tối đa 100%';
  if (discount.type === 'amount' && discount.value > subtotal) return 'Chiết khấu không được lớn hơn tạm tính';
  return null;
}

/** Kiểm thuế suất VAT (0..1). */
export function validateVatRate(rate: number | null): string | null {
  if (rate === null) return null;
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) return 'Thuế suất VAT phải trong khoảng 0–100%';
  return null;
}

/**
 * Tạm tính → chiết khấu → VAT trên số đã trừ chiết khấu → tổng (FR-QUO-05).
 * Mọi bước làm tròn đến đồng. Ném RangeError nếu chiết khấu/thuế suất không hợp lệ.
 */
export function computeQuoteTotals(
  lines: readonly QuoteLine[],
  discount: Discount | null,
  vatRate: number | null,
): QuoteTotals {
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const dErr = validateDiscount(discount, subtotal);
  if (dErr) throw new RangeError(dErr);
  const vErr = validateVatRate(vatRate);
  if (vErr) throw new RangeError(vErr);
  const discountAmount = !discount
    ? 0
    : discount.type === 'percent'
      ? roundMoney((subtotal * discount.value) / 100)
      : roundMoney(discount.value);
  const afterDiscount = subtotal - discountAmount;
  const vat = vatRate === null ? 0 : roundMoney(afterDiscount * vatRate);
  return { subtotal, discountAmount, afterDiscount, vatRate, vat, total: afterDiscount + vat };
}

/**
 * Số báo giá: BG-YYMM-NNN (năm-tháng theo giờ máy, số tăng dần trên máy).
 * Ví dụ ngày 05/11/2026, số thứ 1 → BG-2611-001.
 */
export function formatQuoteNumber(date: Date, seq: number): string {
  const yy = String(date.getFullYear() % 100).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `BG-${yy}${mm}-${String(seq).padStart(3, '0')}`;
}
