/**
 * Chuẩn bị DB sau khi mở (dùng chung cho app và test):
 * migrate → đồng bộ vật tư gói kèm → lưu bản chụp mẫu cửa → xóa hẳn mục quá 30 ngày.
 */
import { DATA_VERSION, MATERIALS, TEMPLATES } from '@matadoor/data';
import { syncBundledMaterials } from './repos/materials';
import { setSetting, SETTING_KEYS } from './repos/settings';
import { ensureTemplateSnapshots } from './repos/snapshots';
import { purgeExpired } from './repos/trash';
import { migrate } from './schema';
import type { SqlDb } from './sql';

export interface InitReport {
  migratedFrom: number;
  materialsAdded: number;
  materialsUpdated: number;
  snapshotsAdded: number;
  /** Mẫu đổi nội dung mà không tăng version (lỗi dữ liệu, chỉ báo ở bản dev). */
  snapshotConflicts: string[];
  purged: { projects: number; doors: number; events: number };
}

export async function initDatabase(db: SqlDb): Promise<InitReport> {
  const m = await migrate(db);
  const mat = await syncBundledMaterials(db, MATERIALS);
  const snap = await ensureTemplateSnapshots(db, TEMPLATES);
  const purged = await purgeExpired(db);
  await setSetting(db, SETTING_KEYS.dataVersionSeen, DATA_VERSION);
  return {
    migratedFrom: m.from,
    materialsAdded: mat.added,
    materialsUpdated: mat.updated,
    snapshotsAdded: snap.added,
    snapshotConflicts: snap.conflicts,
    purged,
  };
}
