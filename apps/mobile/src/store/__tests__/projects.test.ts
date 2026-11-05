/** @jest-environment node */
import { getDb, setDbForTests } from '@/db/client';
import { listEvents } from '@/db/repos/events';
import { freshDb, installTestClock, type TestClock } from '@/db/testing/setup';
import { useProjects } from '../projects';
import { useWorkshop } from '../workshop';

let clock: TestClock;
beforeEach(async () => {
  clock = installTestClock();
  setDbForTests(await freshDb());
  useProjects.setState({ items: [], query: '', loading: false, error: null });
});

describe('store dự án', () => {
  it('tạo → danh sách có dự án, ghi nhật ký project_created', async () => {
    const p = await useProjects.getState().create({ name: 'Anh Đoài' });
    expect(useProjects.getState().items.map((x) => x.id)).toEqual([p.id]);
    expect((await listEvents(await getDb())).map((e) => e.type)).toEqual(['project_created']);
  });

  it('xóa rồi hoàn tác (snackbar 10 giây)', async () => {
    const p = await useProjects.getState().create({ name: 'A' });
    const undo = await useProjects.getState().remove(p.id);
    expect(useProjects.getState().items).toEqual([]);
    await undo();
    expect(useProjects.getState().items.map((x) => x.id)).toEqual([p.id]);
  });

  it('tìm kiếm, nhân bản', async () => {
    await useProjects.getState().create({ name: 'Nhà phố Biên Hòa' });
    clock.advance(1000);
    const b = await useProjects.getState().create({ name: 'Văn phòng' });
    clock.advance(1000);
    await useProjects.getState().duplicate(b.id);
    expect(useProjects.getState().items.map((x) => x.name)).toEqual(['Văn phòng (bản sao)', 'Văn phòng', 'Nhà phố Biên Hòa']);
    await useProjects.getState().setQuery('bien hoa');
    expect(useProjects.getState().items.map((x) => x.name)).toEqual(['Nhà phố Biên Hòa']);
  });
});

describe('store thông tin xưởng', () => {
  it('tải và lưu', async () => {
    await useWorkshop.getState().load();
    expect(useWorkshop.getState().workshop?.vatRate).toBe(0.08);
    await useWorkshop.getState().save({ name: 'Xưởng Phát Đạt' });
    expect(useWorkshop.getState().workshop?.name).toBe('Xưởng Phát Đạt');
  });
});
