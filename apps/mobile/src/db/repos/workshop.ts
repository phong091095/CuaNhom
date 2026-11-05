/** Thông tin xưởng và mặc định (một dòng, id = 1) – FR-SET-01, FR-SET-02, FR-QUO-05/06, FR-MAT-02. */
import { validateCutSettings } from '@matadoor/engine';
import { validateFactor } from '@matadoor/data';
import { ValidationError } from '@/domain/errors';
import type { Workshop } from '@/domain/types';
import { now } from '../clock';
import type { SqlDb } from '../sql';

interface WorkshopRow {
  name: string;
  phone: string;
  address: string;
  logo: string | null;
  quote_note: string;
  vat_enabled: number;
  vat_rate: number;
  bar_length: number;
  kerf: number;
  trim: number;
  factor_nhom: number;
  factor_kinh: number;
  factor_phukien: number;
  factor_nhancong: number;
  updated_at: number;
}

function toWorkshop(r: WorkshopRow): Workshop {
  return {
    name: r.name,
    phone: r.phone,
    address: r.address,
    logo: r.logo,
    quoteNote: r.quote_note,
    vatEnabled: r.vat_enabled === 1,
    vatRate: r.vat_rate,
    defaultCut: { barLength: r.bar_length, kerf: r.kerf, trim: r.trim },
    factors: { nhom: r.factor_nhom, kinh: r.factor_kinh, phukien: r.factor_phukien, nhancong: r.factor_nhancong },
    updatedAt: r.updated_at,
  };
}

export async function getWorkshop(db: SqlDb): Promise<Workshop> {
  const r = await db.getFirst<WorkshopRow>('SELECT * FROM workshop WHERE id = 1');
  if (!r) throw new Error('Thiếu dòng thông tin xưởng');
  return toWorkshop(r);
}

export type WorkshopPatch = Partial<Omit<Workshop, 'updatedAt'>>;

/** Logo dạng data URI tối đa ~1,5 MB (ảnh đã thu ≤ 512 px thường dưới 200 KB). */
export const MAX_LOGO_CHARS = 2_000_000;

export async function updateWorkshop(db: SqlDb, patch: WorkshopPatch): Promise<Workshop> {
  const cur = await getWorkshop(db);
  const next: Workshop = {
    ...cur,
    ...patch,
    defaultCut: { ...cur.defaultCut, ...patch.defaultCut },
    factors: { ...cur.factors, ...patch.factors },
    updatedAt: now(),
  };
  const cutErr = validateCutSettings(next.defaultCut);
  if (cutErr.length > 0) throw new ValidationError('defaultCut', cutErr[0]!);
  for (const [g, f] of Object.entries(next.factors)) {
    const e = validateFactor(f);
    if (e) throw new ValidationError(`factors.${g}`, e);
  }
  if (!(next.vatRate >= 0 && next.vatRate <= 1)) throw new ValidationError('vatRate', 'Thuế suất VAT phải trong khoảng 0–100%');
  if (next.logo !== null && (!next.logo.startsWith('data:image/') || next.logo.length > MAX_LOGO_CHARS)) {
    throw new ValidationError('logo', 'Ảnh logo không hợp lệ hoặc quá lớn');
  }
  await db.run(
    `UPDATE workshop SET name = ?, phone = ?, address = ?, logo = ?, quote_note = ?, vat_enabled = ?, vat_rate = ?,
       bar_length = ?, kerf = ?, trim = ?, factor_nhom = ?, factor_kinh = ?, factor_phukien = ?, factor_nhancong = ?,
       updated_at = ? WHERE id = 1`,
    [
      next.name.trim(),
      next.phone.trim(),
      next.address.trim(),
      next.logo,
      next.quoteNote,
      next.vatEnabled ? 1 : 0,
      next.vatRate,
      next.defaultCut.barLength,
      next.defaultCut.kerf,
      next.defaultCut.trim,
      next.factors.nhom,
      next.factors.kinh,
      next.factors.phukien,
      next.factors.nhancong,
      next.updatedAt,
    ],
  );
  return getWorkshop(db);
}
