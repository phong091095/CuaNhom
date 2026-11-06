/**
 * Chi tiết bộ cửa (D6) và thông số hệ (D4) trên router thật, DB trong bộ nhớ.
 */
import { formatMoney, NBSP, unitPriceForQuote } from '@matadoor/engine';
import { fireEvent, screen, waitFor, within } from 'expo-router/testing-library';
import { createDoor, listDoors } from '@/db/repos/doors';
import { createProject } from '@/db/repos/projects';
import { getSetting, setSetting, SETTING_KEYS } from '@/db/repos/settings';
import type { SqlDb } from '@/db/sql';
import { computeSingleDoor } from '@/domain/projectCalc';
import { renderApp, setupDb } from './harness';

jest.setTimeout(30_000);

let db: SqlDb;
let pid: string;
beforeEach(async () => {
  db = await setupDb();
  pid = (await createProject(db, { name: 'Nhà chị Hạnh' })).id;
});

const text = (s: string | RegExp) => screen.findByText(s, {}, { timeout: 4000 });
const nb = (s: string) => s.replaceAll(' ', NBSP);
const D1 = { symbol: 'D1', templateId: 'xf55-cua-di-1-canh', templateVersion: 1, W: 800, H: 2200, qty: 1 };

describe('D6 – chi tiết bộ cửa', () => {
  it('TC-01 qua giao diện: thẻ tổng, cắt nhôm, kính đúng đáp án SRS', async () => {
    const d = await createDoor(db, pid, { ...D1, params: { huongMo: 1 }, color: 'Trắng sữa', location: 'Tầng 1' });
    const unit = unitPriceForQuote((await computeSingleDoor(db, d.id)).result);
    await renderApp(`/du-an/${pid}/cua/${d.id}`);
    await text('D1 · Cửa đi mở quay 1 cánh');
    expect(screen.getByTestId('door-detail-total')).toHaveTextContent(formatMoney(unit));
    await text('Thành tiền (1 bộ)');
    expect(screen.getByText('Mở vào trong')).toBeTruthy();
    expect(within(screen.getByTestId('door-unit-price')).getByText(formatMoney(unit))).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-nhom'));
    const ngang = within(await screen.findByTestId('profile-canh_ngang'));
    expect(ngang.getByText(nb('718 mm'))).toBeTruthy();
    expect(ngang.getByText('Cắt 45°/45° · 2 thanh · Trên, dưới')).toBeTruthy();
    expect(within(screen.getByTestId('profile-canh_dung')).getByText(nb('2149 mm'))).toBeTruthy();
    expect(within(screen.getByTestId('profile-nep_dung')).getByText(nb('2012,6 mm'))).toBeTruthy();
    expect(screen.getByText(/^XF-C3328 · Khung bao/)).toBeTruthy();
    expect(screen.getByText(nb('520.000 đ/cây · cây 5800 mm · 1,95 kg/m'))).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-kinh'));
    expect(within(await screen.findByTestId('glass-kinh')).getByText(nb('574 × 2007,6 mm'))).toBeTruthy();

    await fireEvent.press(screen.getByTestId('tab-phukien'));
    expect(within(await screen.findByTestId('acc-PK-SILICONE')).getByText(/chai/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-nhancong'));
    await text('Nhân công 1 bộ');
  });

  it('nhân bản từ menu Thao tác', async () => {
    const d = await createDoor(db, pid, D1);
    await renderApp(`/du-an/${pid}/cua/${d.id}`);
    await fireEvent.press(await screen.findByTestId('door-actions'));
    await text('Tạo D2 giống D1');
    await fireEvent.press(screen.getByTestId('action-duplicate'));
    await text('Đã nhân bản D1 thành D2');
    expect((await listDoors(db, pid)).map((x) => x.symbol)).toEqual(['D1', 'D2']);
  });

  it('xóa từ B3 → D6: hỏi xác nhận, về dự án, Hoàn tác thì bộ cửa hiện lại', async () => {
    await createDoor(db, pid, D1);
    const r = await renderApp(`/du-an/${pid}`);
    await fireEvent.press(await screen.findByTestId('door-row-D1'));
    await fireEvent.press(await screen.findByTestId('door-actions'));
    await fireEvent.press(await screen.findByTestId('action-delete'));
    await text('Xóa bộ cửa D1?');
    await text(/sẽ được chuyển vào Đã xóa gần đây và tự xóa hẳn sau 30 ngày/);
    await fireEvent.press(screen.getByTestId('dialog-confirm'));
    await waitFor(() => expect(r.getPathname()).toBe(`/du-an/${pid}`));
    await text('Đã xóa bộ cửa D1');
    await text('Chưa có bộ cửa nào');
    await fireEvent.press(screen.getByText('Hoàn tác'));
    await screen.findByTestId('door-row-D1', {}, { timeout: 4000 });
    expect(await listDoors(db, pid)).toHaveLength(1);
  });

  it('Thêm cửa tiếp → cửa cùng loại: giữ tham số, màu, vị trí; W/H trống; ký hiệu kế tiếp; nhớ lựa chọn', async () => {
    const d = await createDoor(db, pid, { ...D1, params: { huongMo: 1, kheHoChan: 8 }, color: 'Nâu cà phê', location: 'Tầng 2', note: 'riêng D1' });
    const r = await renderApp(`/du-an/${pid}/cua/${d.id}`);
    await fireEvent.press(await screen.findByTestId('add-next'));
    await text('Lựa chọn được ghi nhớ cho lần sau.');
    expect(screen.getByTestId('choice-same').props.accessibilityState).toMatchObject({ checked: true });
    await fireEvent.press(screen.getByTestId('add-next-continue'));
    await waitFor(() => expect(r.getPathname()).toBe(`/du-an/${pid}/cua/moi`));
    await waitFor(() => expect(screen.getByTestId('field-symbol').props.value).toBe('D2'));
    expect(screen.getByTestId('field-W').props.value).toBe('');
    expect(screen.getByTestId('field-location').props.value).toBe('Tầng 2');
    expect(screen.getByTestId('field-note').props.value).toBe('');
    expect(screen.getByTestId('field-kheHoChan').props.value).toBe('8');
    expect(screen.getByText('Nâu cà phê')).toBeTruthy();
    expect(await getSetting(db, SETTING_KEYS.afterSaveChoice)).toBe('same');
  });

  it('Thêm cửa tiếp: chọn sẵn lựa chọn lần trước (có nhãn "Lần trước"); cửa khác loại → chọn mẫu', async () => {
    const d = await createDoor(db, pid, D1);
    await setSetting(db, SETTING_KEYS.afterSaveChoice, 'other');
    const r = await renderApp(`/du-an/${pid}/cua/${d.id}`);
    await fireEvent.press(await screen.findByTestId('add-next'));
    const other = await screen.findByTestId('choice-other');
    expect(other.props.accessibilityState).toMatchObject({ checked: true });
    expect(within(other).getByText('Lần trước')).toBeTruthy();
    expect(within(screen.getByTestId('choice-same')).queryByText('Lần trước')).toBeNull();
    await fireEvent.press(screen.getByTestId('add-next-continue'));
    await waitFor(() => expect(r.getPathname()).toBe(`/du-an/${pid}/them-cua`));
    expect(await getSetting(db, SETTING_KEYS.afterSaveChoice)).toBe('other');
  });

  it('D4 thông số hệ từ D6: hằng số, công thức đọc thành chữ, giới hạn', async () => {
    const d = await createDoor(db, pid, D1);
    const r = await renderApp(`/du-an/${pid}/cua/${d.id}`);
    await fireEvent.press(await screen.findByTestId('open-template-spec'));
    await waitFor(() => expect(r.getPathname()).toBe('/mau/xf55-cua-di-1-canh'));
    await text('Đã khớp đáp án mẫu trong đặc tả');
    expect(within(screen.getByTestId('spec-constants')).getByText('Khung bao chiếm mỗi cạnh (mm)')).toBeTruthy();
    expect(screen.getByText('nếu Cao > 2400 thì 4, không thì 3')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-nhom'));
    expect(within(await screen.findByTestId('spec-profile-canh_ngang')).getByText('Dài = Rộng − 36 × 2 − 5 × 2')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-kinh'));
    expect(within(await screen.findByTestId('spec-glass-kinh')).getByText('Rộng kính = Nẹp kính ngang + 15 × 2')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('tab-gioihan'));
    expect(within(await screen.findByTestId('spec-check-rong')).getByText('Khi Rộng < 600 hoặc Rộng > 1200')).toBeTruthy();
    expect(within(screen.getByTestId('spec-check-rong')).getByText('Lỗi – không cho lưu')).toBeTruthy();
    expect(within(screen.getByTestId('spec-check-kinhNang')).getByText(/Tấm kính nặng khoảng … kg/)).toBeTruthy();
  });

  it('D5 lưu xong chọn "Xem bộ cửa vừa lưu" → chi tiết cửa', async () => {
    const r = await renderApp(`/du-an/${pid}`);
    await fireEvent.press(await screen.findByTestId('add-door'));
    await fireEvent.press(await screen.findByTestId('template-xf55-cua-di-1-canh'));
    await screen.findByTestId('save-door');
    await fireEvent.changeText(screen.getByTestId('field-W'), '800');
    await fireEvent.changeText(screen.getByTestId('field-H'), '2200');
    await fireEvent.press(screen.getByTestId('save-door'));
    await fireEvent.press(await screen.findByTestId('after-view'));
    const [door] = await listDoors(db, pid);
    await waitFor(() => expect(r.getPathname()).toBe(`/du-an/${pid}/cua/${door!.id}`));
    await text('D1 · Cửa đi mở quay 1 cánh');
  });

  it('bộ cửa không còn: báo lỗi, không vỡ màn', async () => {
    await renderApp(`/du-an/${pid}/cua/khong-co`);
    await text('Không mở được bộ cửa');
  });
});
