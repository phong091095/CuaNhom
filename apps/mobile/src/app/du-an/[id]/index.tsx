/**
 * Chi tiết dự án (B3 · SRS SCR-02): thông tin khách, thẻ báo giá, khối "Bóc tách & báo giá",
 * danh sách bộ cửa (D1): chạm mở chi tiết cửa; "Chọn" hoặc nhấn giữ để chọn nhiều (nhân bản, xóa + Hoàn tác);
 * "Sắp xếp" đổi thứ tự bằng nút ↑ ↓ (thứ tự dùng cho báo giá, phiếu cắt). Mọi con số tính lại bằng engine khi mở (SRS 5.2), bộ cửa theo bản chụp mẫu của nó.
 *
 * Còn thiếu so với artboard (làm ở giai đoạn sau): ô Nhôm/Kính/Phụ kiện/Báo giá bấm được (GĐ 7–9); "Biên thực tế sau hao hụt" cần số cây thực mua (GĐ 7),
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
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { getDb } from '@/db/client';
import { duplicateDoor, moveDoor, restoreDoor, softDeleteDoors } from '@/db/repos/doors';
import { updateProject } from '@/db/repos/projects';
import { computeProject, type ComputedDoor, type ComputedProject } from '@/domain/projectCalc';
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABELS, type ProjectStatus } from '@/domain/types';
import { ProjectActions } from '@/features/projects/ProjectActions';
import { StatusSheet } from '@/features/projects/StatusSheet';
import { useDataRevision } from '@/store/dataRevision';
import { useColors } from '@/theme/ThemeProvider';
import {
  Badge,
  Body,
  BottomBar,
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  Header,
  Icon,
  IconButton,
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
  const bump = useDataRevision((st) => st.bump);
  const [data, setData] = useState<ComputedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [mode, setMode] = useState<ListMode>('normal');
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

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
  // Nút lùi Android khi đang chọn nhiều / sắp xếp: thoát chế độ, không rời màn.
  useFocusEffect(
    useCallback(() => {
      if (mode === 'normal') return undefined;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setMode('normal');
        setSelected([]);
        return true;
      });
      return () => sub.remove();
    }, [mode]),
  );
  // Dữ liệu đổi từ nơi khác khi màn này đang hiện (Hoàn tác xóa bộ cửa ở snackbar) thì tải lại.
  useEffect(
    () =>
      useDataRevision.subscribe(() => {
        load();
      }),
    [load],
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
  // Bộ đã chọn theo thứ tự trong danh sách (bỏ bộ không còn).
  const picked = doors.filter((d) => selected.includes(d.door.id));
  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const exitMode = () => {
    setMode('normal');
    setSelected([]);
  };

  const removePicked = async () => {
    const ids = picked.map((d) => d.door.id);
    setConfirmDelete(false);
    await softDeleteDoors(await getDb(), ids);
    exitMode();
    await load();
    snack.show(`Đã xóa ${ids.length} bộ cửa`, {
      onUndo: async () => {
        const db = await getDb();
        const renamed: string[] = [];
        for (const id of ids) {
          const r = await restoreDoor(db, id);
          if (r.renamed) renamed.push(r.symbol);
        }
        bump();
        if (renamed.length > 0) snack.show(`Đã khôi phục; ký hiệu trùng nên đổi thành ${renamed.join(', ')}`);
      },
    });
  };

  const duplicatePicked = async () => {
    setBusy(true);
    try {
      const db = await getDb();
      const made: string[] = [];
      for (const d of picked) made.push((await duplicateDoor(db, d.door.id)).symbol);
      exitMode();
      await load();
      snack.show(`Đã nhân bản thành ${made.join(', ')}`, { tone: 'success' });
    } finally {
      setBusy(false);
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    await moveDoor(await getDb(), id, dir);
    await load();
  };

  const onRowPress = (d: ComputedDoor) => {
    if (mode === 'select') toggle(d.door.id);
    else router.push(`/du-an/${p.id}/cua/${d.door.id}`);
  };
  const onRowLongPress = (d: ComputedDoor) => {
    if (mode !== 'normal') return;
    setMode('select');
    setSelected([d.door.id]);
  };
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
        <View style={styles.listHead}>
          <View style={{ flex: 1 }}>
            <SectionTitle>{s.doors > 0 ? `Bộ cửa (${s.doors} loại · ${s.sets} bộ)` : 'Bộ cửa'}</SectionTitle>
          </View>
          {mode === 'normal' && doors.length > 0 ? (
            <View style={styles.listActions}>
              <Button kind="ghost" compact icon="check" label="Chọn" testID="doors-select" onPress={() => setMode('select')} />
              {doors.length > 1 ? <Button kind="ghost" compact icon="sort" label="Sắp xếp" testID="doors-sort" onPress={() => setMode('sort')} /> : null}
            </View>
          ) : null}
        </View>
        {mode === 'select' ? (
          <Txt variant="caption" color="text2">
            Chạm để chọn hoặc bỏ chọn bộ cửa.
          </Txt>
        ) : null}
        {mode === 'sort' ? (
          <Txt variant="caption" color="text2">
            Dùng nút lên, xuống để đổi thứ tự. Thứ tự này dùng cho báo giá và phiếu cắt.
          </Txt>
        ) : null}
        {doors.length === 0 ? (
          <EmptyState icon="door" title="Chưa có bộ cửa nào" message="Thêm bộ cửa đầu tiên: chọn mẫu, nhập rộng × cao, app tính cắt nhôm, kính, phụ kiện và giá." />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {doors.map((d, i) => (
              <DoorRow
                key={d.door.id}
                item={d}
                first={i === 0}
                last={i === doors.length - 1}
                mode={mode}
                selected={selected.includes(d.door.id)}
                onPress={() => onRowPress(d)}
                onLongPress={() => onRowLongPress(d)}
                onMove={(dir) => move(d.door.id, dir)}
              />
            ))}
          </Card>
        )}
      </Body>
      <BottomBar>
        {mode === 'normal' ? <Button label="Thêm bộ cửa" icon="plus" onPress={addDoor} testID="add-door" /> : null}
        {mode === 'select' ? (
          <>
            <Txt variant="caption" color="text2" testID="picked-count">
              {picked.length === 0 ? 'Chưa chọn bộ cửa nào' : `Đã chọn ${picked.length} bộ cửa (${picked.reduce((a, d) => a + d.door.qty, 0)} bộ)`}
            </Txt>
            <View style={styles.barRow}>
              <Button kind="secondary" label="Xong" onPress={exitMode} testID="select-done" style={{ flex: 1 }} />
              <Button
                kind="secondary"
                label={`Nhân bản (${picked.length})`}
                disabled={picked.length === 0}
                loading={busy}
                onPress={duplicatePicked}
                testID="select-duplicate"
                style={{ flex: 1 }}
              />
              <Button
                kind="destructive"
                label={`Xóa (${picked.length})`}
                disabled={picked.length === 0}
                onPress={() => setConfirmDelete(true)}
                testID="select-delete"
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : null}
        {mode === 'sort' ? <Button label="Xong" icon="check" onPress={exitMode} testID="sort-done" /> : null}
      </BottomBar>
      <Dialog
        visible={confirmDelete}
        title={`Xóa ${picked.length} bộ cửa?`}
        message={`${picked.map((d) => d.door.symbol).join(', ')} (${picked.reduce((a, d) => a + d.door.qty, 0)} bộ) sẽ được chuyển vào Đã xóa gần đây và tự xóa hẳn sau 30 ngày.`}
        confirmLabel={`Xóa ${picked.length} bộ cửa`}
        destructive
        onConfirm={removePicked}
        onCancel={() => setConfirmDelete(false)}
      />
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

type ListMode = 'normal' | 'select' | 'sort';

function DoorRow({
  item,
  first,
  last,
  mode,
  selected,
  onPress,
  onLongPress,
  onMove,
}: {
  item: ComputedDoor;
  first: boolean;
  last: boolean;
  mode: ListMode;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
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
  const summary = `${d.symbol}, ${name}, ${formatSize(d.W, d.H)}, ${d.qty} bộ${errors ? ', có lỗi' : `, thành tiền ${formatMoney(unit * d.qty)}`}`;
  const content = (
    <>
      {mode === 'select' ? (
        <View style={[styles.check, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary : 'transparent' }]}>
          {selected ? <Icon name="check" color={c.surface} size={18} /> : null}
        </View>
      ) : null}
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
      {mode === 'sort' ? (
        <View style={styles.moveBtns}>
          <IconButton icon="arrowUp" label={`Đưa ${d.symbol} lên`} disabled={first} onPress={() => onMove(-1)} testID={`move-up-${d.symbol}`} />
          <IconButton icon="arrowDown" label={`Đưa ${d.symbol} xuống`} disabled={last} onPress={() => onMove(1)} testID={`move-down-${d.symbol}`} />
        </View>
      ) : !errors ? (
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          {mode === 'normal' ? (
            <Txt variant="caption" color="text2" tabular>
              {d.qty} bộ × {formatMoney(unit)}
            </Txt>
          ) : null}
          <Txt variant="bodyStrong" weight="bold" tabular>
            {formatMoney(unit * d.qty)}
          </Txt>
        </View>
      ) : null}
    </>
  );
  const rowStyle = [styles.door, !last && { borderBottomWidth: 1, borderBottomColor: c.divider }, selected && { backgroundColor: c.primarySoft }];
  if (mode === 'sort') {
    return (
      <View style={rowStyle} testID={`door-row-${d.symbol}`} accessibilityLabel={summary}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [...rowStyle, pressed && { backgroundColor: c.surface2 }]}
      accessibilityRole={mode === 'select' ? 'checkbox' : 'button'}
      accessibilityState={mode === 'select' ? { checked: selected } : {}}
      accessibilityLabel={mode === 'select' ? summary : `${summary}. Mở chi tiết`}
      accessibilityHint={mode === 'normal' ? 'Nhấn giữ để chọn nhiều' : undefined}
      testID={`door-row-${d.symbol}`}
    >
      {content}
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
  listHead: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, flexWrap: 'wrap' },
  listActions: { flexDirection: 'row' },
  check: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  moveBtns: { flexDirection: 'row', alignSelf: 'center' },
  barRow: { flexDirection: 'row', gap: 8 },
});
