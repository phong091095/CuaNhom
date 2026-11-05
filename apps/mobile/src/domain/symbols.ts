/**
 * Ký hiệu bộ cửa (FR-DOR-02): tự sinh D1, D2… theo tiền tố của mẫu, người dùng sửa được.
 * Không đánh số lại khi xóa (ký hiệu đã ghi lên bản vẽ và công trình); số mới = số lớn nhất + 1.
 */

/** Chuẩn hóa để so trùng: bỏ khoảng trắng hai đầu, chữ hoa. */
export function normalizeSymbol(s: string): string {
  return s.trim().toUpperCase();
}

/** Tách "D12" → { prefix: "D", n: 12 }; không theo dạng chữ+số thì n = null. */
export function parseSymbol(s: string): { prefix: string; n: number | null } {
  const m = /^([^\d]*?)(\d+)$/.exec(s.trim());
  if (!m) return { prefix: s.trim(), n: null };
  return { prefix: m[1]!, n: Number(m[2]) };
}

export function nextSymbol(prefix: string, used: readonly string[]): string {
  const p = normalizeSymbol(prefix);
  let max = 0;
  for (const u of used) {
    const { prefix: up, n } = parseSymbol(u);
    if (n !== null && normalizeSymbol(up) === p && n > max) max = n;
  }
  return `${prefix}${max + 1}`;
}

/** Ký hiệu đã có (không phân biệt hoa thường, bỏ khoảng trắng)? */
export function isSymbolTaken(symbol: string, used: readonly string[]): boolean {
  const s = normalizeSymbol(symbol);
  return used.some((u) => normalizeSymbol(u) === s);
}

/** Kiểm ký hiệu người dùng gõ. Trả câu lỗi hoặc null. */
export function validateSymbol(symbol: string, used: readonly string[]): string | null {
  const s = symbol.trim();
  if (s === '') return 'Nhập ký hiệu bộ cửa, ví dụ D1';
  if (s.length > 12) return 'Ký hiệu tối đa 12 ký tự';
  if (isSymbolTaken(s, used)) return `Ký hiệu “${s}” đã có trong dự án`;
  return null;
}
