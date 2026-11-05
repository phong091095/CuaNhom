/**
 * Thư viện (C2). GĐ 3: đọc bảng vật tư gói kèm qua @matadoor/data để kiểm nối workspace.
 * Bảng giá theo nhóm, sửa giá, hệ số nhóm, tìm kiếm làm ở GĐ 10.
 */
import { MATERIAL_GROUP_LABELS, MATERIAL_GROUPS, TEMPLATE_GROUP_LABELS, type MaterialGroup } from '@matadoor/engine';
import { MATERIALS, SYSTEMS, visibleTemplates } from '@matadoor/data';
import { Body, Card, ListRow, Screen, ScreenTitle, SectionTitle } from '@/ui';
import type { IconName } from '@/ui';

const GROUP_ICON: Record<MaterialGroup, IconName> = { nhom: 'alu', kinh: 'glass', phukien: 'acc', nhancong: 'user' };

export default function LibraryScreen() {
  const templates = visibleTemplates(__DEV__);
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
              subtitle={`${MATERIALS.filter((m) => m.group === g).length} mục`}
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
