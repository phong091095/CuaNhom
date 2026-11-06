/**
 * Danh sách bộ cửa trong dự án (D1): chọn nhiều (nhân bản, xóa + Hoàn tác), sắp xếp bằng nút ↑ ↓.
 */
import { act, fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { BackHandler } from 'react-native';
import { createDoor, listDoors } from '@/db/repos/doors';
import { createProject } from '@/db/repos/projects';
import type { SqlDb } from '@/db/sql';
import { renderApp, setupDb } from './harness';

jest.setTimeout(30_000);

let db: SqlDb;
let pid: string;
beforeEach(async () => {
  db = await setupDb();
  pid = (await createProject(db, { name: 'Nhà chị Hạnh' })).id;
  for (const [symbol, qty] of [
    ['D1', 1],
    ['D2', 2],
    ['D3', 3],
  ] as const) {
    await createDoor(db, pid, { symbol, templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W: 800, H: 2200, qty });
  }
});

const text = (s: string | RegExp) => screen.findByText(s, {}, { timeout: 4000 });
const symbols = async () => (await listDoors(db, pid)).map((d) => d.symbol);

describe('D1 – chọn nhiều, sắp xếp', () => {
  it('chọn 2 bộ → Xóa (2) → xác nhận → Hoàn tác thì hiện lại đủ', async () => {
    await renderApp(`/du-an/${pid}`);
    await fireEvent.press(await screen.findByTestId('doors-select'));
    await text('Chưa chọn bộ cửa nào');
    await fireEvent.press(screen.getByTestId('door-row-D1'));
    await fireEvent.press(screen.getByTestId('door-row-D3'));
    await text('Đã chọn 2 bộ cửa (4 bộ)');
    expect(screen.getByTestId('door-row-D1').props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(screen.getByTestId('select-delete'));
    await text('Xóa 2 bộ cửa?');
    await text('D1, D3 (4 bộ) sẽ được chuyển vào Đã xóa gần đây và tự xóa hẳn sau 30 ngày.');
    await fireEvent.press(screen.getByTestId('dialog-confirm'));
    await text('Đã xóa 2 bộ cửa');
    await waitFor(() => expect(screen.queryByTestId('door-row-D1')).toBeNull());
    expect(screen.getByTestId('door-row-D2')).toBeTruthy();
    expect(screen.getByTestId('add-door')).toBeTruthy();
    expect(await symbols()).toEqual(['D2']);
    await fireEvent.press(screen.getByText('Hoàn tác'));
    await screen.findByTestId('door-row-D1', {}, { timeout: 4000 });
    expect(await symbols()).toEqual(['D1', 'D2', 'D3']);
  });

  it('nhấn giữ một dòng thì vào chế độ chọn với dòng đó; bỏ chọn thì nút tắt; Xong thoát', async () => {
    await renderApp(`/du-an/${pid}`);
    await fireEvent(await screen.findByTestId('door-row-D2'), 'longPress');
    await text('Đã chọn 1 bộ cửa (2 bộ)');
    await fireEvent.press(screen.getByTestId('door-row-D2'));
    await text('Chưa chọn bộ cửa nào');
    expect(screen.getByTestId('select-delete').props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(screen.getByTestId('select-done'));
    await screen.findByTestId('add-door');
  });

  it('nhân bản bộ đã chọn: bản sao đặt ngay sau bộ gốc', async () => {
    await renderApp(`/du-an/${pid}`);
    await fireEvent.press(await screen.findByTestId('doors-select'));
    await fireEvent.press(screen.getByTestId('door-row-D1'));
    await fireEvent.press(screen.getByTestId('door-row-D3'));
    await fireEvent.press(screen.getByTestId('select-duplicate'));
    await text('Đã nhân bản thành D4, D5');
    expect(await symbols()).toEqual(['D1', 'D4', 'D2', 'D3', 'D5']);
  });

  it('sắp xếp bằng nút lên/xuống; nút ở đầu/cuối bị tắt', async () => {
    await renderApp(`/du-an/${pid}`);
    await fireEvent.press(await screen.findByTestId('doors-sort'));
    expect(screen.getByTestId('move-up-D1').props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId('move-down-D3').props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByLabelText('Đưa D1 xuống')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('move-down-D1'));
    await waitFor(async () => expect(await symbols()).toEqual(['D2', 'D1', 'D3']));
    await fireEvent.press(await screen.findByTestId('move-up-D3'));
    await waitFor(async () => expect(await symbols()).toEqual(['D2', 'D3', 'D1']));
    await fireEvent.press(screen.getByTestId('sort-done'));
    await screen.findByTestId('add-door');
  });

  it('nút lùi Android khi đang chọn: thoát chế độ chọn, không rời màn', async () => {
    type Handler = Parameters<typeof BackHandler.addEventListener>[1];
    const handlers: Handler[] = [];
    const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, h) => {
      handlers.push(h);
      return { remove: () => handlers.splice(handlers.indexOf(h), 1) };
    });
    const r = await renderApp(`/du-an/${pid}`);
    await screen.findByTestId('doors-select');
    // Bộ định tuyến cũng đăng ký nút lùi; chỉ đếm phần màn này thêm vào.
    const before = handlers.length;
    await fireEvent.press(screen.getByTestId('doors-select'));
    await fireEvent.press(screen.getByTestId('door-row-D1'));
    await waitFor(() => expect(handlers.length).toBe(before + 1));
    let handled: boolean | null | undefined;
    await act(async () => {
      handled = (handlers[handlers.length - 1] as () => boolean | null | undefined)();
    });
    expect(handled).toBe(true);
    await screen.findByTestId('add-door');
    expect(r.getPathname()).toBe(`/du-an/${pid}`);
    expect(handlers).toHaveLength(before);
    spy.mockRestore();
  });
});
