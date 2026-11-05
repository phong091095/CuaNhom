/**
 * Bản chụp mẫu cửa theo phiên bản (SRS 5.1, 5.2; ĐX-04): mỗi bộ cửa tính theo đúng phiên bản mẫu của nó,
 * nên bản app mới đổi công thức không làm số của bộ cửa cũ tự đổi.
 */
import type { DoorTemplate } from '@matadoor/engine';
import { now } from '../clock';
import type { SqlDb } from '../sql';

/**
 * Lưu bản chụp cho mẫu gói kèm chưa có (id, version). Không bao giờ ghi đè bản đã có.
 * Trả về danh sách (id@version) có nội dung khác bản đã lưu – dấu hiệu sửa mẫu mà quên tăng version.
 */
export async function ensureTemplateSnapshots(db: SqlDb, templates: readonly DoorTemplate[]): Promise<{ added: number; conflicts: string[] }> {
  let added = 0;
  const conflicts: string[] = [];
  await db.transaction(async () => {
    for (const t of templates) {
      const json = JSON.stringify(t);
      const cur = await db.getFirst<{ json: string }>('SELECT json FROM template_snapshots WHERE template_id = ? AND version = ?', [t.id, t.version]);
      if (!cur) {
        await db.run('INSERT INTO template_snapshots (template_id, version, json, saved_at) VALUES (?, ?, ?, ?)', [t.id, t.version, json, now()]);
        added++;
      } else if (cur.json !== json) {
        conflicts.push(`${t.id}@${t.version}`);
      }
    }
  });
  return { added, conflicts };
}

export async function getTemplateSnapshot(db: SqlDb, id: string, version: number): Promise<DoorTemplate | null> {
  const r = await db.getFirst<{ json: string }>('SELECT json FROM template_snapshots WHERE template_id = ? AND version = ?', [id, version]);
  return r ? (JSON.parse(r.json) as DoorTemplate) : null;
}

/** Mọi bản chụp, khóa "id@version". */
export async function loadTemplateSnapshots(db: SqlDb): Promise<Map<string, DoorTemplate>> {
  const rows = await db.getAll<{ template_id: string; version: number; json: string }>('SELECT template_id, version, json FROM template_snapshots');
  return new Map(rows.map((r) => [`${r.template_id}@${r.version}`, JSON.parse(r.json) as DoorTemplate]));
}
