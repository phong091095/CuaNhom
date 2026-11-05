/**
 * Định dạng số và chữ tiếng Việt (SRS NFR-USE-03, câu Q3 trong KE_HOACH_GIAO_DIEN).
 *
 * - Tiền: `1.234.567 đ` (chấm ngăn nghìn, ký hiệu "đ").
 * - Kích thước mm: không có dấu ngăn nghìn: `2200 mm`, `2012,6 mm`.
 * - Số thập phân dùng dấu phẩy.
 * - Giữa số và đơn vị là khoảng trắng không ngắt (U+00A0) để không xuống dòng giữa chừng.
 */

import { roundHalfAway, roundMoney } from './round';

export const NBSP = ' ';

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export interface NumberFormatOptions {
  /** Số chữ số thập phân tối đa. */
  maxDecimals?: number;
  /** Số chữ số thập phân tối thiểu (thêm 0 ở cuối). */
  minDecimals?: number;
  /** Có ngăn nghìn bằng dấu chấm không. Mặc định có. */
  grouping?: boolean;
}

/** Định dạng số kiểu vi-VN: 1.234,5 */
export function formatNumber(x: number, opts: NumberFormatOptions = {}): string {
  const { maxDecimals = 2, minDecimals = 0, grouping = true } = opts;
  if (!Number.isFinite(x)) return '—';
  const r = roundHalfAway(x, maxDecimals);
  const negative = r < 0;
  const [intRaw, fracRaw = ''] = Math.abs(r).toFixed(maxDecimals).split('.');
  let frac = fracRaw.replace(/0+$/, '');
  while (frac.length < minDecimals) frac += '0';
  const intPart = grouping ? groupThousands(intRaw!) : intRaw!;
  return `${negative ? '-' : ''}${intPart}${frac ? `,${frac}` : ''}`;
}

/** Tiền: `1.234.567 đ`. Làm tròn đến đồng. */
export function formatMoney(x: number): string {
  return `${formatNumber(roundMoney(x), { maxDecimals: 0 })}${NBSP}đ`;
}

/** Tiền không kèm đơn vị: `1.234.567`. */
export function formatMoneyPlain(x: number): string {
  return formatNumber(roundMoney(x), { maxDecimals: 0 });
}

/** Đơn giá theo m²: `2.370.000 đ/m²`. */
export function formatMoneyPerM2(x: number): string {
  return `${formatMoneyPlain(x)}${NBSP}đ/m²`;
}

/** Số mm không ngăn nghìn, tối đa 1 chữ số thập phân: `2200`, `2012,6`. */
export function formatMmValue(x: number): string {
  return formatNumber(x, { maxDecimals: 1, grouping: false });
}

/** Kích thước mm: `2200 mm`. */
export function formatMm(x: number): string {
  return `${formatMmValue(x)}${NBSP}mm`;
}

/** Rộng × cao: `800 × 2200 mm`. */
export function formatSize(w: number, h: number): string {
  return `${formatMmValue(w)}${NBSP}×${NBSP}${formatMmValue(h)}${NBSP}mm`;
}

/** Diện tích: `7,465 m²` (tối đa 3 chữ số thập phân). */
export function formatArea(m2: number, maxDecimals = 3): string {
  return `${formatNumber(m2, { maxDecimals })}${NBSP}m²`;
}

/** Khối lượng: `92,83 kg`. */
export function formatKg(kg: number): string {
  return `${formatNumber(kg, { maxDecimals: 2 })}${NBSP}kg`;
}

/** Chiều dài mét: `11,62 m`. */
export function formatMeters(m: number): string {
  return `${formatNumber(m, { maxDecimals: 2 })}${NBSP}m`;
}

/** Tỉ lệ 0..1 → `7,29%` (dấu % viết liền). */
export function formatPercent(ratio: number, maxDecimals = 1): string {
  return `${formatNumber(ratio * 100, { maxDecimals })}%`;
}

const UNITS = ['mm', 'm²', 'm', 'kg', 'đ/m²', 'đ', 'bộ', 'cái', 'chai', 'cây', 'tấm', 'thanh', 'ly'];
const UNIT_RE = new RegExp(`(\\d) (${UNITS.map((u) => u.replace('/', '\\/')).join('|')})(?![\\p{L}\\d])`, 'gu');

/**
 * Thay khoảng trắng giữa số và đơn vị bằng khoảng trắng không ngắt trong một câu,
 * để "1200 mm" không bị xuống dòng giữa chừng (quy tắc thiết kế "Không ngắt giữa số và đơn vị").
 */
export function bindUnits(text: string): string {
  return text.replace(UNIT_RE, `$1${NBSP}$2`);
}

/** Số lượng kèm đơn vị: `9 chai`, `8,64 chai`. */
export function formatQty(x: number, unit: string, maxDecimals = 2): string {
  return `${formatNumber(x, { maxDecimals })}${NBSP}${unit}`;
}

export interface ParseDecimalOptions {
  /** Số chữ số thập phân tối đa cho phép. Mặc định 1 (mm, FR-DOR-02). */
  maxDecimals?: number;
}

/**
 * Đọc số người dùng gõ: nhận cả "2012,6" và "2012.6", bỏ khoảng trắng.
 * Trả về null nếu rỗng hoặc không hợp lệ (kể cả quá số chữ số thập phân cho phép).
 * Không nhận dấu ngăn nghìn: "2.200" hiểu là 2,2 (mm không có dấu ngăn nghìn theo NFR-USE-03).
 */
export function parseDecimal(input: string, opts: ParseDecimalOptions = {}): number | null {
  const { maxDecimals = 1 } = opts;
  const s = input.replace(/[\s ]/g, '').replace(',', '.');
  if (s === '') return null;
  const re = maxDecimals > 0 ? new RegExp(`^-?\\d+(\\.\\d{1,${maxDecimals}})?$`) : /^-?\d+$/;
  if (!re.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

/** Đọc số tiền người dùng gõ: "1.234.567", "1234567", "1 234 567 đ" → 1234567. */
export function parseMoney(input: string): number | null {
  const s = input.replace(/[\s .đ₫]/g, '').replace(/,\d*$/, '');
  if (s === '' || !/^\d+$/.test(s)) return null;
  return Number(s);
}

/**
 * Chuẩn hóa để tìm kiếm không phân biệt dấu (ghi chú thiết kế "Tìm kiếm bỏ dấu"):
 * NFD, xóa dấu U+0300–U+036F, đ/Đ → d, chữ thường, bỏ khoảng trắng và ký hiệu.
 * "xing fa", "XINGFA", "Xingfa" đều thành "xingfa"; "XF-C3328" thành "xfc3328".
 */
export function normalizeSearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Có khớp truy vấn với ít nhất một trường không. Truy vấn rỗng khớp mọi thứ. */
export function matchesSearch(query: string, ...fields: Array<string | null | undefined>): boolean {
  const q = normalizeSearch(query);
  if (q === '') return true;
  return fields.some((f) => f != null && normalizeSearch(f).includes(q));
}

/** Giữ cả cụm trên một dòng (SĐT "0923 456 789", mã…): đổi khoảng trắng thành khoảng trắng không ngắt. */
export function keepTogether(s: string): string {
  return s.replace(/ /g, NBSP);
}

/** Ngày kiểu Việt Nam theo giờ máy: 05/11/2026. */
export function formatDate(at: Date | number): string {
  const d = typeof at === 'number' ? new Date(at) : at;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

/** Chuỗi an toàn cho tên file: bỏ dấu, chữ thường, nối bằng "-". */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
