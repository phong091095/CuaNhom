/** @jest-environment node */
import { TEMPLATES } from '@matadoor/data';
import * as doors from '@/db/repos/doors';
import * as m from '@/db/repos/materials';
import * as projects from '@/db/repos/projects';
import * as quotes from '@/db/repos/quotes';
import type { SqlDb } from '@/db/sql';
import { freshDb, installTestClock } from '@/db/testing/setup';
import { computeProject } from '../projectCalc';

let db: SqlDb;
beforeEach(async () => {
  installTestClock();
  db = await freshDb();
});

const di = (symbol: string, W: number, H: number, qty: number) => ({ symbol, templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W, H, qty });

describe('tính cả dự án từ DB', () => {
  it('TC-04 qua lưu trữ: nêm kính cộng số lẻ các bộ → 18', async () => {
    const p = await projects.createProject(db, { name: 'TC-04' });
    await doors.createDoor(db, p.id, di('D1', 800, 2200, 2));
    await doors.createDoor(db, p.id, { symbol: 'S1', templateId: 'xf55-cua-so-lua', templateVersion: 1, W: 1400, H: 1350, qty: 1, params: { soCanh: 2 } });
    const c = await computeProject(db, p.id);
    expect(c.summary.accessories.find((a) => a.code === 'PK-NEM-5')!.qty).toBe(18);
    expect(c.summary.sets).toBe(3);
    expect(c.doors.map((d) => d.result.ok)).toEqual([true, true]);
    expect(c.doors.every((d) => d.newerTemplateVersion === null)).toBe(true);
  });

  it('bộ cửa tính theo BẢN CHỤP đúng phiên bản mẫu của nó, không theo mẫu gói kèm (SRS 5.2)', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    await doors.createDoor(db, p.id, di('D1', 800, 2200, 1));
    // Giả lập: bản chụp v1 trong DB có khungChiem = 40 (khác gói kèm 36).
    const t = TEMPLATES.find((x) => x.id === 'xf55-cua-di-1-canh')!;
    const v1 = { ...t, constants: { ...t.constants, khungChiem: { value: 40 } } };
    await db.run('UPDATE template_snapshots SET json = ? WHERE template_id = ? AND version = 1', [JSON.stringify(v1), t.id]);
    const c = await computeProject(db, p.id);
    expect(c.doors[0]!.result.profiles.find((x) => x.role === 'canh_ngang')!.length).toBe(800 - 80 - 10);
  });

  it('bộ cửa thuộc phiên bản mẫu cũ hơn gói kèm được đánh dấu "mẫu đã cập nhật"', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    const t = TEMPLATES.find((x) => x.id === 'xf55-cua-di-1-canh')!;
    await db.run('INSERT INTO template_snapshots (template_id, version, json, saved_at) VALUES (?, 0, ?, 0)', [t.id, JSON.stringify({ ...t, version: 0 })]);
    await doors.createDoor(db, p.id, { ...di('D1', 800, 2200, 1), templateVersion: 0 });
    const c = await computeProject(db, p.id);
    expect(c.doors[0]!.newerTemplateVersion).toBe(t.version);
    expect(c.doors[0]!.result.ok).toBe(true);
  });

  it('thiếu bản chụp mẫu: báo lỗi dữ liệu, không làm hỏng cả dự án', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    await doors.createDoor(db, p.id, { ...di('D1', 800, 2200, 1), templateId: 'mau-la', templateVersion: 3 });
    await doors.createDoor(db, p.id, di('D2', 800, 2200, 1));
    const c = await computeProject(db, p.id);
    expect(c.doors[0]!.result.dataErrors[0]).toMatch(/mau-la phiên bản 3/);
    expect(c.summary.invalidDoors).toEqual(['D1']);
    expect(c.summary.sets).toBe(1);
  });

  it('TC-08 qua lưu trữ: tăng giá nhôm 10% sau khi xuất – báo giá đã lưu giữ số cũ, bộ cửa mở lại ra giá mới', async () => {
    const p = await projects.createProject(db, { name: 'A' });
    await doors.createDoor(db, p.id, di('D1', 800, 2200, 1));
    const before = await computeProject(db, p.id);
    const q = await quotes.saveQuote(db, { projectId: p.id, mode: 'op1', audience: 'khach', total: before.summary.op1, doc: { op1: before.summary.op1 } });
    for (const code of ['XF-C3328', 'XF-C3303', 'XF-NEP-55']) {
      const cur = (await m.getMaterial(db, code))!;
      await m.updateMaterialPrice(db, code, { costPrice: cur.costPrice * 1.1 });
    }
    const after = await computeProject(db, p.id);
    expect(after.summary.op1).toBeGreaterThan(before.summary.op1);
    const stored = await quotes.getQuote(db, q.id);
    expect(stored!.total).toBe(before.summary.op1);
    expect(stored!.doc).toEqual({ op1: before.summary.op1 });
  });

  it('dự án không có hoặc đã xóa', async () => {
    await expect(computeProject(db, 'khong-co')).rejects.toThrow('Không tìm thấy');
  });
});
