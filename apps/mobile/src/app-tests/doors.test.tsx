/**
 * Luồng nhập bộ cửa (B3 → D3 → D5) trên router thật, DB trong bộ nhớ. Ca chặn rời màn để cuối file.
 */
import { NBSP } from '@matadoor/engine';
import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { createDoor, listDoors } from '@/db/repos/doors';
import { saveDraft } from '@/db/repos/drafts';
import { listEvents } from '@/db/repos/events';
import { createProject } from '@/db/repos/projects';
import type { SqlDb } from '@/db/sql';
import { renderApp, setupDb } from './harness';

jest.setTimeout(30_000);

let db: SqlDb;
let pid: string;
beforeEach(async () => {
  db = await setupDb();
  pid = (await createProject(db, { name: 'Nhà chị Hạnh' })).id;
});

const text = (s: string | RegExp) => screen.findByText(s, {}, { timeout: 4000 });
const typeIn = async (testID: string, v: string) => {
  await fireEvent.changeText(screen.getByTestId(testID), v);
};

async function openNewDoor(templateTestId = 'template-xf55-cua-di-1-canh') {
  const r = await renderApp(`/du-an/${pid}`);
  await fireEvent.press(await screen.findByTestId('add-door'));
  await fireEvent.press(await screen.findByTestId(templateTestId));
  await screen.findByTestId('save-door');
  return r;
}

describe('D3 – chọn mẫu cửa', () => {
  it('có đủ mẫu; chip lọc chỉ có nhóm đang có mẫu, kèm số mẫu', async () => {
    await renderApp(`/du-an/${pid}`);
    await fireEvent.press(await screen.findByTestId('add-door'));
    await text('Chọn mẫu cửa');
    expect(screen.getByText('Tất cả (2)')).toBeTruthy();
    expect(screen.getByText('Cửa đi (1)')).toBeTruthy();
    expect(screen.getByText('Cửa sổ (1)')).toBeTruthy();
    expect(screen.queryByText(/^Vách/)).toBeNull();
    await fireEvent.press(screen.getByTestId('filter-cua-so'));
    await waitFor(() => expect(screen.queryByTestId('template-xf55-cua-di-1-canh')).toBeNull());
    expect(screen.getByTestId('template-xf55-cua-so-lua')).toBeTruthy();
    expect((await listEvents(db)).map((e) => e.type)).toContain('door_started');
  });
});

describe('D5 – nhập bộ cửa', () => {
  it('TC-05 qua giao diện: rộng 1500 → lỗi dưới ô W, khóa Lưu; TC-06: 900 × 2600 → 4 bản lề; lưu → về dự án', async () => {
    const r = await openNewDoor();
    expect(screen.getByTestId('field-symbol').props.value).toBe('D1');
    await typeIn('field-W', '1500');
    await typeIn('field-H', '2200');
    await text(/Rộng cửa đi 1 cánh nên trong khoảng 600–1200/);
    expect(screen.getByText('Còn 1 ô cần sửa')).toBeTruthy();
    expect(screen.getByTestId('save-door')).toBeDisabled();
    await typeIn('field-W', '900');
    await typeIn('field-H', '2600');
    await text(`Cửa cao trên 2400${NBSP}mm nên dùng 4 bản lề (đã tính 4 bản lề)`);
    expect(screen.getByTestId('save-door')).toBeEnabled();
    expect(screen.getByTestId('door-total').props.children).toMatch(/đ$/);
    await fireEvent.press(screen.getByTestId('save-door'));
    await text('Đã lưu bộ cửa D1');
    await fireEvent.press(screen.getByTestId('after-done'));
    await waitFor(() => expect(r.getPathname()).toBe(`/du-an/${pid}`));
    await screen.findByTestId('door-row-D1');
    const doors = await listDoors(db, pid);
    expect(doors).toEqual([expect.objectContaining({ symbol: 'D1', W: 900, H: 2600, qty: 1, templateId: 'xf55-cua-di-1-canh', templateVersion: 1 })]);
    const saved = (await listEvents(db)).find((e) => e.type === 'door_saved');
    expect(saved).toMatchObject({ projectId: pid, doorId: doors[0]!.id });
    expect(typeof saved!.value).toBe('number');
  });

  it('W/H trống: bấm Lưu thì báo lỗi dưới ô, không lưu', async () => {
    await openNewDoor();
    await fireEvent.press(screen.getByTestId('save-door'));
    await text('Nhập chiều rộng W (mm), ví dụ 800');
    expect(screen.getByText('Nhập chiều cao H (mm), ví dụ 2200')).toBeTruthy();
    expect(await listDoors(db, pid)).toEqual([]);
  });

  it('ký hiệu trùng trong dự án bị chặn', async () => {
    await createDoor(db, pid, { symbol: 'D1', templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W: 800, H: 2200, qty: 1 });
    await openNewDoor();
    expect(screen.getByTestId('field-symbol').props.value).toBe('D2');
    await typeIn('field-symbol', 'd1');
    await text('Ký hiệu “d1” đã có trong dự án');
    expect(screen.getByTestId('save-door')).toBeDisabled();
  });

  it('cửa lùa: đổi số cánh, kính tính lại ngay (FR-DOR-03, 04; TC-02)', async () => {
    await openNewDoor('template-xf55-cua-so-lua');
    expect(screen.getByTestId('field-symbol').props.value).toBe('S1');
    await typeIn('field-W', '2500');
    await typeIn('field-H', '1350');
    // 2 cánh: cánh ngang (2500 − 78 + 39) / 2 = 1230,5 → kính 1130,5 × 1172; 1,325 m² × 5 ly × 2,5 = 16,56 kg
    await text(`1130,5${NBSP}×${NBSP}1172${NBSP}mm · 2 tấm/bộ · 16,56${NBSP}kg/tấm`);
    await fireEvent.press(screen.getByText('4 cánh'));
    // 4 cánh (TC-02): kính 525 × 1172 × 4 tấm
    await text(`525${NBSP}×${NBSP}1172${NBSP}mm · 4 tấm/bộ · 7,69${NBSP}kg/tấm`);
  });

  it('lưu xong chọn "Thêm cửa cùng loại": giữ mẫu, màu; ký hiệu kế tiếp; W/H trống', async () => {
    await openNewDoor();
    await fireEvent.press(screen.getByTestId('field-color'));
    await fireEvent.press(await screen.findByTestId('color-Nâu cà phê'));
    await typeIn('field-W', '800');
    await typeIn('field-H', '2200');
    await fireEvent.press(screen.getByTestId('save-door'));
    await fireEvent.press(await screen.findByTestId('after-same'));
    await waitFor(() => expect(screen.getByTestId('field-symbol').props.value).toBe('D2'));
    expect(screen.getByTestId('field-W').props.value).toBe('');
    expect(screen.getByText('Nâu cà phê')).toBeTruthy();
    expect((await listDoors(db, pid)).map((d) => [d.symbol, d.color])).toEqual([['D1', 'Nâu cà phê']]);
  });

  it('mẫu vừa dùng có nhãn "Lần trước" ở D3', async () => {
    await openNewDoor();
    await typeIn('field-W', '800');
    await typeIn('field-H', '2200');
    await fireEvent.press(screen.getByTestId('save-door'));
    await fireEvent.press(await screen.findByTestId('after-other'));
    await text('Chọn mẫu cửa');
    await text('Lần trước');
  });

  it('sửa bộ cửa từ dòng ở B3: mở đúng số đã lưu, lưu xong về dự án', async () => {
    await createDoor(db, pid, { symbol: 'D1', templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W: 800, H: 2200, qty: 1, location: 'Tầng 1' });
    const r = await renderApp(`/du-an/${pid}`);
    await fireEvent.press(await screen.findByTestId('door-row-D1'));
    await waitFor(() => expect(screen.getByTestId('field-W').props.value).toBe('800'));
    expect(screen.getByTestId('field-location').props.value).toBe('Tầng 1');
    await fireEvent.press(screen.getByLabelText('Tăng số bộ'));
    await typeIn('field-H', '2100,5');
    await fireEvent.press(screen.getByTestId('save-door'));
    await waitFor(() => expect(r.getPathname()).toBe(`/du-an/${pid}`));
    expect((await listDoors(db, pid))[0]).toMatchObject({ qty: 2, H: 2100.5 });
  });

  it('còn nháp từ lần trước thì mở form điền lại', async () => {
    await saveDraft(db, `door:new:${pid}:xf55-cua-di-1-canh`, {
      symbol: 'D1', W: '850', H: '2250', qty: 2, params: { kheHoChan: '10', huongMo: '0', benBanLe: '0' }, glass: { kinh: 'KINH-TRANG-8' }, color: null, location: '', note: '',
    });
    await openNewDoor();
    await text('Đã mở lại phần đang nhập dở');
    expect(screen.getByTestId('field-W').props.value).toBe('850');
  });

  it('rời form khi chưa lưu thì hỏi "Bỏ thay đổi?"', async () => {
    await openNewDoor();
    await typeIn('field-W', '800');
    await fireEvent.press(screen.getByTestId('header-back'));
    await text('Bỏ thay đổi?');
  });
});
