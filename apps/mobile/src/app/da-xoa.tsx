/**
 * Đã xóa gần đây (C1b): dự án và bộ cửa đã xóa giữ 30 ngày rồi tự xóa hẳn (Q2).
 * Khôi phục; xóa hẳn có hộp xác nhận gọi tên đối tượng.
 * Màu cảnh báo chỉ dùng khi còn dưới 7 ngày (quy tắc thiết kế).
 */
import { formatDate } from '@matadoor/engine';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { getDb } from '@/db/client';
import { restoreDoor } from '@/db/repos/doors';
import { hardDeleteProject, restoreProject } from '@/db/repos/projects';
import { daysLeft, hardDeleteDoor, listTrash } from '@/db/repos/trash';
import type { TrashItem } from '@/domain/types';
import { Badge, Body, Button, Card, Dialog, EmptyState, Header, Icon, Screen, SkeletonCard, Txt, useSnackbar } from '@/ui';
import { useColors } from '@/theme/ThemeProvider';

export default function TrashScreen() {
  const c = useColors();
  const snack = useSnackbar();
  const [items, setItems] = useState<TrashItem[] | null>(null);
  const [confirm, setConfirm] = useState<TrashItem | null>(null);

  const load = useCallback(async () => {
    setItems(await listTrash(await getDb()));
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const restore = async (it: TrashItem) => {
    const db = await getDb();
    if (it.kind === 'project') {
      await restoreProject(db, it.id);
      snack.show(`Đã khôi phục dự án “${it.title}”`, { tone: 'success' });
    } else {
      const r = await restoreDoor(db, it.id);
      snack.show(r.renamed ? `Đã khôi phục, ký hiệu cũ đã có nên đổi thành ${r.symbol}` : `Đã khôi phục bộ cửa ${r.symbol}`, { tone: 'success' });
    }
    await load();
  };

  const purge = async (it: TrashItem) => {
    const db = await getDb();
    if (it.kind === 'project') await hardDeleteProject(db, it.id);
    else await hardDeleteDoor(db, it.id);
    setConfirm(null);
    snack.show(`Đã xóa hẳn “${it.title}”`);
    await load();
  };

  return (
    <Screen>
      <Header title="Đã xóa gần đây" />
      <Body>
        <Txt color="text2">Dự án và bộ cửa đã xóa được giữ ở đây 30 ngày rồi tự xóa hẳn.</Txt>
        {items === null ? (
          <SkeletonCard />
        ) : items.length === 0 ? (
          <EmptyState icon="trash" title="Không có mục nào" message="Khi bạn xóa dự án hoặc bộ cửa, chúng sẽ nằm ở đây 30 ngày và khôi phục được." />
        ) : (
          items.map((it) => {
            const left = daysLeft(it);
            const urgent = left < 7;
            return (
              <Card key={`${it.kind}-${it.id}`} testID={`trash-${it.id}`}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <Icon name={it.kind === 'project' ? 'projects' : 'door'} color={c.text2} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt variant="bodyStrong">{it.title}</Txt>
                    <Txt variant="caption" color="text2">
                      {it.kind === 'project' ? 'Dự án' : 'Bộ cửa'} · xóa ngày {formatDate(it.deletedAt)}
                    </Txt>
                    {urgent ? (
                      <Badge tone="warning" icon="clock" label={left === 0 ? 'Xóa hẳn trong hôm nay' : `Còn ${left} ngày`} />
                    ) : (
                      <Txt variant="caption" color="text2">
                        Còn {left} ngày
                      </Txt>
                    )}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                  <Button kind="dangerGhost" compact label="Xóa hẳn" onPress={() => setConfirm(it)} testID={`purge-${it.id}`} />
                  <Button kind="secondary" compact icon="restore" label="Khôi phục" onPress={() => restore(it)} testID={`restore-${it.id}`} />
                </View>
              </Card>
            );
          })
        )}
      </Body>
      <Dialog
        visible={!!confirm}
        title={confirm ? `Xóa hẳn “${confirm.title}”?` : ''}
        message={
          confirm?.kind === 'project'
            ? 'Dự án, các bộ cửa và báo giá đã xuất của nó sẽ bị xóa vĩnh viễn, không khôi phục được.'
            : 'Bộ cửa sẽ bị xóa vĩnh viễn, không khôi phục được.'
        }
        confirmLabel="Xóa hẳn"
        destructive
        onConfirm={() => confirm && purge(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  );
}
