/**
 * Bảng giá vật tư của xưởng (FR-MAT-01, 02; SRS 5.2; Q12).
 * - Vật tư gói kèm được chép vào DB lần đầu; giá người dùng sửa thì gói dữ liệu mới không ghi đè.
 * - Vật tư gói kèm không xóa được, chỉ sửa giá hoặc ẩn. Kính xưởng tự thêm xóa được khi chưa bộ cửa nào dùng.
 */
import { MATERIAL_GROUPS, type MaterialGroup } from '@matadoor/engine';
import type { MaterialRecord, PriceStatus } from '@matadoor/data';
import { NotFoundError, ValidationError } from '@/domain/errors';
import type { MaterialRow } from '@/domain/types';
import { now } from '../clock';
import type { SqlDb } from '../sql';

interface Row {
  code: string;
  origin: 'bundled' | 'user';
  name: string;
  grp: MaterialGroup;
  unit: string;
  kg_per_m: number | null;
  bar_length_mm: number | null;
  thickness_mm: number | null;
  cost_price: number;
  sale_price: number | null;
  price_status: string | null;
  price_edited: number;
  hidden: number;
  note: string | null;
  updated_at: number;
}

function toMaterial(r: Row): MaterialRow {
  return {
    code: r.code,
    name: r.name,
    group: r.grp,
    unit: r.unit,
    ...(r.kg_per_m !== null ? { kgPerM: r.kg_per_m } : {}),
    ...(r.bar_length_mm !== null ? { barLengthMm: r.bar_length_mm } : {}),
    ...(r.thickness_mm !== null ? { thicknessMm: r.thickness_mm } : {}),
    costPrice: r.cost_price,
    salePrice: r.sale_price,
    ...(r.price_status ? { priceStatus: r.price_status as PriceStatus } : {}),
    ...(r.note ? { note: r.note } : {}),
    origin: r.origin,
    priceEdited: r.price_edited === 1,
    hidden: r.hidden === 1,
    updatedAt: r.updated_at,
  };
}

export async function listMaterials(db: SqlDb, group?: MaterialGroup): Promise<MaterialRow[]> {
  const rows = group
    ? await db.getAll<Row>('SELECT * FROM materials WHERE grp = ? ORDER BY origin, code', [group])
    : await db.getAll<Row>('SELECT * FROM materials ORDER BY grp, origin, code');
  const order = new Map(MATERIAL_GROUPS.map((g, i) => [g, i]));
  return rows.map(toMaterial).sort((a, b) => (order.get(a.group) ?? 9) - (order.get(b.group) ?? 9));
}

export async function getMaterial(db: SqlDb, code: string): Promise<MaterialRow | null> {
  const r = await db.getFirst<Row>('SELECT * FROM materials WHERE code = ?', [code]);
  return r ? toMaterial(r) : null;
}

/**
 * Đồng bộ vật tư gói kèm vào DB (chạy mỗi lần mở app):
 * - thiếu thì thêm;
 * - đã có, chưa bị sửa giá → cập nhật theo gói (cả giá);
 * - đã sửa giá → chỉ cập nhật tên, đơn vị, kg/m, độ dày; giữ giá của xưởng.
 * Trả về số dòng thêm / cập nhật.
 */
export async function syncBundledMaterials(
  db: SqlDb,
  bundled: readonly MaterialRecord[],
): Promise<{ added: number; updated: number }> {
  let added = 0;
  let updated = 0;
  const t = now();
  await db.transaction(async () => {
    for (const m of bundled) {
      const cur = await db.getFirst<Row>('SELECT * FROM materials WHERE code = ?', [m.code]);
      if (!cur) {
        await db.run(
          `INSERT INTO materials (code, origin, name, grp, unit, kg_per_m, bar_length_mm, thickness_mm, cost_price,
             sale_price, price_status, price_edited, hidden, note, updated_at)
           VALUES (?, 'bundled', ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, 0, ?, ?)`,
          [m.code, m.name, m.group, m.unit, m.kgPerM ?? null, m.barLengthMm ?? null, m.thicknessMm ?? null, m.costPrice, m.priceStatus ?? null, m.note ?? null, t],
        );
        added++;
        continue;
      }
      if (cur.origin !== 'bundled') continue;
      const keepPrice = cur.price_edited === 1;
      const same =
        cur.name === m.name &&
        cur.unit === m.unit &&
        cur.kg_per_m === (m.kgPerM ?? null) &&
        cur.bar_length_mm === (m.barLengthMm ?? null) &&
        cur.thickness_mm === (m.thicknessMm ?? null) &&
        (keepPrice || (cur.cost_price === m.costPrice && cur.price_status === (m.priceStatus ?? null)));
      if (same) continue;
      await db.run(
        `UPDATE materials SET name = ?, grp = ?, unit = ?, kg_per_m = ?, bar_length_mm = ?, thickness_mm = ?, note = ?,
           cost_price = CASE WHEN price_edited = 1 THEN cost_price ELSE ? END,
           price_status = CASE WHEN price_edited = 1 THEN price_status ELSE ? END,
           updated_at = ?
         WHERE code = ?`,
        [m.name, m.group, m.unit, m.kgPerM ?? null, m.barLengthMm ?? null, m.thicknessMm ?? null, m.note ?? null, m.costPrice, m.priceStatus ?? null, t, m.code],
      );
      updated++;
    }
  });
  return { added, updated };
}

function checkPrice(field: string, v: number | null | undefined): void {
  if (v === null || v === undefined) return;
  if (!Number.isFinite(v) || v < 0) throw new ValidationError(field, 'Giá phải là số không âm');
}

/** Sửa giá gốc và/hoặc giá bán riêng (null = bỏ giá riêng, theo hệ số nhóm) – C9. */
export async function updateMaterialPrice(
  db: SqlDb,
  code: string,
  price: { costPrice?: number; salePrice?: number | null },
): Promise<MaterialRow> {
  const cur = await getMaterial(db, code);
  if (!cur) throw new NotFoundError(`vật tư ${code}`);
  checkPrice('costPrice', price.costPrice);
  checkPrice('salePrice', price.salePrice);
  if (price.costPrice === 0 && cur.group !== 'nhancong') throw new ValidationError('costPrice', 'Giá gốc phải lớn hơn 0');
  const cost = price.costPrice ?? cur.costPrice;
  const sale = price.salePrice === undefined ? (cur.salePrice ?? null) : price.salePrice;
  await db.run('UPDATE materials SET cost_price = ?, sale_price = ?, price_edited = 1, price_status = ?, updated_at = ? WHERE code = ?', [
    cost,
    sale,
    'xuong',
    now(),
    code,
  ]);
  return (await getMaterial(db, code))!;
}

/** "Về giá gói kèm": lấy lại giá gốc của gói, bỏ giá riêng. */
export async function resetMaterialPrice(db: SqlDb, code: string, bundled: readonly MaterialRecord[]): Promise<MaterialRow> {
  const b = bundled.find((m) => m.code === code);
  if (!b) throw new ValidationError('code', 'Vật tư này không có trong gói dữ liệu');
  await db.run('UPDATE materials SET cost_price = ?, sale_price = NULL, price_edited = 0, price_status = ?, updated_at = ? WHERE code = ?', [
    b.costPrice,
    b.priceStatus ?? null,
    now(),
    code,
  ]);
  const r = await getMaterial(db, code);
  if (!r) throw new NotFoundError(`vật tư ${code}`);
  return r;
}

/**
 * Ẩn / hiện vật tư. Không cho ẩn kính đang là kính mặc định của một mẫu cửa
 * (bộ cửa mới sẽ không có kính hợp lệ để chọn).
 */
export async function setMaterialHidden(db: SqlDb, code: string, hidden: boolean, protectedCodes: readonly string[] = []): Promise<void> {
  if (hidden && protectedCodes.includes(code)) {
    throw new ValidationError('hidden', 'Đây là kính mặc định của một mẫu cửa nên không ẩn được');
  }
  const r = await db.run('UPDATE materials SET hidden = ?, updated_at = ? WHERE code = ?', [hidden ? 1 : 0, now(), code]);
  if (r.changes === 0) throw new NotFoundError(`vật tư ${code}`);
}

export interface NewGlassInput {
  name: string;
  /** Tổng độ dày các lớp kính, không tính khe khí (BR-07). */
  thicknessMm: number;
  costPrice: number;
  salePrice?: number | null;
}

/** Thêm kính riêng của xưởng (Q12). Mã tự sinh KU-001, KU-002… */
export async function addUserGlass(db: SqlDb, input: NewGlassInput): Promise<MaterialRow> {
  const name = input.name.trim();
  if (name === '') throw new ValidationError('name', 'Nhập tên kính');
  if (!(input.thicknessMm >= 3 && input.thicknessMm <= 40)) {
    throw new ValidationError('thicknessMm', 'Độ dày kính trong khoảng 3–40 mm (không tính khe khí)');
  }
  if (!(input.costPrice > 0)) throw new ValidationError('costPrice', 'Giá gốc phải lớn hơn 0');
  checkPrice('salePrice', input.salePrice);
  const rows = await db.getAll<{ code: string }>("SELECT code FROM materials WHERE code LIKE 'KU-%'");
  const max = rows.reduce((m, r) => Math.max(m, Number(r.code.slice(3)) || 0), 0);
  const code = `KU-${String(max + 1).padStart(3, '0')}`;
  await db.run(
    `INSERT INTO materials (code, origin, name, grp, unit, thickness_mm, cost_price, sale_price, price_status, price_edited, hidden, updated_at)
     VALUES (?, 'user', ?, 'kinh', 'm²', ?, ?, ?, 'xuong', 1, 0, ?)`,
    [code, name, input.thicknessMm, input.costPrice, input.salePrice ?? null, now()],
  );
  return (await getMaterial(db, code))!;
}

/** Mã vật tư đang được bộ cửa dùng (kể cả bộ trong "Đã xóa gần đây"). */
export async function codesUsedByDoors(db: SqlDb): Promise<Set<string>> {
  const rows = await db.getAll<{ glass: string }>('SELECT glass FROM door_items');
  const used = new Set<string>();
  for (const r of rows) {
    try {
      for (const v of Object.values(JSON.parse(r.glass) as Record<string, unknown>)) if (typeof v === 'string') used.add(v);
    } catch {
      // dữ liệu hỏng: bỏ qua dòng
    }
  }
  return used;
}

/** Xóa kính xưởng tự thêm khi chưa bộ cửa nào dùng; vật tư gói kèm không xóa được (SRS 5.2). */
export async function deleteUserMaterial(db: SqlDb, code: string): Promise<void> {
  const m = await getMaterial(db, code);
  if (!m) throw new NotFoundError(`vật tư ${code}`);
  if (m.origin !== 'user') throw new ValidationError('code', 'Vật tư của gói dữ liệu không xóa được, chỉ sửa giá hoặc ẩn');
  if ((await codesUsedByDoors(db)).has(code)) {
    throw new ValidationError('code', 'Có bộ cửa đang dùng vật tư này (kể cả trong Đã xóa gần đây) – hãy ẩn thay vì xóa');
  }
  await db.run('DELETE FROM materials WHERE code = ?', [code]);
}

/** Bảng vật tư cho buildPriceBook (kể cả vật tư ẩn: bộ cửa đang dùng vẫn tính được). */
export function toRecords(rows: readonly MaterialRow[]): MaterialRecord[] {
  return rows.map(({ origin: _o, priceEdited: _p, hidden: _h, updatedAt: _u, ...rec }) => rec);
}

