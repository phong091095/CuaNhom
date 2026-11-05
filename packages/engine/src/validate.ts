/**
 * Kiểm dữ liệu mẫu cửa trước khi dùng (SRS BR-12, NFR-MNT-01, mục 4.4).
 * Dùng trong test của gói dữ liệu và khi nhận gói dữ liệu mới.
 */

import { compile, ExprError } from './expr';
import { glassKey, RESERVED_VARS } from './compute';
import type { DoorTemplate, Expr, MaterialGroup, PriceBook } from './types';

export interface TemplateIssue {
  templateId: string;
  where: string;
  message: string;
}

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Kiểm một mẫu: biểu thức đọc được; mọi biến được định nghĩa TRƯỚC khi dùng theo thứ tự BR-01;
 * mã vật tư có trong bảng giá và đúng nhóm; tên biến không trùng; tham số hợp lệ.
 */
export function validateTemplate(t: DoorTemplate, book: PriceBook): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  const add = (where: string, message: string) => issues.push({ templateId: t.id, where, message });
  const defined = new Set<string>(['W', 'H', 'area']);

  const declare = (name: string, where: string) => {
    if (!IDENT.test(name)) add(where, `Tên biến "${name}" không hợp lệ`);
    if (defined.has(name)) add(where, `Tên biến "${name}" bị trùng`);
    defined.add(name);
  };

  const use = (expr: Expr, where: string) => {
    try {
      const c = compile(expr);
      for (const v of c.vars) {
        if (!defined.has(v)) add(where, `Dùng biến "${v}" trước khi định nghĩa (hoặc chưa định nghĩa)`);
      }
    } catch (e) {
      if (e instanceof ExprError) add(where, e.message);
      else throw e;
    }
  };

  const mat = (code: string, group: MaterialGroup, where: string) => {
    const m = Object.prototype.hasOwnProperty.call(book, code) ? book[code] : undefined;
    if (!m) add(where, `Không có vật tư mã "${code}"`);
    else if (m.group !== group) add(where, `Vật tư "${code}" thuộc nhóm "${m.group}", cần "${group}"`);
  };

  if (!Number.isInteger(t.version) || t.version < 1) add('version', 'Phiên bản mẫu phải là số nguyên ≥ 1');
  if (!t.symbolPrefix) add('symbolPrefix', 'Thiếu tiền tố ký hiệu bộ cửa');

  for (const p of t.params) {
    declare(p.key, `params.${p.key}`);
    if (p.type === 'choice') {
      if (!p.options || p.options.length === 0) add(`params.${p.key}`, 'Tham số lựa chọn phải có danh sách');
      else if (!p.options.some((o) => o.value === p.default)) {
        add(`params.${p.key}`, 'Giá trị mặc định không có trong danh sách');
      }
    } else {
      if (p.min !== undefined && p.default < p.min) add(`params.${p.key}`, 'Mặc định nhỏ hơn tối thiểu');
      if (p.max !== undefined && p.default > p.max) add(`params.${p.key}`, 'Mặc định lớn hơn tối đa');
    }
  }
  for (const key of Object.keys(t.constants)) declare(key, `constants.${key}`);
  for (const d of t.derived) {
    use(d.expr, `derived.${d.key}`);
    declare(d.key, `derived.${d.key}`);
  }
  for (const r of t.profiles) {
    use(r.length, `profiles.${r.role}.length`);
    use(r.qty, `profiles.${r.role}.qty`);
    mat(r.code, 'nhom', `profiles.${r.role}.code`);
    declare(r.role, `profiles.${r.role}`);
    declare(`${r.role}_qty`, `profiles.${r.role}`);
    declare(`${r.role}_total`, `profiles.${r.role}`);
  }
  for (const g of t.glass) {
    const key = glassKey(g.key);
    use(g.width, `glass.${key}.width`);
    use(g.height, `glass.${key}.height`);
    use(g.qty, `glass.${key}.qty`);
    mat(g.defaultCode, 'kinh', `glass.${key}.defaultCode`);
    for (const suffix of ['w', 'h', 'qty', 'area', 'weight']) declare(`${key}_${suffix}`, `glass.${key}`);
  }
  defined.add('glass_perimeter_total');
  for (const a of t.accessories) {
    use(a.qty, `accessories.${a.code}.qty`);
    mat(a.code, 'phukien', `accessories.${a.code}`);
  }
  for (const l of t.labor) {
    use(l.qty, `labor.${l.code}.qty`);
    mat(l.code, 'nhancong', `labor.${l.code}`);
  }
  const ids = new Set<string>();
  for (const c of t.checks) {
    if (ids.has(c.id)) add(`checks.${c.id}`, 'Mã kiểm tra bị trùng');
    ids.add(c.id);
    use(c.when, `checks.${c.id}`);
    for (const m of c.message.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)) {
      if (!defined.has(m[1]!)) add(`checks.${c.id}.message`, `Câu thông báo dùng biến lạ "${m[1]}"`);
    }
  }
  for (const r of RESERVED_VARS) {
    if (t.params.some((p) => p.key === r) || r in t.constants || t.derived.some((d) => d.key === r)) {
      add('vars', `Không được đặt biến trùng tên dành riêng "${r}"`);
    }
  }
  if (t.defaults.W <= 0 || t.defaults.H <= 0) add('defaults', 'Kích thước mặc định phải > 0');
  return issues;
}
