/**
 * Chi tiết dự án (B3 · SRS SCR-02): thông tin khách, thẻ báo giá, khối "Bóc tách & báo giá",
 * danh sách bộ cửa. Mọi con số tính lại bằng engine khi mở (SRS 5.2), bộ cửa theo bản chụp mẫu của nó.
 *
 * Còn thiếu so với artboard (làm ở giai đoạn sau): chi tiết cửa D6 (GĐ 6b – tạm thời chạm dòng cửa mở form sửa);
 * ô Nhôm/Kính/Phụ kiện/Báo giá bấm được (GĐ 7–9); "Biên thực tế sau hao hụt" cần số cây thực mua (GĐ 7),
 * tạm thay bằng "Lãi dự kiến".
 */
import {
  formatArea,
  formatKg,
  formatMeters,
  formatMoney,
  formatMoneyPerM2,
  formatPercent,
  formatSize,
  TEMPLATE_GROUP_LABELS,
  keepTogether,
  unitPriceForQuote,
} from '@matadoor/engine';
import { findTemplate } from '@matadoor/data';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { getDb } from '@/db/client';
import { updateProject } from '@/db/repos/projects';
import { computeProject, type ComputedDoor, type ComputedProject } from '@/domain/projectCalc';
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABELS, type ProjectStatus } from '@/domain/types';
import { ProjectActions } from '@/features/projects/ProjectActions';
import { StatusSheet } from '@/features/projects/StatusSheet';
import { useColors } from '@/theme/ThemeProvider';
import {
  Badge,
  Body,
  BottomBar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  Icon,
  Screen,
  SectionTitle,
  SkeletonCard,
  Txt,
  useSnackbar,
  type IconName,
} from '@/ui';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const snack = useSnackbar();
  const [data, setData] = useState<ComputedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await computeProject(await getDb(), id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const changeStatus = async (s: ProjectStatus) => {
    await updateProject(await getDb(), id, { status: s });
    await load();
    snack.show(`Đã chuyển sang “${PROJECT_STATUS_LABELS[s]}”`, { tone: 'success' });
  };

  const header = (
    <Header
      title="Dự án"
      right={data ? <Button kind="ghost" compact icon="more" label="Thao tác" testID="project-actions" onPress={() => setShowActions(true)} /> : null}
    />
  );

  if (error) {
    return (
      <Screen>
        {header}
        <ErrorState title="Không mở được dự án" message={`${error}. Dự án có thể đã bị xóa.`} onRetry={load} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        {header}
        <Body>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </Body>
      </Screen>
    );
  }

  const { project: p, summary: s, doors } = data;
  const addDoor = () => router.push(`/du-an/${p.id}/them-cua`);
  return (
    <Screen>
      {header}
      <Body bottomBar={1}>
        <ProjectHead data={data} onStatus={() => setShowStatus(true)} />
        {s.sets > 0 ? <Hero data={data} /> : null}
        {s.invalidDoors.length > 0 ? (
          <Badge tone="error" icon="alert" label={`${s.invalidDoors.join(', ')} có lỗi – chưa tính vào tổng`} />
        ) : null}
        {s.sets > 0 ? <Modules data={data} /> : null}
        <SectionTitle>{s.doors > 0 ? `Bộ cửa (${s.doors} loại · ${s.sets} bộ)` : 'Bộ cửa'}</SectionTitle>
        {doors.length === 0 ? (
          <EmptyState icon="door" title="Chưa có bộ cửa nào" message="Thêm bộ cửa đầu tiên: chọn mẫu, nhập rộng × cao, app tính cắt nhôm, kính, phụ kiện và giá." />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {doors.map((d, i) => (
              <DoorRow key={d.door.id} item={d} last={i === doors.length - 1} onPress={() => router.push(`/du-an/${p.id}/cua/${d.door.id}/sua`)} />
            ))}
          </Card>
        )}
      </Body>
      <BottomBar>
        <Button label="Thêm bộ cửa" icon="plus" onPress={addDoor} testID="add-door" />
      </BottomBar>
      <ProjectActions
        target={showActions ? { project: p, doorCount: s.doors, setCount: s.sets, op1: s.op1 } : null}
        onClose={() => setShowActions(false)}
        onChanged={load}
        afterDelete={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
      <StatusSheet visible={showStatus} value={p.status} onChange={changeStatus} onClose={() => setShowStatus(false)} />
    </Screen>
  );
}

function ProjectHead({ data, onStatus }: { data: ComputedProject; onStatus: () => void }) {
  const c = useColors();
  const p = data.project;
  const st = PROJECT_STATUS_BADGE[p.status];
  const line = [p.customer, p.address].filter(Boolean).join(' · ');
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="title" accessibilityRole="header" testID="project-name">
        {p.name}
      </Txt>
      {line ? <Txt color="text2">{line}</Txt> : null}
      {p.phone ? (
        <Pressable
          onPress={() => Linking.openURL(`tel:${p.phone.replace(/[^\d+]/g, '')}`).catch(() => {})}
          accessibilityRole="link"
          accessibilityLabel={`Gọi ${p.phone}`}
          style={styles.phone}
        >
          <Icon name="phone" color={c.primary} size={20} />
          <Txt variant="bodyStrong" tabular style={{ color: c.primary, textDecorationLine: 'underline' }}>
            {keepTogether(p.phone)}
          </Txt>
        </Pressable>
      ) : null}
      <Badge label={`${PROJECT_STATUS_LABELS[p.status]} · Đổi`} icon={st.icon} tone={st.tone} onPress={onStatus} />
    </View>
  );
}

/** Thẻ tổng: mọi số dẫn xuất ghi căn cứ ngay cạnh (quy tắc thiết kế "Số dẫn xuất phải nêu căn cứ"). */
function Hero({ data }: { data: ComputedProject }) {
  const c = useColors();
  const s = data.summary;
  const cost = s.cost.total;
  const margin = s.op1 - cost;
  return (
    <View style={[styles.hero, { backgroundColor: c.hero }]} accessible accessibilityLabel={`Báo giá theo từng bộ ${formatMoney(s.op1)}`}>
      <Txt variant="caption" weight="medium" style={{ color: c.onHero2 }}>
        Báo giá (theo từng bộ)
      </Txt>
      <Txt variant="display" style={{ color: c.onHero }} testID="project-op1">
        {formatMoney(s.op1)}
      </Txt>
      <Txt variant="caption" tabular style={{ color: c.onHero2 }}>
        Giá vốn {formatMoney(cost)} · {s.sets} bộ · {formatArea(s.area, 2)}
      </Txt>
      {s.area > 0 ? (
        <Txt variant="caption" tabular style={{ color: c.onHero2 }}>
          Đơn giá TB (theo báo giá) {formatMoneyPerM2(s.op1 / s.area)}
        </Txt>
      ) : null}
      {s.op1 > 0 ? (
        <Txt variant="caption" tabular style={{ color: c.onHero2 }}>
          Lãi dự kiến (chưa tính hao hụt) {formatMoney(margin)} · {formatPercent(margin / s.op1, 2)}
        </Txt>
      ) : null}
    </View>
  );
}

function Modules({ data }: { data: ComputedProject }) {
  const { fontScale } = useWindowDimensions();
  const s = data.summary;
  const totalM = s.profiles.reduce((a, x) => a + x.totalM, 0);
  const kg = s.profiles.reduce((a, x) => a + x.kg, 0);
  const panes = s.glass.reduce((a, x) => a + x.panes, 0);
  const laborM2 = s.labor[0]?.qty ?? 0;
  const items: { icon: IconName; label: string; meta: string; value: string; tag?: string }[] = [
    { icon: 'door', label: 'Cửa', meta: `${s.doors} loại · ${s.sets} bộ`, value: formatArea(s.area, 2) },
    { icon: 'alu', label: 'Nhôm', meta: `${formatMeters(totalM)} · ${formatKg(kg)} · ước tính`, value: formatMoney(s.cost.nhom) },
    { icon: 'glass', label: 'Kính', meta: `${panes} tấm`, value: formatMoney(s.cost.kinh) },
    { icon: 'acc', label: 'Phụ kiện', meta: `${s.accessories.length} mã`, value: formatMoney(s.cost.phukien) },
    { icon: 'user', label: 'Nhân công', meta: formatArea(laborM2, 2), value: formatMoney(s.cost.nhancong) },
    { icon: 'quote', label: 'Báo giá', meta: 'Giá bán theo bảng giá', value: formatMoney(s.op1), tag: 'Bước cuối' },
  ];
  // Lưới 2 cột tự về 1 cột khi chữ hệ thống lớn (Handoff3: tỉ lệ vượt 1,2).
  const oneCol = fontScale > 1.2;
  return (
    <>
      <SectionTitle>Bóc tách & báo giá</SectionTitle>
      <Txt variant="caption" color="text2">
        Giá vốn theo bảng giá hiện tại; nhôm tính theo chiều dài dùng.
      </Txt>
      <View style={styles.grid}>
        {items.map((m) => (
          <View key={m.label} style={{ width: oneCol ? '100%' : '48.5%' }}>
            <Module {...m} />
          </View>
        ))}
      </View>
    </>
  );
}

function Module({ icon, label, meta, value, tag }: { icon: IconName; label: string; meta: string; value: string; tag?: string }) {
  const c = useColors();
  return (
    <View style={[styles.module, { backgroundColor: c.surface, borderColor: c.divider }]} accessible accessibilityLabel={`${label}: ${meta}, ${value}`}>
      <View style={styles.moduleTop}>
        <View style={[styles.moduleIcon, { backgroundColor: c.primarySoft }]}>
          <Icon name={icon} color={c.onPrimarySoft} />
        </View>
        {tag ? (
          <Txt variant="caption" color="text2">
            {tag}
          </Txt>
        ) : null}
      </View>
      <Txt variant="bodyStrong">{label}</Txt>
      <Txt variant="caption" color="text2" numberOfLines={2}>
        {meta}
      </Txt>
      <Txt variant="bodyStrong" weight="bold" tabular>
        {value}
      </Txt>
    </View>
  );
}

function DoorRow({ item, last, onPress }: { item: ComputedDoor; last: boolean; onPress: () => void }) {
  const c = useColors();
  const { door: d, result: r, template } = item;
  const name = template?.name ?? findTemplate(d.templateId)?.name ?? d.templateId;
  const group = template ? TEMPLATE_GROUP_LABELS[template.group] : '';
  const glass = r.glass[0]?.name;
  // Đơn giá 1 bộ làm tròn đến đồng, thành tiền = đơn giá × số bộ (như trên báo giá – Q8).
  const unit = unitPriceForQuote(r);
  const errors = r.dataErrors.length > 0 || !r.ok;
  const lines: ReactNode[] = [
    `${formatSize(d.W, d.H)} · ${formatArea(r.areaPerSet, 2)}`,
    ...(glass ? [glass] : []),
    ...(d.location ? [d.location] : []),
  ];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.door, !last && { borderBottomWidth: 1, borderBottomColor: c.divider }, pressed && { backgroundColor: c.surface2 }]}
      accessibilityRole="button"
      accessibilityLabel={`${d.symbol}, ${name}, ${formatSize(d.W, d.H)}, ${d.qty} bộ${errors ? ', có lỗi' : `, thành tiền ${formatMoney(unit * d.qty)}`}. Mở để sửa`}
      testID={`door-row-${d.symbol}`}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">
          {d.symbol} · {name}
        </Txt>
        {group ? (
          <Txt variant="caption" color="text2">
            {group}
            {d.color ? ` · ${d.color}` : ''}
          </Txt>
        ) : null}
        {lines.map((l, i) => (
          <Txt key={i} variant="caption" color="text2" tabular>
            {l}
          </Txt>
        ))}
        {errors ? <Badge tone="error" icon="alert" label={r.dataErrors[0] ?? r.checks.find((x) => x.level === 'error')?.message ?? 'Có lỗi'} /> : null}
        {item.newerTemplateVersion ? <Badge tone="info" icon="info" label="Mẫu đã cập nhật" /> : null}
      </View>
      {!errors ? (
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Txt variant="caption" color="text2" tabular>
            {d.qty} bộ × {formatMoney(unit)}
          </Txt>
          <Txt variant="bodyStrong" weight="bold" tabular>
            {formatMoney(unit * d.qty)}
          </Txt>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  phone: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  hero: { borderRadius: 16, padding: 16, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  module: { minHeight: 116, borderRadius: 16, borderWidth: 1, padding: 12, gap: 4 },
  moduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moduleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  door: { flexDirection: 'row', gap: 12, padding: 16, alignItems: 'flex-start' },
});
