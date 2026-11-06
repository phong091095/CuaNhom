/**
 * Logic form nhập bộ cửa (D5) – thuần, không phụ thuộc giao diện.
 * Đọc số người dùng gõ, gọi engine, gắn lỗi/cảnh báo vào đúng ô (SRS SCR-04: "cảnh báo ngay dưới ô nhập"),
 * và quyết định có được lưu không (FR-DOR-07, BR-11: còn lỗi thì không lưu).
 */
import {
  bindUnits,
  computeDoor,
  glassKey,
  parseDecimal,
  type CheckResult,
  type DoorInput as EngineInput,
  type DoorResult,
  type DoorTemplate,
  type PriceBook,
} from '@matadoor/engine';
import { validateSymbol } from './symbols';
import type { DoorInput, DoorItem } from './types';

/** Giá trị form dạng chữ đúng như người dùng gõ (giữ nguyên "2012,6"). */
export interface DoorFormValues {
  symbol: string;
  W: string;
  H: string;
  qty: number;
  /** Tham số mẫu: số gõ tay hoặc giá trị lựa chọn, dạng chữ. */
  params: Record<string, string>;
  /** Mã kính theo ô kính. */
  glass: Record<string, string>;
  color: string | null;
  location: string;
  note: string;
}

export const QTY_MAX = 999;

/** Giá trị ban đầu cho bộ cửa mới: W, H để trống (thợ luôn đo thật – artboard "form trống"). */
export function newDoorValues(
  template: DoorTemplate,
  opts: { symbol: string; lastGlass?: Record<string, string>; color?: string | null; W?: string; H?: string },
): DoorFormValues {
  const glass: Record<string, string> = {};
  for (const g of template.glass) {
    const key = glassKey(g.key);
    glass[key] = opts.lastGlass?.[key] ?? g.defaultCode;
  }
  return {
    symbol: opts.symbol,
    W: opts.W ?? '',
    H: opts.H ?? '',
    qty: 1,
    params: Object.fromEntries(template.params.map((p) => [p.key, String(p.default)])),
    glass,
    color: opts.color ?? null,
    location: '',
    note: '',
  };
}

function mmText(v: number): string {
  return String(v).replace('.', ',');
}

/** Giá trị form từ bộ cửa đã lưu (để sửa). Tham số mẫu thiếu thì lấy mặc định. */
export function doorValues(door: DoorItem, template: DoorTemplate): DoorFormValues {
  const base = newDoorValues(template, { symbol: door.symbol, lastGlass: door.glass, color: door.color });
  return {
    ...base,
    W: mmText(door.W),
    H: mmText(door.H),
    qty: door.qty,
    params: {
      ...base.params,
      ...Object.fromEntries(Object.entries(door.params).map(([k, v]) => [k, template.params.some((p) => p.key === k && p.type === 'number') ? mmText(v) : String(v)])),
    },
    location: door.location ?? '',
    note: door.note ?? '',
  };
}

/**
 * "Cửa cùng loại" từ chi tiết cửa (D6): chép tham số, kính, màu, vị trí; rộng, cao, ghi chú để trống; 1 bộ.
 * Bộ mới theo mẫu mới nhất: tham số không còn trong mẫu thì bỏ, tham số mới thì lấy mặc định.
 */
export function copyDoorValues(source: DoorItem, template: DoorTemplate, symbol: string): DoorFormValues {
  const v = doorValues(source, template);
  const keys = new Set(template.params.map((p) => p.key));
  return { ...v, symbol, W: '', H: '', qty: 1, note: '', params: Object.fromEntries(Object.entries(v.params).filter(([k]) => keys.has(k))) };
}

export interface DoorFormEvaluation {
  /** Đầu vào cho engine; null nếu W/H/tham số chưa đọc được. */
  input: EngineInput | null;
  result: DoorResult | null;
  /** Lỗi theo ô: khóa là "symbol", "W", "H", "qty", tên tham số, "glass.<key>". */
  errors: Record<string, string>;
  /** Cảnh báo (không chặn lưu) theo ô. */
  warnings: Record<string, string>;
  /** Kiểm tra không gắn được với ô nào (hiện ở khối "Kiểm tra kỹ thuật"). */
  general: CheckResult[];
  /** Số ô / mục đang lỗi (thanh đáy: "Còn N ô cần sửa"). */
  errorCount: number;
  canSave: boolean;
}

/** Thứ tự ô trên form – dùng để nhảy tới ô lỗi đầu tiên. */
export function fieldOrder(template: DoorTemplate): string[] {
  return [
    'symbol',
    'qty',
    ...template.params.filter((p) => p.type === 'choice').map((p) => p.key),
    'W',
    'H',
    ...template.params.filter((p) => p.type === 'number').map((p) => p.key),
    ...template.glass.map((g) => `glass.${glassKey(g.key)}`),
  ];
}

/**
 * Đánh giá form: đọc số, kiểm ký hiệu, gọi engine, gom lỗi theo ô.
 * `showEmpty`: có báo lỗi ô bắt buộc đang trống không (chỉ sau khi người dùng chạm vào ô hoặc bấm Lưu).
 */
export function evaluateDoorForm(
  template: DoorTemplate,
  values: DoorFormValues,
  book: PriceBook,
  usedSymbols: readonly string[],
  showEmpty: { W?: boolean; H?: boolean } = {},
): DoorFormEvaluation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};
  const general: CheckResult[] = [];
  let blocking = false;

  const symErr = validateSymbol(values.symbol, usedSymbols);
  if (symErr) errors.symbol = symErr;

  const W = parseDecimal(values.W);
  const H = parseDecimal(values.H);
  if (values.W.trim() === '') {
    blocking = true;
    if (showEmpty.W) errors.W = 'Nhập chiều rộng W (mm), ví dụ 800';
  } else if (W === null || W <= 0) {
    errors.W = 'Chiều rộng là số mm lớn hơn 0, tối đa 1 chữ số thập phân';
  }
  if (values.H.trim() === '') {
    blocking = true;
    if (showEmpty.H) errors.H = 'Nhập chiều cao H (mm), ví dụ 2200';
  } else if (H === null || H <= 0) {
    errors.H = 'Chiều cao là số mm lớn hơn 0, tối đa 1 chữ số thập phân';
  }
  if (!Number.isInteger(values.qty) || values.qty < 1 || values.qty > QTY_MAX) {
    errors.qty = `Số bộ từ 1 đến ${QTY_MAX}`;
  }

  const params: Record<string, number> = {};
  for (const p of template.params) {
    const raw = values.params[p.key] ?? String(p.default);
    const v = p.type === 'number' ? parseDecimal(raw) : Number(raw);
    if (v === null || !Number.isFinite(v)) {
      errors[p.key] = raw.trim() === '' ? `Nhập ${p.label.toLowerCase()}` : `${p.label} là số, tối đa 1 chữ số thập phân`;
    } else {
      params[p.key] = v;
    }
  }

  let input: EngineInput | null = null;
  let result: DoorResult | null = null;
  const parsedOk = W !== null && H !== null && W > 0 && H > 0 && Object.keys(params).length === template.params.length;
  if (parsedOk) {
    input = { W, H, qty: Math.max(1, Math.min(QTY_MAX, Math.round(values.qty) || 1)), params, glass: values.glass };
    result = computeDoor(template, input, book);
    const known = new Set(fieldOrder(template));
    for (const c of result.checks) {
      const field = c.field && known.has(c.field) ? c.field : undefined;
      if (c.level === 'error') {
        if (field) {
          if (!errors[field]) errors[field] = c.message;
        } else general.push(c);
      } else if (c.level === 'warning' && field) {
        if (!warnings[field]) warnings[field] = c.message;
      } else {
        general.push(c);
      }
    }
    for (const e of result.dataErrors) {
      general.push({ id: 'data', level: 'error', message: bindUnits(`Lỗi dữ liệu mẫu cửa: ${e}`) });
    }
  }

  const errorCount = Object.keys(errors).length + general.filter((c) => c.level === 'error').length;
  const canSave = errorCount === 0 && !blocking && !!result && result.ok && result.dataErrors.length === 0;
  return { input, result, errors, warnings, general, errorCount, canSave };
}

/** Đầu vào lưu DB từ form đã hợp lệ. */
export function toDoorInput(template: DoorTemplate, values: DoorFormValues, ev: DoorFormEvaluation): DoorInput {
  if (!ev.input) throw new Error('Form chưa hợp lệ');
  return {
    symbol: values.symbol.trim(),
    templateId: template.id,
    templateVersion: template.version,
    W: ev.input.W,
    H: ev.input.H,
    qty: ev.input.qty,
    params: ev.input.params ?? {},
    glass: values.glass,
    color: values.color,
    location: values.location,
    note: values.note,
  };
}

/** Vị trí gợi ý: các vị trí đã dùng trong dự án trước, rồi vài vị trí thường gặp. Tối đa 8. */
export function locationSuggestions(used: readonly (string | null)[]): string[] {
  const out: string[] = [];
  for (const u of [...used, 'Tầng 1', 'Tầng 2', 'P. khách', 'P. ngủ', 'Bếp', 'WC', 'Ban công']) {
    const s = (u ?? '').trim();
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= 8) break;
  }
  return out;
}
