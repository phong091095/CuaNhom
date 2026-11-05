/**
 * Biểu thức trong dữ liệu mẫu cửa (SRS BR-12).
 *
 * Chỉ gồm: số, biến, + − × ÷, so sánh, và/hoặc/không, toán tử ba ngôi,
 * hàm ceil, floor, round, min, max, abs. Không dùng eval/Function.
 * Biến chưa định nghĩa là lỗi dữ liệu. Giá trị đúng/sai là 1/0.
 */

export type BinaryOp =
  | '+'
  | '-'
  | '*'
  | '/'
  | '<'
  | '<='
  | '>'
  | '>='
  | '=='
  | '!='
  | 'and'
  | 'or';

export type FnName = 'ceil' | 'floor' | 'round' | 'min' | 'max' | 'abs';

export type ExprNode =
  | { kind: 'num'; value: number; pos: number }
  | { kind: 'var'; name: string; pos: number }
  | { kind: 'unary'; op: '-' | '+' | 'not'; arg: ExprNode; pos: number }
  | { kind: 'binary'; op: BinaryOp; left: ExprNode; right: ExprNode; pos: number }
  | { kind: 'cond'; test: ExprNode; then: ExprNode; else: ExprNode; pos: number }
  | { kind: 'call'; fn: FnName; args: ExprNode[]; pos: number };

export type ExprErrorCode = 'syntax' | 'unknown-fn' | 'arity' | 'undefined-var' | 'div-zero' | 'not-finite';

export class ExprError extends Error {
  readonly code: ExprErrorCode;
  readonly pos: number;
  readonly source: string;
  constructor(code: ExprErrorCode, message: string, source: string, pos: number) {
    super(message);
    this.name = 'ExprError';
    this.code = code;
    this.pos = pos;
    this.source = source;
  }
}

/** Số tham số cho phép của từng hàm: [tối thiểu, tối đa]. */
const FUNCTIONS: Record<FnName, [number, number]> = {
  ceil: [1, 1],
  floor: [1, 1],
  round: [1, 2],
  min: [1, 32],
  max: [1, 32],
  abs: [1, 1],
};

function isFnName(name: string): name is FnName {
  return Object.prototype.hasOwnProperty.call(FUNCTIONS, name);
}

// ---------------------------------------------------------------- lexer

type Token =
  | { t: 'num'; value: number; pos: number }
  | { t: 'id'; value: string; pos: number }
  | { t: 'op'; value: string; pos: number }
  | { t: '('; pos: number }
  | { t: ')'; pos: number }
  | { t: ','; pos: number }
  | { t: '?'; pos: number }
  | { t: ':'; pos: number }
  | { t: 'eof'; pos: number };

/** Ký hiệu Unicode thường gặp khi chuyên gia gõ công thức → ký hiệu ASCII. */
const UNICODE_OPS: ReadonlyMap<string, string> = new Map([
  ['×', '*'],
  ['÷', '/'],
  ['−', '-'],
  ['–', '-'],
  ['≤', '<='],
  ['≥', '>='],
  ['≠', '!='],
]);

/** Dùng Map (không dùng object) để tên như "constructor" không bị nhận nhầm là toán tử. */
const WORD_OPS: ReadonlyMap<string, string> = new Map([
  ['and', 'and'],
  ['or', 'or'],
  ['not', 'not'],
]);

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const ch = src[i]!;
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    const pos = i;
    if ((ch >= '0' && ch <= '9') || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i;
      while (j < n && /[0-9]/.test(src[j]!)) j++;
      if (src[j] === '.') {
        j++;
        while (j < n && /[0-9]/.test(src[j]!)) j++;
      }
      const text = src.slice(i, j);
      tokens.push({ t: 'num', value: Number(text), pos });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j]!)) j++;
      const word = src.slice(i, j);
      const op = WORD_OPS.get(word);
      if (op) tokens.push({ t: 'op', value: op, pos });
      else tokens.push({ t: 'id', value: word, pos });
      i = j;
      continue;
    }
    const uni = UNICODE_OPS.get(ch);
    if (uni) {
      tokens.push({ t: 'op', value: uni, pos });
      i++;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (two === '<=' || two === '>=' || two === '==' || two === '!=') {
      tokens.push({ t: 'op', value: two, pos });
      i += 2;
      continue;
    }
    if (two === '&&') {
      tokens.push({ t: 'op', value: 'and', pos });
      i += 2;
      continue;
    }
    if (two === '||') {
      tokens.push({ t: 'op', value: 'or', pos });
      i += 2;
      continue;
    }
    switch (ch) {
      case '+':
      case '-':
      case '*':
      case '/':
      case '<':
      case '>':
        tokens.push({ t: 'op', value: ch, pos });
        i++;
        continue;
      case '=':
        // Cho phép "soCanh = 2" như cách viết trong tài liệu nghiệp vụ.
        tokens.push({ t: 'op', value: '==', pos });
        i++;
        continue;
      case '!':
        tokens.push({ t: 'op', value: 'not', pos });
        i++;
        continue;
      case '(':
      case ')':
      case ',':
      case '?':
      case ':':
        tokens.push({ t: ch, pos } as Token);
        i++;
        continue;
      default:
        throw new ExprError('syntax', `Ký tự không hợp lệ "${ch}" ở vị trí ${pos + 1}`, src, pos);
    }
  }
  tokens.push({ t: 'eof', pos: n });
  return tokens;
}

// ---------------------------------------------------------------- parser

class Parser {
  private i = 0;
  constructor(
    private readonly src: string,
    private readonly tokens: Token[],
  ) {}

  private peek(): Token {
    return this.tokens[this.i]!;
  }

  private next(): Token {
    return this.tokens[this.i++]!;
  }

  private isOp(...ops: string[]): boolean {
    const tk = this.peek();
    return tk.t === 'op' && ops.includes(tk.value);
  }

  private fail(message: string, pos: number): never {
    throw new ExprError('syntax', `${message} (vị trí ${pos + 1})`, this.src, pos);
  }

  parse(): ExprNode {
    if (this.peek().t === 'eof') this.fail('Biểu thức trống', 0);
    const node = this.ternary();
    const tk = this.peek();
    if (tk.t !== 'eof') this.fail('Thừa ký hiệu', tk.pos);
    return node;
  }

  private ternary(): ExprNode {
    const test = this.or();
    if (this.peek().t === '?') {
      const pos = this.next().pos;
      const then = this.ternary();
      const colon = this.peek();
      if (colon.t !== ':') this.fail('Thiếu ":" của biểu thức điều kiện', colon.pos);
      this.next();
      const otherwise = this.ternary();
      return { kind: 'cond', test, then, else: otherwise, pos };
    }
    return test;
  }

  private or(): ExprNode {
    let left = this.and();
    while (this.isOp('or')) {
      const pos = this.next().pos;
      left = { kind: 'binary', op: 'or', left, right: this.and(), pos };
    }
    return left;
  }

  private and(): ExprNode {
    let left = this.not();
    while (this.isOp('and')) {
      const pos = this.next().pos;
      left = { kind: 'binary', op: 'and', left, right: this.not(), pos };
    }
    return left;
  }

  private not(): ExprNode {
    if (this.isOp('not')) {
      const pos = this.next().pos;
      return { kind: 'unary', op: 'not', arg: this.not(), pos };
    }
    return this.comparison();
  }

  private comparison(): ExprNode {
    const left = this.additive();
    if (this.isOp('<', '<=', '>', '>=', '==', '!=')) {
      const tk = this.next() as { t: 'op'; value: BinaryOp; pos: number };
      const right = this.additive();
      if (this.isOp('<', '<=', '>', '>=', '==', '!=')) {
        this.fail('Không so sánh liên tiếp, hãy dùng "and"', this.peek().pos);
      }
      return { kind: 'binary', op: tk.value, left, right, pos: tk.pos };
    }
    return left;
  }

  private additive(): ExprNode {
    let left = this.multiplicative();
    while (this.isOp('+', '-')) {
      const tk = this.next() as { t: 'op'; value: '+' | '-'; pos: number };
      left = { kind: 'binary', op: tk.value, left, right: this.multiplicative(), pos: tk.pos };
    }
    return left;
  }

  private multiplicative(): ExprNode {
    let left = this.unary();
    while (this.isOp('*', '/')) {
      const tk = this.next() as { t: 'op'; value: '*' | '/'; pos: number };
      left = { kind: 'binary', op: tk.value, left, right: this.unary(), pos: tk.pos };
    }
    return left;
  }

  private unary(): ExprNode {
    if (this.isOp('-', '+')) {
      const tk = this.next() as { t: 'op'; value: '-' | '+'; pos: number };
      return { kind: 'unary', op: tk.value, arg: this.unary(), pos: tk.pos };
    }
    return this.primary();
  }

  private primary(): ExprNode {
    const tk = this.next();
    switch (tk.t) {
      case 'num':
        return { kind: 'num', value: tk.value, pos: tk.pos };
      case 'id': {
        if (this.peek().t === '(') {
          if (!isFnName(tk.value)) {
            throw new ExprError(
              'unknown-fn',
              `Hàm "${tk.value}" không được hỗ trợ (chỉ có ceil, floor, round, min, max, abs) (vị trí ${tk.pos + 1})`,
              this.src,
              tk.pos,
            );
          }
          this.next();
          const args: ExprNode[] = [];
          if (this.peek().t !== ')') {
            args.push(this.ternary());
            while (this.peek().t === ',') {
              this.next();
              args.push(this.ternary());
            }
          }
          const close = this.peek();
          if (close.t !== ')') this.fail('Thiếu ")"', close.pos);
          this.next();
          const [min, max] = FUNCTIONS[tk.value];
          if (args.length < min || args.length > max) {
            throw new ExprError(
              'arity',
              `Hàm ${tk.value} cần ${min === max ? min : `${min}–${max}`} tham số, đang có ${args.length} (vị trí ${tk.pos + 1})`,
              this.src,
              tk.pos,
            );
          }
          return { kind: 'call', fn: tk.value, args, pos: tk.pos };
        }
        return { kind: 'var', name: tk.value, pos: tk.pos };
      }
      case '(': {
        const inner = this.ternary();
        const close = this.peek();
        if (close.t !== ')') this.fail('Thiếu ")"', close.pos);
        this.next();
        return inner;
      }
      case 'eof':
        return this.fail('Biểu thức kết thúc đột ngột', tk.pos);
      default:
        return this.fail('Ký hiệu không đúng chỗ', tk.pos);
    }
  }
}

// ---------------------------------------------------------------- compile + evaluate

export interface CompiledExpr {
  readonly source: string;
  readonly ast: ExprNode;
  /** Các biến biểu thức dùng tới (không gồm tên hàm). */
  readonly vars: ReadonlySet<string>;
}

const cache = new Map<string, CompiledExpr>();

/** Đọc một biểu thức. Số trong JSON được nhận trực tiếp. Có bộ nhớ đệm theo chuỗi nguồn. */
export function compile(expr: string | number): CompiledExpr {
  if (typeof expr === 'number') {
    if (!Number.isFinite(expr)) {
      throw new ExprError('not-finite', 'Số không hợp lệ', String(expr), 0);
    }
    return { source: String(expr), ast: { kind: 'num', value: expr, pos: 0 }, vars: new Set() };
  }
  const hit = cache.get(expr);
  if (hit) return hit;
  const ast = new Parser(expr, tokenize(expr)).parse();
  const vars = new Set<string>();
  collectVars(ast, vars);
  const compiled: CompiledExpr = { source: expr, ast, vars };
  cache.set(expr, compiled);
  return compiled;
}

function collectVars(node: ExprNode, out: Set<string>): void {
  switch (node.kind) {
    case 'num':
      return;
    case 'var':
      out.add(node.name);
      return;
    case 'unary':
      collectVars(node.arg, out);
      return;
    case 'binary':
      collectVars(node.left, out);
      collectVars(node.right, out);
      return;
    case 'cond':
      collectVars(node.test, out);
      collectVars(node.then, out);
      collectVars(node.else, out);
      return;
    case 'call':
      for (const a of node.args) collectVars(a, out);
      return;
  }
}

/** Bảng biến. Chỉ đọc khóa riêng của bảng (không đi theo prototype). */
export type Scope = Readonly<Record<string, number>>;

function lookup(scope: Scope, name: string, src: string, pos: number): number {
  if (!Object.prototype.hasOwnProperty.call(scope, name)) {
    throw new ExprError('undefined-var', `Biến "${name}" chưa được định nghĩa (vị trí ${pos + 1})`, src, pos);
  }
  return scope[name]!;
}

function roundDigits(x: number, digits: number): number {
  const f = 10 ** digits;
  const v = Math.round(Math.abs(x) * f + 1e-9) / f;
  return x < 0 ? -v : v;
}

function evalNode(node: ExprNode, scope: Scope, src: string): number {
  switch (node.kind) {
    case 'num':
      return node.value;
    case 'var':
      return lookup(scope, node.name, src, node.pos);
    case 'unary': {
      const v = evalNode(node.arg, scope, src);
      if (node.op === '-') return -v;
      if (node.op === '+') return v;
      return v === 0 ? 1 : 0;
    }
    case 'cond':
      return evalNode(node.test, scope, src) !== 0
        ? evalNode(node.then, scope, src)
        : evalNode(node.else, scope, src);
    case 'call': {
      const args = node.args.map((a) => evalNode(a, scope, src));
      switch (node.fn) {
        case 'ceil':
          return Math.ceil(args[0]!);
        case 'floor':
          return Math.floor(args[0]!);
        case 'round':
          return roundDigits(args[0]!, args[1] ?? 0);
        case 'min':
          return Math.min(...args);
        case 'max':
          return Math.max(...args);
        case 'abs':
          return Math.abs(args[0]!);
      }
      // Không tới được: tên hàm đã kiểm lúc đọc.
      throw new ExprError('unknown-fn', `Hàm không hợp lệ`, src, node.pos);
    }
    case 'binary': {
      if (node.op === 'and') {
        return evalNode(node.left, scope, src) !== 0 && evalNode(node.right, scope, src) !== 0 ? 1 : 0;
      }
      if (node.op === 'or') {
        return evalNode(node.left, scope, src) !== 0 || evalNode(node.right, scope, src) !== 0 ? 1 : 0;
      }
      const a = evalNode(node.left, scope, src);
      const b = evalNode(node.right, scope, src);
      switch (node.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          if (b === 0) throw new ExprError('div-zero', `Chia cho 0 (vị trí ${node.pos + 1})`, src, node.pos);
          return a / b;
        case '<':
          return a < b ? 1 : 0;
        case '<=':
          return a <= b ? 1 : 0;
        case '>':
          return a > b ? 1 : 0;
        case '>=':
          return a >= b ? 1 : 0;
        case '==':
          return Math.abs(a - b) < 1e-9 ? 1 : 0;
        case '!=':
          return Math.abs(a - b) < 1e-9 ? 0 : 1;
      }
    }
  }
}

/** Tính giá trị biểu thức với bảng biến cho trước. Ném ExprError nếu lỗi. */
export function evaluate(expr: string | number | CompiledExpr, scope: Scope): number {
  const c = typeof expr === 'object' ? expr : compile(expr);
  const v = evalNode(c.ast, scope, c.source);
  if (!Number.isFinite(v)) {
    throw new ExprError('not-finite', `Kết quả không hợp lệ (${v})`, c.source, 0);
  }
  return v;
}
