/**
 * Thư viện (C2). GĐ 4: số vật tư đọc từ bảng giá của xưởng trong SQLite.
 * Bảng giá theo nhóm, sửa giá, hệ số nhóm, tìm kiếm làm ở GĐ 10.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { MATERIAL_GROUP_LABELS, MATERIAL_GROUPS, TEMPLATE_GROUP_LABELS, type MaterialGroup } from '@matadoor/engine';
import { SYSTEMS, visibleTemplates } from '@matadoor/data';
import { getDb } from '@/db/client';
import { listMaterials } from '@/db/repos/materials';
import type { MaterialRow } from '@/domain/types';
import { Body, Card, ListRow, Screen, ScreenTitle, SectionTitle } from '@/ui';
import type { IconName } from '@/ui';

const GROUP_ICON: Record<MaterialGroup, IconName> = { nhom: 'alu', kinh: 'glass', phukien: 'acc', nhancong: 'user' };

export default function LibraryScreen() {
  const templates = visibleTemplates(__DEV__);
  const [materials, setMaterials] = useState<MaterialRow[] | null>(null);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getDb()
        .then(listMaterials)
        .then((rows) => {
          if (alive) setMaterials(rows);
        })
        .catch(() => {
          if (alive) setMaterials([]);
        });
      return () => {
        alive = false;
      };
    }, []),
  );
  return (
    <Screen>
      <ScreenTitle title="Thư viện" aside={SYSTEMS.map((s) => s.name).join(', ')} />
      <Body>
        <SectionTitle>Bảng giá vật tư</SectionTitle>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {MATERIAL_GROUPS.map((g) => (
            <ListRow
              key={g}
              icon={GROUP_ICON[g]}
              title={MATERIAL_GROUP_LABELS[g]}
              subtitle={materials ? `${materials.filter((m) => m.group === g && !m.hidden).length} mục` : 'Đang đọc…'}
            />
          ))}
        </Card>
        <SectionTitle>Mẫu cửa</SectionTitle>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {templates.map((t) => (
            <ListRow key={t.id} icon="door" title={t.name} subtitle={TEMPLATE_GROUP_LABELS[t.group]} />
          ))}
        </Card>
      </Body>
    </Screen>
  );
}
