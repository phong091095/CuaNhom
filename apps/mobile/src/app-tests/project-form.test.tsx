/**
 * Mỗi nhóm màn một file: expo-router giữ trạng thái chặn rời màn (usePreventRemove) ở singleton,
 * nên ca "rời form" để cuối file riêng để không ảnh hưởng ca khác.
 */
import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { createProject, getProject, listProjects } from '@/db/repos/projects';
import { loadDraft, saveDraft } from '@/db/repos/drafts';
import type { SqlDb } from '@/db/sql';
import { renderApp, setupDb } from './harness';

jest.setTimeout(30_000);

let db: SqlDb;
beforeEach(async () => {
  db = await setupDb();
});

const text = (s: string | RegExp) => screen.findByText(s, {}, { timeout: 4000 });

describe('B2/B6 – tạo và sửa dự án', () => {
  it('tên công trình bắt buộc (lỗi dưới ô); SĐT sai chỉ nhắc; tạo xong mở chi tiết', async () => {
    const r = await renderApp('/du-an/moi');
    await screen.findByTestId('submit-project');
    await fireEvent.changeText(screen.getByTestId('field-phone'), '0923 45');
    await text(/Số điện thoại chưa đúng/);
    await fireEvent.press(screen.getByTestId('submit-project'));
    await text('Nhập tên công trình');
    await fireEvent.changeText(screen.getByTestId('field-name'), 'Nhà chị Hạnh');
    await waitFor(() => expect(screen.queryByText('Nhập tên công trình')).toBeNull());
    await fireEvent.press(screen.getByTestId('submit-project'));
    await waitFor(() => expect(r.getPathname()).toMatch(/^\/du-an\/[^/]+$/));
    await waitFor(() => expect(screen.getByTestId('project-name')).toHaveTextContent('Nhà chị Hạnh'));
    const list = await listProjects(db);
    expect(list.map((x) => [x.name, x.phone])).toEqual([['Nhà chị Hạnh', '0923 45']]);
  });

  it('nháp tự lưu sau khi gõ (NFR-REL-01)', async () => {
    await renderApp('/du-an/moi');
    await screen.findByTestId('submit-project');
    await fireEvent.changeText(screen.getByTestId('field-name'), 'Nhà đang nhập');
    await waitFor(async () => expect((await loadDraft<{ name: string }>(db, 'project:new'))?.value.name).toBe('Nhà đang nhập'), { timeout: 3000 });
  });

  it('còn nháp từ lần trước (app bị tắt ngang) thì mở form ra điền lại', async () => {
    await saveDraft(db, 'project:new', { name: 'Nhà đang nhập', customer: '', phone: '0909', address: '' });
    await renderApp('/du-an/moi');
    await text('Đã mở lại phần đang nhập dở');
    expect(screen.getByTestId('field-name').props.value).toBe('Nhà đang nhập');
    expect(screen.getByTestId('field-phone').props.value).toBe('0909');
  });


  it('sửa dự án: lưu xong quay về chi tiết với thông tin mới', async () => {
    const p = await createProject(db, { name: 'Anh Đoài', customer: 'Đoài' });
    const r = await renderApp(`/du-an/${p.id}`);
    await screen.findByTestId('project-actions');
    await fireEvent.press(screen.getByTestId('project-actions'));
    await fireEvent.press(await screen.findByTestId('action-edit'));
    await waitFor(() => expect(screen.getByTestId('field-customer').props.value).toBe('Đoài'));
    await fireEvent.changeText(screen.getByTestId('field-customer'), 'Anh Đoài Nguyễn');
    await fireEvent.press(screen.getByTestId('submit-project'));
    await waitFor(() => expect(r.getPathname()).toBe(`/du-an/${p.id}`));
    await text(/Anh Đoài Nguyễn/);
    expect((await getProject(db, p.id))!.customer).toBe('Anh Đoài Nguyễn');
  });

  it('rời form khi chưa lưu thì hỏi; "Tiếp tục sửa" ở lại; "Bỏ thay đổi" về danh sách và xóa nháp', async () => {
    const r = await renderApp('/');
    await fireEvent.press(await text('Tạo dự án đầu tiên'));
    await screen.findByTestId('submit-project');
    await fireEvent.changeText(screen.getByTestId('field-name'), 'Có thay đổi');
    await fireEvent.press(screen.getByTestId('header-back'));
    await text('Bỏ thay đổi?');
    await fireEvent.press(screen.getByTestId('dialog-cancel'));
    await waitFor(() => expect(screen.queryByText('Bỏ thay đổi?')).toBeNull());
    expect(screen.getByTestId('field-name').props.value).toBe('Có thay đổi');
    await fireEvent.press(screen.getByTestId('header-back'));
    await fireEvent.press(await screen.findByTestId('dialog-confirm'));
    await waitFor(() => expect(r.getPathname()).toBe('/'));
    await waitFor(async () => expect(await loadDraft(db, 'project:new')).toBeNull());
  });
});
