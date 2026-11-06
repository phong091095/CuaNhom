/**
 * Đổi biểu thức trong mẫu cửa sang chữ để thợ đọc (màn Thông số hệ – D4, KE_HOACH_GIAO_DIEN GĐ 5):
 * `soCanh == 2 and W < 800` → "Số cánh = 2 và Rộng < 800";
 * `H > 2400 ? 4 : 3` → "nếu Cao > 2400 thì 4, không thì 3".
 * Tên biến lấy qua hàm `name` (nhãn tham số, vai trò thanh…); số dùng dấu phẩy thập phân.
 */
import { formatNumber } from '../format';
import { compile, type ExprNode } from './index';

export type NameResolver = (variable: string) => string;

const BIN_TEXT: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
  '<': '<',
  '<=': '≤',
  '>': '>',
  '>=': '≥',
  '==': '=',
  '!=': '≠',
  and: 'và',
  or: 'hoặc',
};

const FN_TEXT: Record<string, string> = {
  ceil: 'làm tròn lên',
  floor: 'làm tròn xuống',
  round: 'làm tròn',
  min: 'nhỏ nhất',
  max: 'lớn nhất',
  abs: 'trị tuyệt đối',
};

/** Độ ưu tiên (lớn = gắn chặt hơn), để chỉ thêm ngoặc khi cần. */
function prec(n: ExprNode): number {
  switch (n.kind) {
    case 'cond':
      return 1;
    case 'binary':
      if (n.op === 'or') return 2;
      if (n.op === 'and') return 3;
      if (['<', '<=', '>', '>=', '==', '!='].includes(n.op)) return 5;
      if (n.op === '+' || n.op === '-') return 6;
      return 7;
    case 'unary':
      return n.op === 'not' ? 4 : 8;
    default:
      return 9;
  }
}

function text(n: ExprNode, name: NameResolver): string {
  const wrap = (child: ExprNode, min: number) => {
    const t = text(child, name);
    return prec(child) < min ? `(${t})` : t;
  };
  switch (n.kind) {
    case 'num':
      return formatNumber(n.value, { maxDecimals: 3, grouping: false });
    case 'var':
      return name(n.name);
    case 'unary':
      if (n.op === 'not') return `không (${text(n.arg, name)})`;
      return `${n.op === '-' ? '−' : '+'}${wrap(n.arg, 8)}`;
    case 'call':
      return `${FN_TEXT[n.fn] ?? n.fn}(${n.args.map((a) => text(a, name)).join('; ')})`;
    case 'cond':
      return `nếu ${text(n.test, name)} thì ${text(n.then, name)}, không thì ${text(n.else, name)}`;
    case 'binary': {
      const p = prec(n);
      // Vế phải của − và ÷ cần ngoặc khi cùng mức (a − (b − c)).
      const rightMin = n.op === '-' || n.op === '/' ? p + 1 : p;
      return `${wrap(n.left, p)} ${BIN_TEXT[n.op] ?? n.op} ${wrap(n.right, rightMin)}`;
    }
  }
}

/** Biểu thức (chuỗi hoặc số) sang chữ. Biểu thức sai cú pháp thì trả nguyên văn. */
export function describeExpr(expr: string | number, name: NameResolver = (v) => v): string {
  try {
    return text(compile(expr).ast, name);
  } catch {
    return String(expr);
  }
}
