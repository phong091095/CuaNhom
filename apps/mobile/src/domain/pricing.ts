/**
 * Bảng giá engine dùng = vật tư của xưởng (DB) × hệ số nhóm (thông tin xưởng). Một nguồn giá duy nhất
 * (quy tắc thiết kế): form nhập cửa chỉ hiển thị kết quả kèm nguồn, không cho gõ giá.
 */
import type { PriceBook } from '@matadoor/engine';
import { buildPriceBook, type GroupFactors } from '@matadoor/data';
import { listMaterials, toRecords } from '@/db/repos/materials';
import { getWorkshop } from '@/db/repos/workshop';
import type { SqlDb } from '@/db/sql';
import type { MaterialRow } from './types';

export function priceBookFrom(materials: readonly MaterialRow[], factors: GroupFactors): PriceBook {
  return buildPriceBook(toRecords(materials), factors);
}

export async function loadPriceBook(db: SqlDb): Promise<PriceBook> {
  const [materials, ws] = await Promise.all([listMaterials(db), getWorkshop(db)]);
  return priceBookFrom(materials, ws.factors);
}
