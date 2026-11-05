/**
 * Thẻ dự án ở danh sách (artboard B1): tên, khách, địa chỉ, SĐT, trạng thái, số loại · số bộ, báo giá.
 */
import { formatMoney, keepTogether } from '@matadoor/engine';
import { Pressable, StyleSheet, View } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import type { ProjectTotals } from '@/domain/projectCalc';
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABELS, type ProjectListItem } from '@/domain/types';
import { Badge, Icon, Txt } from '@/ui';

export function doorCountLabel(doorCount: number, setCount: number): string {
  return doorCount === 0 ? 'Chưa có cửa' : `${doorCount} loại · ${setCount} bộ`;
}

export function ProjectCard({
  project: p,
  totals,
  onPress,
  onMore,
}: {
  project: ProjectListItem;
  totals?: ProjectTotals;
  onPress: () => void;
  onMore: () => void;
}) {
  const c = useColors();
  const status = PROJECT_STATUS_BADGE[p.status];
  const empty = p.doorCount === 0;
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.divider }]}>
      <Pressable
        onPress={onPress}
        testID={`project-card-${p.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${p.name}${p.customer ? `, ${p.customer}` : ''}, ${doorCountLabel(p.doorCount, p.setCount)}${totals && !empty ? `, báo giá ${formatMoney(totals.op1)}` : ''}`}
        style={({ pressed }) => [styles.main, pressed && { backgroundColor: c.surface2 }]}
      >
        <View style={{ gap: 6 }}>
          <Txt variant="section" numberOfLines={2}>
            {p.name}
          </Txt>
          <Badge label={PROJECT_STATUS_LABELS[p.status]} icon={status.icon} tone={status.tone} />
          {p.customer ? (
            <Row icon="user" text={p.customer} />
          ) : null}
          {p.address ? <Row icon="pin" text={p.address} /> : null}
          {p.phone ? <Row icon="phone" text={keepTogether(p.phone)} tabular /> : null}
        </View>
        <View style={[styles.foot, { borderTopColor: c.divider }]}>
          <Badge label={doorCountLabel(p.doorCount, p.setCount)} icon="door" tone={empty ? 'warning' : 'primary'} />
          {!empty ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="caption" color="text2">
                Báo giá
              </Txt>
              <Txt variant="section" weight="bold" tabular numberOfLines={1}>
                {totals ? formatMoney(totals.op1) : '…'}
              </Txt>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onMore}
        testID={`project-more-${p.id}`}
        accessibilityRole="button"
        accessibilityLabel={`Thao tác dự án ${p.name}`}
        hitSlop={4}
        style={({ pressed }) => [styles.more, pressed && { backgroundColor: c.surface2 }]}
      >
        <Icon name="more" color={c.text} />
      </Pressable>
    </View>
  );
}

function Row({ icon, text, tabular }: { icon: 'user' | 'pin' | 'phone'; text: string; tabular?: boolean }) {
  const c = useColors();
  return (
    <View style={styles.row}>
      <Icon name={icon} color={c.text2} size={20} />
      <Txt variant="caption" color="text2" numberOfLines={1} tabular={tabular} style={{ flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  main: { flex: 1, minWidth: 0, padding: 16, paddingRight: 0, gap: 12 },
  foot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, paddingTop: 12, borderTopWidth: 1, flexWrap: 'wrap' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  more: { width: 48, height: 48, margin: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
