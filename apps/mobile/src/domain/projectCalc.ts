/**
 * Tính cả dự án từ DB: mỗi bộ cửa tính bằng BẢN CHỤP đúng phiên bản mẫu của nó (SRS 5.2)
 * và bảng giá hiện tại của xưởng. Kết quả không lưu (luôn tính lại khi mở).
 */
import { computeDoor, summarizeProject, type DoorResult, type DoorTemplate, type PriceBook, type ProjectSummary } from '@matadoor/engine';
import { findTemplate } from '@matadoor/data';
import { getDoor, listDoors } from '@/db/repos/doors';
import { getProject } from '@/db/repos/projects';
import { getTemplateSnapshot, loadTemplateSnapshots } from '@/db/repos/snapshots';
import type { SqlDb } from '@/db/sql';
import { NotFoundError } from './errors';
import { loadPriceBook } from './pricing';
import type { DoorItem, Project } from './types';

export interface ComputedDoor {
  door: DoorItem;
  /** null nếu không còn bản chụp mẫu đúng phiên bản (dữ liệu hỏng). */
  template: DoorTemplate | null;
  result: DoorResult;
  /** Gói kèm app có phiên bản mẫu mới hơn bộ cửa này ("Mẫu đã cập nhật" – GĐ 11). */
  newerTemplateVersion: number | null;
}

export interface ComputedProject {
  project: Project;
  doors: ComputedDoor[];
  summary: ProjectSummary;
  book: PriceBook;
}

function missingTemplateResult(door: DoorItem): DoorResult {
  const zero = { nhom: 0, kinh: 0, phukien: 0, nhancong: 0, total: 0 };
  const areaPerSet = (door.W * door.H) / 1e6;
  return {
    ok: false,
    dataErrors: [`Không có dữ liệu mẫu ${door.templateId} phiên bản ${door.templateVersion}`],
    checks: [],
    areaPerSet,
    area: areaPerSet * door.qty,
    qty: door.qty,
    profiles: [],
    glass: [],
    accessories: [],
    labor: [],
    cost: zero,
    sale: { ...zero },
    profit: 0,
    salePerSet: 0,
    costPerSet: 0,
    salePerM2: 0,
    scope: {},
  };
}

export function computeDoorItem(door: DoorItem, template: DoorTemplate | null, book: PriceBook): DoorResult {
  if (!template) return missingTemplateResult(door);
  return computeDoor(template, { W: door.W, H: door.H, qty: door.qty, params: door.params, glass: door.glass }, book);
}

function computeDoors(items: readonly DoorItem[], snapshots: ReadonlyMap<string, DoorTemplate>, book: PriceBook): ComputedDoor[] {
  return items.map((door) => {
    const template = snapshots.get(`${door.templateId}@${door.templateVersion}`) ?? null;
    const bundled = findTemplate(door.templateId);
    return {
      door,
      template,
      result: computeDoorItem(door, template, book),
      newerTemplateVersion: bundled && bundled.version > door.templateVersion ? bundled.version : null,
    };
  });
}

function summarize(doors: readonly ComputedDoor[], book: PriceBook): ProjectSummary {
  return summarizeProject(
    doors.map((d) => ({ id: d.door.id, symbol: d.door.symbol, color: d.door.color, result: d.result })),
    book,
  );
}

export async function computeProject(db: SqlDb, projectId: string): Promise<ComputedProject> {
  const project = await getProject(db, projectId);
  if (!project || project.deletedAt !== null) throw new NotFoundError('dự án');
  const [items, snapshots, book] = await Promise.all([listDoors(db, projectId), loadTemplateSnapshots(db), loadPriceBook(db)]);
  const doors = computeDoors(items, snapshots, book);
  return { project, doors, summary: summarize(doors, book), book };
}

/** Tổng của một dự án cho thẻ ở danh sách (B1). */
export interface ProjectTotals {
  /** Báo giá OP1. */
  op1: number;
  /** Giá vốn. */
  cost: number;
  area: number;
  sets: number;
  /** Số bộ cửa có lỗi (không tính được hoặc có lỗi chặn lưu). */
  invalidDoors: number;
}

/** Tính tổng nhiều dự án một lượt (đọc bảng giá và bản chụp mẫu một lần). */
export async function computeProjectTotals(db: SqlDb, projectIds: readonly string[]): Promise<Map<string, ProjectTotals>> {
  const out = new Map<string, ProjectTotals>();
  if (projectIds.length === 0) return out;
  const [snapshots, book] = await Promise.all([loadTemplateSnapshots(db), loadPriceBook(db)]);
  for (const id of projectIds) {
    const s = summarize(computeDoors(await listDoors(db, id), snapshots, book), book);
    out.set(id, { op1: s.op1, cost: s.cost.total, area: s.area, sets: s.sets, invalidDoors: s.invalidDoors.length });
  }
  return out;
}

export interface ComputedSingleDoor extends ComputedDoor {
  project: Project;
  book: PriceBook;
}

/** Tính một bộ cửa (D6) theo bản chụp đúng phiên bản mẫu của nó. */
export async function computeSingleDoor(db: SqlDb, doorId: string): Promise<ComputedSingleDoor> {
  const door = await getDoor(db, doorId);
  if (!door || door.deletedAt !== null) throw new NotFoundError('bộ cửa');
  const project = await getProject(db, door.projectId);
  if (!project || project.deletedAt !== null) throw new NotFoundError('dự án');
  const [template, book] = await Promise.all([getTemplateSnapshot(db, door.templateId, door.templateVersion), loadPriceBook(db)]);
  const [computed] = computeDoors([door], new Map(template ? [[`${door.templateId}@${door.templateVersion}`, template]] : []), book);
  return { ...computed!, project, book };
}
