/**
 * Dự án mẫu (dùng ở Công cụ bản dev; GĐ 12 dùng cho "Xem dự án mẫu" lần đầu dùng – ĐX-11).
 * Chỉ dùng mẫu cửa đã kiểm (verified). Bộ D1 + S1 đúng ca TC-07 của SRS.
 */
import { TEMPLATES } from '@matadoor/data';
import { createDoor, suggestSymbol } from '@/db/repos/doors';
import { createProject } from '@/db/repos/projects';
import type { SqlDb } from '@/db/sql';
import type { Project } from './types';

const DOORS: { templateId: string; W: number; H: number; qty: number; params?: Record<string, number>; location?: string; color?: string }[] = [
  { templateId: 'xf55-cua-di-1-canh', W: 850, H: 2250, qty: 2, location: 'Tầng 1 – P. khách', color: 'Trắng sứ' },
  { templateId: 'xf55-cua-so-lua', W: 2600, H: 1400, qty: 1, params: { soCanh: 4 }, location: 'Tầng 1 – P. khách', color: 'Trắng sứ' },
  { templateId: 'xf55-cua-di-1-canh', W: 900, H: 2600, qty: 1, location: 'Tầng 2 – Ban công', color: 'Trắng sứ' },
  { templateId: 'xf55-cua-so-lua', W: 1400, H: 1350, qty: 2, params: { soCanh: 2 }, location: 'Tầng 2 – P. ngủ', color: 'Trắng sứ' },
];

export async function createSampleProject(db: SqlDb): Promise<Project> {
  const p = await createProject(
    db,
    { name: 'Dự án mẫu – Nhà anh Đoài', customer: 'Anh Đoài', phone: '0923 456 789', address: '53 Bình Hạ, Đồng Nai' },
    { isSample: true },
  );
  for (const d of DOORS) {
    const t = TEMPLATES.find((x) => x.id === d.templateId);
    if (!t || t.status !== 'verified') continue;
    await createDoor(db, p.id, {
      symbol: await suggestSymbol(db, p.id, t.symbolPrefix),
      templateId: t.id,
      templateVersion: t.version,
      W: d.W,
      H: d.H,
      qty: d.qty,
      ...(d.params ? { params: d.params } : {}),
      ...(d.location ? { location: d.location } : {}),
      ...(d.color ? { color: d.color } : {}),
    });
  }
  return p;
}
