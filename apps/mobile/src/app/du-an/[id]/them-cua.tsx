/**
 * Chọn mẫu cửa (D3 · SRS SCR-03): lưới mẫu có hình vẽ, chip lọc Cửa đi / Cửa sổ / Vách (chỉ nhóm đang có mẫu,
 * kèm số mẫu – NFR-MNT-01: thêm mẫu vào dữ liệu là chip tự hiện), nhãn "Lần trước" (NFR-USE-01).
 * Bước đầu của luồng 3 bước: ghi sự kiện door_started để đo thời gian một bộ cửa (SRS 10.3).
 */
import { TEMPLATE_GROUP_LABELS, type DoorTemplate, type TemplateGroup } from '@matadoor/engine';
import { visibleTemplates } from '@matadoor/data';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { now } from '@/db/clock';
import { getDb } from '@/db/client';
import { logEvent } from '@/db/repos/events';
import { getSetting, SETTING_KEYS } from '@/db/repos/settings';
import { DoorDrawing } from '@/features/doors/DoorDrawing';
import { useColors } from '@/theme/ThemeProvider';
import { Badge, Body, Chip, ChipRow, EmptyState, Header, Screen, Txt } from '@/ui';

type Filter = 'all' | TemplateGroup;

export default function PickTemplateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { width, fontScale } = useWindowDimensions();
  const templates = useMemo(() => visibleTemplates(__DEV__), []);
  const [filter, setFilter] = useState<Filter>('all');
  const [last, setLast] = useState<string | null>(null);
  /** Lúc mở D3 – ghi trong effect (không gọi đồng hồ khi render). */
  const started = useRef(0);

  useEffect(() => {
    started.current = now();
    let alive = true;
    getDb()
      .then(async (db) => {
        await logEvent(db, 'door_started', { projectId: id });
        const l = await getSetting(db, SETTING_KEYS.lastTemplateId);
        if (alive) setLast(l);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id]);

  const groups = (Object.keys(TEMPLATE_GROUP_LABELS) as TemplateGroup[])
    .map((g) => ({ g, n: templates.filter((t) => t.group === g).length }))
    .filter((x) => x.n > 0);
  const shown = templates.filter((t) => filter === 'all' || t.group === filter);
  const oneCol = fontScale > 1.2 || width < 340;
  const cardW = Math.min(720, width) - 32;
  const colW = oneCol ? cardW : (cardW - 12) / 2;

  const choose = (t: DoorTemplate) =>
    router.replace({ pathname: '/du-an/[id]/cua/moi', params: { id, mau: t.id, t0: String(started.current) } });

  return (
    <Screen>
      <Header title="Chọn mẫu cửa" />
      <View style={{ paddingTop: 12 }}>
        <ChipRow>
          <Chip label={`Tất cả (${templates.length})`} selected={filter === 'all'} onPress={() => setFilter('all')} testID="filter-all" />
          {groups.map(({ g, n }) => (
            <Chip key={g} label={`${TEMPLATE_GROUP_LABELS[g]} (${n})`} selected={filter === g} onPress={() => setFilter(g)} testID={`filter-${g}`} />
          ))}
        </ChipRow>
      </View>
      <Body>
        {shown.length === 0 ? (
          <EmptyState icon="door" title="Chưa có mẫu trong nhóm này" message="Mẫu cửa mới sẽ có khi cập nhật gói dữ liệu." />
        ) : (
          <View style={styles.grid}>
            {shown.map((t) => (
              <Pressable
                key={t.id}
                testID={`template-${t.id}`}
                onPress={() => choose(t)}
                accessibilityRole="button"
                accessibilityLabel={`${t.name}, ${TEMPLATE_GROUP_LABELS[t.group]}${t.id === last ? ', dùng lần trước' : ''}`}
                style={({ pressed }) => [
                  styles.card,
                  { width: colW, backgroundColor: pressed ? c.surface2 : c.surface, borderColor: t.id === last ? c.primary : c.divider, borderWidth: t.id === last ? 2 : 1 },
                ]}
              >
                <View style={{ alignItems: 'center' }}>
                  <DoorDrawing template={t} W={null} H={null} params={Object.fromEntries(t.params.map((p) => [p.key, p.default]))} width={colW - 24} maxHeight={140} dims={false} />
                </View>
                <Txt variant="bodyStrong">{t.name}</Txt>
                <Txt variant="caption" color="text2">
                  {TEMPLATE_GROUP_LABELS[t.group]}
                  {t.status === 'draft' ? ' · mẫu nháp (chỉ bản dev)' : ''}
                </Txt>
                {t.id === last ? <Badge label="Lần trước" icon="clock" tone="primary" /> : null}
              </Pressable>
            ))}
          </View>
        )}
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { borderRadius: 16, padding: 12, gap: 6 },
});
