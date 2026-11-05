/**
 * Mỗi nhóm màn một file: expo-router giữ trạng thái chặn rời màn (usePreventRemove) ở singleton,
 * nên ca "rời form" để cuối file riêng để không ảnh hưởng ca khác.
 */
import { formatMoney } from '@matadoor/engine';
import { fireEvent, screen, waitFor } from 'expo-router/testing-library';
import { createProject, getProject } from '@/db/repos/projects';
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

describe('B3 – chi tiết dự án', () => {
  it('thẻ báo giá, khối bóc tách, danh sách bộ cửa theo thứ tự', async () => {
    const p = await createSampleProject(db);
    const c = await computeProject(db, p.id);
    await renderApp(`/du-an/${p.id}`);
    await waitFor(() => expect(screen.getByTestId('project-op1')).toHaveTextContent(formatMoney(c.summary.op1)));
    expect(screen.getByText('Bóc tách & báo giá')).toBeTruthy();
    expect(screen.getByText('Bộ cửa (4 loại · 6 bộ)')).toBeTruthy();
    for (const s of ['D1', 'S1', 'D2', 'S2']) expect(screen.getByTestId(`door-row-${s}`)).toBeTruthy();
    expect(screen.getByText(formatMoney(c.summary.cost.kinh))).toBeTruthy();
  });

  it('đổi trạng thái dự án (FR-PRJ-04)', async () => {
    const p = await createProject(db, { name: 'A' });
    await renderApp(`/du-an/${p.id}`);
    await fireEvent.press(await text('Báo giá · Đổi'));
    await fireEvent.press(await screen.findByTestId('status-dat_coc'));
    await text('Đã cọc · Đổi');
    expect((await getProject(db, p.id))!.status).toBe('dat_coc');
  });

  it('nhân bản: mở dự án bản sao', async () => {
    const p = await createSampleProject(db);
    const r = await renderApp(`/du-an/${p.id}`);
    await waitFor(() => expect(screen.getByTestId('project-name')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('project-actions'));
    await fireEvent.press(await screen.findByTestId('action-duplicate'));
    await waitFor(() => expect(r.getPathname()).not.toBe(`/du-an/${p.id}`));
    await waitFor(() => expect(screen.getByTestId('project-name')).toHaveTextContent('Dự án mẫu – Nhà anh Đoài (bản sao)'));
  });

  it('dự án không còn: báo lỗi có Thử lại', async () => {
    await renderApp('/du-an/khong-co');
    await text('Không mở được dự án');
  });
});

