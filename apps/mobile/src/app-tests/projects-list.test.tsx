/**
 * Mỗi nhóm màn một file: expo-router giữ trạng thái chặn rời màn (usePreventRemove) ở singleton,
 * nên ca "rời form" để cuối file riêng để không ảnh hưởng ca khác.
 */
import { formatMoney } from '@matadoor/engine';
import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { createProject, listProjects } from '@/db/repos/projects';
import type { SqlDb } from '@/db/sql';
import { computeProject } from '@/domain/projectCalc';
import { createSampleProject } from '@/domain/sampleProject';
import { renderApp, setupDb } from './harness';

jest.setTimeout(30_000);

let db: SqlDb;
beforeEach(async () => {
  db = await setupDb();
});

const text = (s: string | RegExp) => screen.findByText(s, {}, { timeout: 4000 });

describe('B1 – danh sách dự án', () => {
  it('rỗng: có lời mời tạo dự án đầu tiên', async () => {
    await renderApp('/');
    await text('Chưa có dự án nào');
    expect(screen.getByText('Tạo dự án đầu tiên')).toBeTruthy();
  });

  it('thẻ dự án có số loại · số bộ và báo giá OP1 tính bằng engine', async () => {
    const p = await createSampleProject(db);
    const expected = (await computeProject(db, p.id)).summary.op1;
    await renderApp('/');
    await text('Dự án mẫu – Nhà anh Đoài');
    await text('4 loại · 6 bộ');
    await text(formatMoney(expected));
    expect(screen.getByText('1 dự án')).toBeTruthy();
  });

  it('tìm không phân biệt dấu; không thấy thì báo', async () => {
    await createProject(db, { name: 'Nhà chị Hạnh', customer: 'Chị Hạnh' });
    await createProject(db, { name: 'Văn phòng anh Tuấn' });
    await renderApp('/');
    await text('Nhà chị Hạnh');
    await fireEvent.changeText(screen.getByTestId('project-search'), 'chi hanh');
    await waitFor(() => expect(screen.queryByText('Văn phòng anh Tuấn')).toBeNull());
    expect(screen.getByText('Nhà chị Hạnh')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('project-search'), 'xyz');
    await text('Không tìm thấy dự án');
  });

  it('xóa từ "⋯" → hộp xác nhận gọi tên dự án → snackbar Hoàn tác khôi phục lại', async () => {
    const p = await createProject(db, { name: 'Anh Đoài' });
    await renderApp('/');
    await text('Anh Đoài');
    await fireEvent.press(screen.getByTestId(`project-more-${p.id}`));
    await fireEvent.press(await screen.findByTestId('action-delete'));
    await text('Xóa dự án “Anh Đoài”?');
    expect(screen.getByText(/chưa có bộ cửa nào.*30 ngày/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('dialog-confirm'));
    await text('Đã xóa dự án “Anh Đoài”');
    await text('Chưa có dự án nào');
    expect(await listProjects(db)).toEqual([]);
    await fireEvent.press(screen.getByText('Hoàn tác'));
    await waitFor(async () => expect((await listProjects(db)).length).toBe(1));
    await text('Anh Đoài');
  });
});

