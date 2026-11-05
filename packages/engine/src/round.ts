/**
 * Quy tắc làm tròn dùng chung (SRS BR-02, BR-04, mục 5.2).
 */

/** Sai số dấu phẩy động bỏ qua khi làm tròn lên (BR-04: dưới 1e-9 không làm tăng số). */
export const CEIL_EPS = 1e-9;

/**
 * Làm tròn "nửa ra xa số 0" theo biểu diễn thập phân, giống hàm ROUND của Excel.
 * Ví dụ: 2012,65 → 2012,7 (Math.round thường cho 2012,6 vì 2012,65 lưu là 2012,6499…).
 */
export function roundHalfAway(x: number, digits = 0): number {
  if (!Number.isFinite(x)) return x;
  if (x === 0) return 0;
  const sign = x < 0 ? -1 : 1;
  const abs = Math.abs(x);
  const text = String(abs);
  let r: number;
  if (text.includes('e')) {
    const f = 10 ** digits;
    r = Math.round(abs * f) / f;
  } else {
    r = Number(`${Math.round(Number(`${text}e${digits}`))}e-${digits}`);
  }
  return r === 0 ? 0 : sign * r;
}

/** Chiều dài cắt, kích thước kính: làm tròn đến 0,1 mm (BR-02). */
export function roundMm(x: number): number {
  return roundHalfAway(x, 1);
}

/** Tiền: làm tròn đến đồng (mục 5.2: lưu số thực, hiển thị làm tròn đến đồng). */
export function roundMoney(x: number): number {
  return roundHalfAway(x, 0);
}

/** Làm tròn lên, bỏ qua sai số dấu phẩy động dưới 1e-9 (BR-04). */
export function ceilEps(x: number): number {
  return Math.ceil(x - CEIL_EPS);
}

/** Làm tròn lên tới bội số `step` (BR-10: đơn giá OP2 gợi ý làm tròn lên bội 10.000 đ). */
export function ceilTo(x: number, step: number): number {
  if (step <= 0) throw new RangeError('step phải > 0');
  return ceilEps(x / step) * step;
}
