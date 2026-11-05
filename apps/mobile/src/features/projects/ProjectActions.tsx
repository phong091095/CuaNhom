/**
 * Sheet thao tác dự án (B4) và hộp xác nhận xóa (B7), dùng chung cho danh sách và chi tiết.
 * Xóa = chuyển vào "Đã xóa gần đây" 30 ngày, kèm snackbar Hoàn tác 10 giây.
 */
import { formatMoney, keepTogether } from '@matadoor/engine';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import { getDb } from '@/db/client';
import { duplicateProject, restoreProject, softDeleteProject } from '@/db/repos/projects';
import type { Project } from '@/domain/types';
import { BottomSheet, Dialog, ListRow, useSnackbar } from '@/ui';

export interface ProjectActionsTarget {
  project: Pick<Project, 'id' | 'name' | 'customer' | 'address' | 'phone'>;
  doorCount: number;
  setCount: number;
  op1?: number;
}

export function ProjectActions({
  target,
  onClose,
  onChanged,
  afterDelete,
}: {
  target: ProjectActionsTarget | null;
  onClose: () => void;
  /** Gọi sau khi dữ liệu đổi (xóa, hoàn tác, nhân bản) để màn tải lại. */
  onChanged: () => void;
  /** Đang ở chi tiết dự án: sau khi xóa thì về danh sách. */
  afterDelete?: () => void;
}) {
  const snack = useSnackbar();
  const [confirming, setConfirming] = useState<ProjectActionsTarget | null>(null);
  const p = target?.project;
  const sub = p ? [p.customer, p.address, p.phone ? keepTogether(p.phone) : ''].filter(Boolean).join(' · ') : '';

  const remove = async (t: ProjectActionsTarget) => {
    const db = await getDb();
    await softDeleteProject(db, t.project.id);
    setConfirming(null);
    onChanged();
    afterDelete?.();
    snack.show(`Đã xóa dự án “${t.project.name}”`, {
      onUndo: async () => {
        await restoreProject(await getDb(), t.project.id);
        onChanged();
      },
    });
  };

  const duplicate = async (t: ProjectActionsTarget) => {
    onClose();
    const copy = await duplicateProject(await getDb(), t.project.id);
    onChanged();
    snack.show(`Đã nhân bản thành “${copy.name}”`, { tone: 'success' });
    router.push(`/du-an/${copy.id}`);
  };

  return (
    <>
      <BottomSheet visible={!!target} onClose={onClose} title={p?.name ?? ''}>
        {sub ? <ListRow title={sub} /> : null}
        <ListRow
          icon="edit"
          title="Chỉnh sửa dự án"
          testID="action-edit"
          onPress={() => {
            onClose();
            if (p) router.push(`/du-an/${p.id}/sua`);
          }}
        />
        <ListRow icon="copy" title="Nhân bản dự án" subtitle="Chép các bộ cửa, không chép báo giá đã xuất" testID="action-duplicate" onPress={() => target && duplicate(target)} />
        <ListRow
          icon="trash"
          title="Xóa dự án"
          testID="action-delete"
          onPress={() => {
            const t = target;
            onClose();
            // iOS không mở được hộp thoại khi sheet đang đóng dở: chờ sheet đóng xong.
            setTimeout(() => setConfirming(t), Platform.OS === 'ios' ? 350 : 0);
          }}
        />
      </BottomSheet>
      <Dialog
        visible={!!confirming}
        title={confirming ? `Xóa dự án “${confirming.project.name}”?` : ''}
        message={confirming ? deleteMessage(confirming) : ''}
        confirmLabel="Xóa dự án"
        destructive
        onConfirm={() => confirming && remove(confirming)}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}

export function deleteMessage(t: ProjectActionsTarget): string {
  const doors = t.doorCount === 0 ? 'Dự án chưa có bộ cửa nào.' : `Dự án có ${t.doorCount} loại cửa (${t.setCount} bộ)${t.op1 ? `, báo giá ${formatMoney(t.op1)}` : ''}.`;
  return `${doors} Dự án sẽ được chuyển vào Đã xóa gần đây và tự xóa hẳn sau 30 ngày.`;
}
