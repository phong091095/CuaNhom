/**
 * Chi tiết bộ cửa (D6 · SRS SCR-05): thẻ tổng (bản vẽ nhỏ, kích thước, thành tiền, giá vốn, lãi, m², kg nhôm),
 * tab Tổng quan · Nhôm · Kính · Phụ kiện · Nhân công (FR-BOM-01…03), thao tác Sửa / Nhân bản / Xóa (+ Hoàn tác),
 * "Thêm cửa tiếp" (cùng loại / khác loại, nhớ lựa chọn cho lần sau).
 *
 * Lệch artboard (ghi ở KE_HOACH_TRIEN_KHAI GĐ 6b): không có ảnh công trình (Q6); không có tab "Vật tư phụ" vì vít,
 * ke, silicone thuộc nhóm Phụ kiện của mẫu cửa (SRS chỉ có 4 nhóm giá) – thay bằng tab Nhân công;
 * "Sơ đồ cắt của dự án" làm cùng màn cắt nhôm (GĐ 7).
 */
import {
  formatArea,
  formatKg,
  formatMeters,
  formatMm,
  formatMoney,
  formatMoneyPerM2,
  formatNumber,
  formatPercent,
  formatQty,
  formatSize,
  unitPriceForQuote,
  type DoorResult,
} from '@matadoor/engine';
import { findSystem } from '@matadoor/data';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { now } from '@/db/clock';
import { getDb } from '@/db/client';
import { duplicateDoor, restoreDoor, softDeleteDoors, suggestSymbol } from '@/db/repos/doors';
import { listMaterials } from '@/db/repos/materials';
import { getSetting, setSetting, SETTING_KEYS } from '@/db/repos/settings';
import { aluminumGroups, doorSpecs, perUnit, profileSubtitle, unitCost, type AluGroup } from '@/domain/doorDetail';
import { computeSingleDoor, type ComputedSingleDoor } from '@/domain/projectCalc';
import type { MaterialRow } from '@/domain/types';
import { useDataRevision } from '@/store/dataRevision';
import { useColors } from '@/theme/ThemeProvider';
import {
  Badge,
  Body,
  BottomBar,
  BottomSheet,
  Button,
  Card,
  Dialog,
  ErrorState,
  Header,
  IconButton,
  InfoRow,
  ListRow,
  RowGroup,
  Screen,
  SectionTitle,
  SkeletonCard,
  Tabs,
  Txt,
  useSnackbar,
} from '@/ui';
import { DoorDrawing } from './DoorDrawing';

type TabId = 'overview' | 'nhom' | 'kinh' | 'phukien' | 'nhancong';
const TABS: { value: TabId; label: string }[] = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'nhom', label: 'Nhôm' },
  { value: 'kinh', label: 'Kính' },
  { value: 'phukien', label: 'Phụ kiện' },
  { value: 'nhancong', label: 'Nhân công' },
];

type AddChoice = 'same' | 'other';

interface Loaded extends ComputedSingleDoor {
  materials: MaterialRow[];
  /** Ký hiệu kế tiếp cùng tiền tố (cho "Nhân bản", "Cửa cùng loại"). */
  nextSymbol: string;
  lastChoice: AddChoice | null;
}

export function DoorDetail({ projectId, doorId }: { projectId: string; doorId: string }) {
  const snack = useSnackbar();
  const bump = useDataRevision((s) => s.bump);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  const [overlay, setOverlay] = useState<'add' | 'menu' | 'delete' | null>(null);
  const [pick, setPick] = useState<AddChoice>('same');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [tabsY, setTabsY] = useState(0);

  const load = useCallback(async () => {
    try {
      const db = await getDb();
      const c = await computeSingleDoor(db, doorId);
      const prefix = c.template?.symbolPrefix ?? (c.door.symbol.match(/^\D*/)?.[0] || 'D');
      const [materials, nextSymbol, last] = await Promise.all([
        listMaterials(db),
        suggestSymbol(db, c.door.projectId, prefix),
        getSetting(db, SETTING_KEYS.afterSaveChoice),
      ]);
      setData({
        ...c,
        materials,
        nextSymbol,
        lastChoice: last === 'same' || last === 'other' ? last : null,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [doorId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace(`/du-an/${projectId}`));
  const header = (right?: ReactNode) => <Header title={data ? `Bộ cửa ${data.door.symbol}` : 'Bộ cửa'} right={right} />;

  if (error) {
    return (
      <Screen>
        {header()}
        <ErrorState title="Không mở được bộ cửa" message={`${error}. Bộ cửa có thể đã bị xóa.`} onRetry={load} />
      </Screen>
    );
  }
  if (!data) {
    return (
      <Screen>
        {header()}
        <Body>
          <SkeletonCard lines={4} />
          <SkeletonCard lines={5} />
        </Body>
      </Screen>
    );
  }

  const { door: d, template: t, result: r } = data;
  const name = t?.name ?? d.templateId;
  const broken = r.dataErrors.length > 0 || !r.ok;
  const unit = broken ? null : unitPriceForQuote(r);
  const total = unit === null ? null : unit * d.qty;

  // iOS không mở được hộp thoại/sheet mới khi sheet cũ đang đóng dở.
  const switchOverlay = (next: 'add' | 'menu' | 'delete' | null) => {
    setOverlay(null);
    if (next) setTimeout(() => setOverlay(next), Platform.OS === 'ios' ? 350 : 0);
  };

  const edit = () => {
    setOverlay(null);
    router.push(`/du-an/${projectId}/cua/${d.id}/sua`);
  };

  const duplicate = async () => {
    setOverlay(null);
    const copy = await duplicateDoor(await getDb(), d.id);
    await load();
    snack.show(`Đã nhân bản ${d.symbol} thành ${copy.symbol}`, {
      tone: 'success',
    });
  };

  const remove = async () => {
    setOverlay(null);
    await softDeleteDoors(await getDb(), [d.id]);
    bump();
    back();
    snack.show(`Đã xóa bộ cửa ${d.symbol}`, {
      onUndo: async () => {
        const res = await restoreDoor(await getDb(), d.id);
        bump();
        if (res.renamed) snack.show(`Đã khôi phục, ký hiệu đổi thành ${res.symbol} vì ${d.symbol} đã có bộ khác dùng`);
      },
    });
  };

  const openAdd = () => {
    setPick(data.lastChoice ?? 'same');
    setOverlay('add');
  };

  const continueAdd = async () => {
    setOverlay(null);
    await setSetting(await getDb(), SETTING_KEYS.afterSaveChoice, pick);
    if (pick === 'same') {
      router.push({
        pathname: '/du-an/[id]/cua/moi',
        params: {
          id: projectId,
          mau: d.templateId,
          tu: d.id,
          t0: String(now()),
        },
      });
    } else {
      router.push(`/du-an/${projectId}/them-cua`);
    }
  };

  return (
    <Screen>
      {header(
        <View style={styles.headerRight}>
          <Button kind="ghost" compact icon="edit" label="Sửa" testID="door-edit" onPress={edit} />
          <IconButton icon="more" label="Thao tác bộ cửa" testID="door-actions" onPress={() => setOverlay('menu')} />
        </View>,
      )}
      {/* key: dựng mới ScrollView (không dùng lại cái của khung chờ) để ref gắn chắc chắn trên web. */}
      <Body key="detail" bottomBar={1} ref={scroll}>
        <TopCard data={data} unit={unit} total={total} />
        {r.dataErrors.map((m) => (
          <Badge key={m} tone="error" icon="alert" label={m} />
        ))}
        {r.checks
          .filter((c) => c.level !== 'info')
          .map((c) => (
            <Badge key={c.id} tone={c.level === 'error' ? 'error' : 'warning'} icon="alert" label={c.message} />
          ))}
        <View onLayout={(e) => setTabsY(e.nativeEvent.layout.y)}>
          <Tabs
            options={TABS}
            value={tab}
            onChange={(v) => {
              setTab(v);
              // Đưa thanh tab lên đầu để thấy ngay nội dung tab vừa chọn.
              scroll.current?.scrollTo({ y: Math.max(0, tabsY - 8), animated: true });
            }}
            accessibilityLabel="Phần bóc tách"
          />
        </View>
        {tab === 'overview' ? <Overview data={data} unit={unit} /> : null}
        {tab === 'nhom' ? <AluTab data={data} /> : null}
        {tab === 'kinh' ? <GlassTab data={data} /> : null}
        {tab === 'phukien' ? <AccessoryTab data={data} /> : null}
        {tab === 'nhancong' ? <LaborTab data={data} /> : null}
      </Body>
      <BottomBar>
        <Button label="Thêm cửa tiếp" icon="plus" onPress={openAdd} testID="add-next" />
      </BottomBar>

      <BottomSheet
        visible={overlay === 'add'}
        onClose={() => setOverlay(null)}
        title="Thêm cửa tiếp"
        footer={<Button label="Tiếp tục" onPress={continueAdd} testID="add-next-continue" />}
      >
        <Choice
          on={pick === 'same'}
          last={data.lastChoice === 'same'}
          label="Cửa cùng loại"
          desc={`Giữ mẫu và thông số của ${d.symbol}, chỉ nhập kích thước (thành ${data.nextSymbol})`}
          onPress={() => setPick('same')}
          testID="choice-same"
        />
        <Choice
          on={pick === 'other'}
          last={data.lastChoice === 'other'}
          label="Cửa khác loại"
          desc="Chọn lại mẫu cửa"
          onPress={() => setPick('other')}
          testID="choice-other"
        />
        <Txt variant="caption" color="text2">
          Lựa chọn được ghi nhớ cho lần sau.
        </Txt>
      </BottomSheet>

      <BottomSheet visible={overlay === 'menu'} onClose={() => setOverlay(null)} title={`Bộ cửa ${d.symbol}`}>
        <ListRow icon="edit" title="Sửa bộ cửa" onPress={edit} testID="action-edit" />
        <ListRow icon="copy" title="Nhân bản" subtitle={`Tạo ${data.nextSymbol} giống ${d.symbol}`} onPress={duplicate} testID="action-duplicate" />
        <ListRow icon="trash" title="Xóa bộ cửa" onPress={() => switchOverlay('delete')} testID="action-delete" />
      </BottomSheet>

      <Dialog
        visible={overlay === 'delete'}
        title={`Xóa bộ cửa ${d.symbol}?`}
        message={`${name} · ${d.qty} bộ${total !== null ? ` · ${formatMoney(total)}` : ''} sẽ được chuyển vào Đã xóa gần đây và tự xóa hẳn sau 30 ngày.`}
        confirmLabel="Xóa bộ cửa"
        destructive
        onConfirm={remove}
        onCancel={() => setOverlay(null)}
      />
    </Screen>
  );
}

// ---------------------------------------------------------------- thẻ tổng

function TopCard({ data, unit, total }: { data: Loaded; unit: number | null; total: number | null }) {
  const c = useColors();
  const { door: d, template: t, result: r } = data;
  const kg = r.profiles.reduce((a, l) => a + l.kg, 0);
  const profit = total === null ? null : total - r.cost.total;
  const meta = [formatSize(d.W, d.H), `${d.qty} bộ`, t ? (findSystem(t.system)?.name ?? t.system) : null].filter(Boolean).join(' · ');
  return (
    <Card>
      <View style={{ gap: 6 }}>
        <View style={styles.topRow}>
          {t ? (
            <View style={[styles.thumb, { backgroundColor: c.surface2 }]}>
              <DoorDrawing template={t} W={d.W} H={d.H} params={d.params} width={72} maxHeight={104} dims={false} />
            </View>
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="section" weight="bold" testID="door-detail-title">
              {d.symbol} · {t?.name ?? d.templateId}
            </Txt>
            <Txt variant="caption" color="text2" tabular>
              {meta}
            </Txt>
            {d.color ? (
              <Txt variant="caption" color="text2">
                Màu {d.color}
              </Txt>
            ) : null}
            {d.location ? (
              <Txt variant="caption" color="text2">
                {d.location}
              </Txt>
            ) : null}
          </View>
        </View>
        {data.newerTemplateVersion ? (
          <Badge
            tone="info"
            icon="info"
            label={`Mẫu đã cập nhật (phiên bản ${data.newerTemplateVersion}) – bộ cửa này giữ số liệu phiên bản ${d.templateVersion}`}
          />
        ) : null}
        <View style={[styles.sep, { backgroundColor: c.divider }]} />
        <Txt variant="caption" weight="medium" color="text2">
          Thành tiền ({d.qty} bộ)
        </Txt>
        <Txt variant="display" testID="door-detail-total">
          {total === null ? '—' : formatMoney(total)}
        </Txt>
        {unit !== null && d.qty > 1 ? (
          <Txt variant="caption" color="text2" tabular>
            {d.qty} bộ × {formatMoney(unit)}
          </Txt>
        ) : null}
        <View style={styles.stats}>
          <Stat label="Diện tích" value={formatArea(r.area, 2)} />
          <Stat label="Giá vốn" value={broken(r) ? '—' : formatMoney(r.cost.total)} />
          <Stat label="Lãi dự kiến" value={profit === null || !total ? '—' : `${formatMoney(profit)} · ${formatPercent(profit / total, 1)}`} />
          <Stat label="Đơn giá TB (theo giá bán)" value={total === null || r.area <= 0 ? '—' : formatMoneyPerM2(total / r.area)} />
          <Stat label="Nhôm" value={formatKg(kg)} />
        </View>
      </View>
    </Card>
  );
}

function broken(r: DoorResult): boolean {
  return r.dataErrors.length > 0 || !r.ok;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Txt variant="caption" color="text2">
        {label}
      </Txt>
      <Txt variant="bodyStrong" tabular>
        {value}
      </Txt>
    </View>
  );
}

const perSet = (x: number, r: DoorResult) => x / (r.qty > 0 ? r.qty : 1);

// ---------------------------------------------------------------- Tổng quan

function Overview({ data, unit }: { data: Loaded; unit: number | null }) {
  const { door: d, template: t, result: r, book, materials } = data;
  const glassNames = new Map(materials.filter((m) => m.group === 'kinh').map((m) => [m.code, m.name]));
  const specs = doorSpecs(d, t, glassNames);
  const groups = aluminumGroups(r, materials);
  const meters = groups.reduce((a, g) => a + g.meters, 0);
  const kg = groups.reduce((a, g) => a + g.kg, 0);
  const glassArea = r.glass.reduce((a, g) => a + g.areaEach * g.qtyPerSet, 0);
  const oneGlass = r.glass.length === 1 ? r.glass[0]! : null;
  const glassPrice = oneGlass ? unitCost(book, oneGlass.code) : null;
  return (
    <>
      <SectionTitle>Thông số</SectionTitle>
      <RowGroup>
        {specs.map((s) => (
          <InfoRow key={s.label} title={s.label} value={s.value} />
        ))}
        {t ? (
          <ListRowDivided
            icon="ruler"
            title="Thông số hệ"
            subtitle="Công thức cắt, khe hở, giới hạn kích thước của mẫu"
            onPress={() =>
              router.push({
                pathname: '/mau/[templateId]',
                params: { templateId: t.id, v: String(t.version) },
              })
            }
            testID="open-template-spec"
          />
        ) : null}
      </RowGroup>
      {broken(data.result) ? null : (
        <>
          <SectionTitle>Chi phí 1 bộ (giá gốc)</SectionTitle>
          <RowGroup>
            <InfoRow
              title="Nhôm"
              sub={`${groups.length} mã profile · ${formatMeters(meters)} · ${formatKg(kg)}`}
              value={formatMoney(perSet(r.cost.nhom, r))}
            />
            <InfoRow
              title="Kính"
              sub={glassPrice !== null ? `${formatArea(glassArea)} × ${formatMoneyPerM2(glassPrice)}` : formatArea(glassArea)}
              value={formatMoney(perSet(r.cost.kinh, r))}
            />
            <InfoRow title="Phụ kiện" sub={`${r.accessories.length} mục`} value={formatMoney(perSet(r.cost.phukien, r))} />
            {r.labor.map((l) => {
              const p = unitCost(book, l.code);
              return (
                <InfoRow
                  key={l.code}
                  title={l.name}
                  sub={p !== null ? `${formatQty(l.qtyPerSet, l.unit)} × ${perUnit(p, l.unit)}` : formatQty(l.qtyPerSet, l.unit)}
                  value={formatMoney(perSet(l.cost, r))}
                />
              );
            })}
            <InfoRow title="Giá vốn 1 bộ" value={formatMoney(r.costPerSet)} total />
            <InfoRow
              title="Giá bán 1 bộ"
              sub="Giá gốc × hệ số nhóm ở Thư viện"
              value={unit === null ? '—' : formatMoney(unit)}
              total
              testID="door-unit-price"
            />
          </RowGroup>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Nhôm

function AluTab({ data }: { data: Loaded }) {
  const r = data.result;
  const groups = aluminumGroups(r, data.materials);
  if (groups.length === 0) return <Empty />;
  return (
    <>
      <SectionTitle>{`Nhôm · ${groups.length} mã profile`}</SectionTitle>
      {groups.map((g) => (
        <AluGroupCard key={g.code} g={g} />
      ))}
      <RowGroup>
        <InfoRow title="Nhôm 1 bộ" value={formatMoney(perSet(r.cost.nhom, r))} total />
      </RowGroup>
      <Txt variant="caption" color="text2">
        Tiền nhôm ở đây tính theo chiều dài dùng, chưa gồm hao hụt. Số cây thực phải mua được tính trên cả dự án.
      </Txt>
    </>
  );
}

function AluGroupCard({ g }: { g: AluGroup }) {
  const head = [
    g.barPrice !== null ? `${formatMoney(g.barPrice)}/cây` : null,
    g.barLengthMm ? `cây ${formatMm(g.barLengthMm)}` : null,
    g.kgPerM ? `${formatNumber(g.kgPerM, { maxDecimals: 3 })} kg/m` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const bars = g.bars !== null ? ` = ${formatNumber(g.bars, { maxDecimals: 2 })} cây` : '';
  return (
    <RowGroup>
      <InfoRow title={`${g.code} · ${g.name}`} sub={head} head />
      {g.lines.map((l) => (
        <InfoRow key={l.role} title={l.label} sub={profileSubtitle(l)} value={formatMm(l.length)} testID={`profile-${l.role}`} />
      ))}
      <InfoRow title={`Cộng ${g.code}`} sub={`${formatMeters(g.meters)}${bars} · ${formatKg(g.kg)}`} value={formatMoney(g.cost)} />
    </RowGroup>
  );
}

// ---------------------------------------------------------------- Kính

function GlassTab({ data }: { data: Loaded }) {
  const { result: r, book } = data;
  if (r.glass.length === 0) return <Empty />;
  return (
    <>
      <SectionTitle>Kính</SectionTitle>
      {r.glass.map((g) => {
        const p = unitCost(book, g.code);
        return (
          <RowGroup key={g.key}>
            <InfoRow title={g.label} sub={g.name} head />
            <InfoRow
              title="Kích thước"
              sub={`${g.qtyPerSet} tấm · ${formatKg(g.weightEach)}/tấm`}
              value={formatSize(g.width, g.height)}
              testID={`glass-${g.key}`}
            />
            <InfoRow title="Diện tích" value={formatArea(g.areaEach * g.qtyPerSet)} />
            <InfoRow title="Đơn giá" sub="Theo Thư viện" value={p !== null ? formatMoneyPerM2(p) : '—'} />
          </RowGroup>
        );
      })}
      <RowGroup>
        <InfoRow title="Kính 1 bộ" value={formatMoney(perSet(r.cost.kinh, r))} total />
      </RowGroup>
    </>
  );
}

// ---------------------------------------------------------------- Phụ kiện

function AccessoryTab({ data }: { data: Loaded }) {
  const { result: r, book } = data;
  if (r.accessories.length === 0) return <Empty />;
  return (
    <>
      <SectionTitle>{`Phụ kiện · ${r.accessories.length} mục`}</SectionTitle>
      <RowGroup>
        {r.accessories.map((a) => {
          const p = unitCost(book, a.code);
          const qty = formatQty(a.rawPerSet, a.unit, 3);
          return (
            <InfoRow
              key={a.code}
              title={a.name}
              sub={[p !== null ? `${qty} × ${perUnit(p, a.unit)}` : qty, a.note].filter(Boolean).join(' · ')}
              value={formatMoney(perSet(a.cost, r))}
              testID={`acc-${a.code}`}
            />
          );
        })}
        <InfoRow title="Phụ kiện 1 bộ" value={formatMoney(perSet(r.cost.phukien, r))} total />
      </RowGroup>
      <Txt variant="caption" color="text2">
        Số lẻ (silicone, nêm, gioăng…) được làm tròn lên khi cộng cả dự án.
      </Txt>
    </>
  );
}

// ---------------------------------------------------------------- Nhân công

function LaborTab({ data }: { data: Loaded }) {
  const { result: r, book } = data;
  if (r.labor.length === 0) return <Empty />;
  return (
    <>
      <SectionTitle>Nhân công</SectionTitle>
      <RowGroup>
        {r.labor.map((l) => {
          const p = unitCost(book, l.code);
          return (
            <InfoRow
              key={l.code}
              title={l.name}
              sub={p !== null ? `${formatQty(l.qtyPerSet, l.unit)} × ${perUnit(p, l.unit)}` : formatQty(l.qtyPerSet, l.unit)}
              value={formatMoney(perSet(l.cost, r))}
            />
          );
        })}
        <InfoRow title="Nhân công 1 bộ" value={formatMoney(perSet(r.cost.nhancong, r))} total />
      </RowGroup>
      <Txt variant="caption" color="text2">
        Nhân công tính theo diện tích, không làm tròn.
      </Txt>
    </>
  );
}

/** Dòng bấm được nằm cuối một nhóm dòng: thêm vạch ngăn phía trên như các dòng khác. */
function ListRowDivided(props: Parameters<typeof ListRow>[0]) {
  const c = useColors();
  return (
    <>
      <View style={[styles.divider, { backgroundColor: c.divider }]} />
      <ListRow {...props} />
    </>
  );
}

function Empty() {
  return <Txt color="text2">Không có số liệu – bộ cửa đang lỗi dữ liệu mẫu.</Txt>;
}

// ---------------------------------------------------------------- lựa chọn "Thêm cửa tiếp"

function Choice({
  on,
  last,
  label,
  desc,
  onPress,
  testID,
}: {
  on: boolean;
  last: boolean;
  label: string;
  desc: string;
  onPress: () => void;
  testID: string;
}) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${label}${last ? ', lần trước' : ''}. ${desc}`}
      style={[
        styles.choice,
        {
          borderColor: on ? c.primary : c.divider,
          borderWidth: on ? 2 : 1,
          backgroundColor: on ? c.primarySoft : 'transparent',
        },
      ]}
    >
      <View style={[styles.radio, { borderColor: on ? c.primary : c.border }]}>
        {on ? <View style={[styles.radioDot, { backgroundColor: c.primary }]} /> : null}
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Txt variant="bodyStrong">{label}</Txt>
          {last ? <Badge tone="primary" icon="clock" label="Lần trước" /> : null}
        </View>
        <Txt variant="caption" color="text2">
          {desc}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  topRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  thumb: {
    width: 88,
    minHeight: 112,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  sep: { height: 1, marginVertical: 4 },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
    columnGap: 16,
    marginTop: 4,
  },
  stat: { width: '46%', gap: 0 },
  divider: { height: StyleSheet.hairlineWidth },
  choice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    minHeight: 72,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
});
