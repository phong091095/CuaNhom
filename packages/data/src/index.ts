/**
 * @matadoor/data – gói dữ liệu kèm app (SRS mục 5: "dữ liệu gói kèm", chỉ đọc).
 * Thêm mẫu cửa: thêm file JSON vào src/templates, đăng ký ở TEMPLATES, thêm đáp án mẫu, chạy `npm run lock`.
 */

import type { DoorTemplate } from '@matadoor/engine';
import materialsJson from './materials.json';
import systemsJson from './systems.json';
import cuaDi1Canh from './templates/xf55-cua-di-1-canh.json';
import cuaSoLua from './templates/xf55-cua-so-lua.json';
import type { MaterialRecord } from './pricing';

export * from './pricing';

/** Phiên bản gói dữ liệu (đổi khi đổi bất kỳ mẫu hoặc bảng giá mặc định nào). */
export const DATA_VERSION = '2026.11.05-1';

export interface AluminumColor {
  name: string;
  /** Màu ô mẫu trong sheet chọn màu. */
  hex: string;
}

export interface AluminumSystem {
  id: string;
  brand: string;
  name: string;
  barLengthMm: number;
  /** Màu nhôm gợi ý (FR-DOR-05 – chỉ ghi nhận, không đổi giá). */
  colors: AluminumColor[];
  note?: string;
  colorNote?: string;
}

export const TEMPLATES: readonly DoorTemplate[] = [cuaDi1Canh, cuaSoLua] as unknown as DoorTemplate[];

export const MATERIALS: readonly MaterialRecord[] = materialsJson.materials as MaterialRecord[];

export const SYSTEMS: readonly AluminumSystem[] = systemsJson.systems;

export function findSystem(id: string): AluminumSystem | undefined {
  return SYSTEMS.find((s) => s.id === id);
}

/** Mẫu hiện cho người dùng: bản phát hành chỉ hiện mẫu đã kiểm (SRS 4.4); bản dev hiện cả mẫu nháp. */
export function visibleTemplates(includeDrafts: boolean): DoorTemplate[] {
  return TEMPLATES.filter((t) => includeDrafts || t.status === 'verified').sort(
    (a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name, 'vi'),
  );
}

export function findTemplate(id: string): DoorTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
