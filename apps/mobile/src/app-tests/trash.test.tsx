/**
 * Mỗi nhóm màn một file: expo-router giữ trạng thái chặn rời màn (usePreventRemove) ở singleton,
 * nên ca "rời form" để cuối file riêng để không ảnh hưởng ca khác.
 */
import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { createProject, getProject, listProjects, softDeleteProject } from '@/db/repos/projects';
import type { SqlDb } from '@/db/sql';
import { renderApp, setupDb } from './harness';

jest.setTimeout(30_000);

let db: SqlDb;
beforeEach(async () => {
  db = await setupDb();
});

const text = (s: string | RegExp) => screen.findByText(s, {}, { timeout: 4000 });

describe('C1b – Đã xóa gần đây', () => {
  it('khôi phục dự án; xóa hẳn có xác nhận', async () => {
    const a = await createProject(db, { name: 'Dự án A' });
    const b = await createProject(db, { name: 'Dự án B' });
    await softDeleteProject(db, a.id);
    await softDeleteProject(db, b.id);
    await renderApp('/da-xoa');
    await text('Dự án A');
    expect(screen.getAllByText('Còn 30 ngày').length).toBe(2);
    await fireEvent.press(screen.getByTestId(`restore-${a.id}`));
    await text('Đã khôi phục dự án “Dự án A”');
    await waitFor(() => expect(screen.queryByTestId(`trash-${a.id}`)).toBeNull());
    await fireEvent.press(screen.getByTestId(`purge-${b.id}`));
    await text('Xóa hẳn “Dự án B”?');
    await fireEvent.press(screen.getByTestId('dialog-confirm'));
    await text('Không có mục nào');
    expect(await getProject(db, b.id)).toBeNull();
    expect((await listProjects(db)).map((x) => x.name)).toEqual(['Dự án A']);
  });
});
