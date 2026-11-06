/**
 * Nhập / sửa bộ cửa (D5 · SRS SCR-04): rộng, cao, số bộ, tham số mẫu, kính, màu, vị trí, ghi chú;
 * bản vẽ và giá cập nhật ngay khi gõ; lỗi hiện ngay dưới ô; còn lỗi thì khóa Lưu (FR-DOR-02…08, BR-11).
 *
 * Lệch artboard (có lý do, ghi ở KE_HOACH_TRIEN_KHAI GĐ 6a):
 * - nhóm ô theo tham số của mẫu cửa (dữ liệu), không theo artboard (kiểu mở, khóa, lõi khóa chưa có trong mẫu);
 * - giá chỉ xem kèm nguồn "Theo Thư viện" – một nguồn giá duy nhất, không sửa giá riêng từng cửa;
 * - không có ảnh công trình (Q6), không có hãng phụ kiện (một hệ nhôm).
 */
import {
  formatArea,
  formatKg,
  formatMeters,
  formatMoney,
  formatMoneyPerM2,
  formatSize,
  glassKey,
  unitPriceForQuote,
  type DoorTemplate,
  type PriceBook,
} from '@matadoor/engine';
import { findSystem, findTemplate, type AluminumColor } from '@matadoor/data';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { now } from '@/db/clock';
import { getDb } from '@/db/client';
import { createDoor, getDoor, listDoors, suggestSymbol, updateDoor } from '@/db/repos/doors';
import { loadDraft } from '@/db/repos/drafts';
import { logEvent } from '@/db/repos/events';
import { listMaterials } from '@/db/repos/materials';
import { getProject } from '@/db/repos/projects';
import { getSetting, setSetting, SETTING_KEYS } from '@/db/repos/settings';
import { getTemplateSnapshot } from '@/db/repos/snapshots';
import {
  copyDoorValues,
  doorValues,
  evaluateDoorForm,
  fieldOrder,
  locationSuggestions,
  newDoorValues,
  toDoorInput,
  type DoorFormValues,
} from '@/domain/doorForm';
import { ValidationError } from '@/domain/errors';
import { loadPriceBook } from '@/domain/pricing';
import type { MaterialRow } from '@/domain/types';
import { useFormGuard } from '@/features/forms/useFormGuard';
import { useColors } from '@/theme/ThemeProvider';
import {
  Badge,
  Body,
  BottomBar,
  BottomSheet,
  Button,
  Chip,
  ChipRow,
  ErrorState,
  Header,
  Icon,
  ListRow,
  Screen,
  SectionTitle,
  Segmented,
  Select,
  SkeletonCard,
  Stepper,
  TextField,
  Txt,
  useSnackbar,
} from '@/ui';
import { ColorField } from './ColorField';
import { DoorDrawing } from './DoorDrawing';

interface Loaded {
  template: DoorTemplate;
  base: DoorFormValues;
  book: PriceBook;
  glassOptions: MaterialRow[];
  usedSymbols: string[];
  locations: string[];
  colors: AluminumColor[];
  projectName: string;
  /** Ký hiệu lúc mở (tiêu đề). */
  title: string;
}

type SectionId = 'info' | 'size' | 'glass' | 'place' | 'price';
const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'info', label: 'Thông tin' },
  { id: 'size', label: 'Kích thước' },
  { id: 'glass', label: 'Kính' },
  { id: 'place', label: 'Vị trí' },
  { id: 'price', label: 'Giá' },
];

function sectionOf(field: string, template: DoorTemplate): SectionId {
  if (field === 'W' || field === 'H' || template.params.some((p) => p.key === field && p.type === 'number')) return 'size';
  if (field.startsWith('glass.')) return 'glass';
  return 'info';
}

export function DoorForm({
  projectId,
  templateId,
  doorId,
  copyFromId,
  startedAt,
}: {
  projectId: string;
  templateId?: string;
  doorId?: string;
  /** Thêm "cửa cùng loại" từ chi tiết cửa (D6): chép tham số, kính, màu, vị trí của bộ này; rộng/cao để trống. */
  copyFromId?: string;
  startedAt?: number;
}) {
  const c = useColors();
  const snack = useSnackbar();
  const editing = !!doorId;
  const draftKey = editing ? `door:edit:${doorId}` : `door:new:${projectId}:${templateId}`;
  const [data, setData] = useState<Loaded | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<DoorFormValues | null>(null);
  const [touched, setTouched] = useState<{ W?: boolean; H?: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [afterSave, setAfterSave] = useState<{ id: string; symbol: string } | null>(null);
  const [width, setWidth] = useState(358);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  /** Vị trí đầu từng mục trong vùng cuộn (để nhảy tới). */
  const [sectionY, setSectionY] = useState<Partial<Record<SectionId, number>>>({});

  // Nạp mẫu (bản chụp đúng phiên bản khi sửa), bảng giá, kính, ký hiệu đã dùng, nháp.
  useEffect(() => {
    let alive = true;
    (async () => {
      const db = await getDb();
      const project = await getProject(db, projectId);
      if (!project || project.deletedAt !== null) throw new Error('Dự án không còn hoặc đã bị xóa.');
      const doors = await listDoors(db, projectId);
      let template: DoorTemplate | null | undefined;
      let base: DoorFormValues;
      let currentGlass: string[] = [];
      if (doorId) {
        const door = await getDoor(db, doorId);
        if (!door || door.deletedAt !== null) throw new Error('Bộ cửa không còn hoặc đã bị xóa.');
        template = (await getTemplateSnapshot(db, door.templateId, door.templateVersion)) ?? findTemplate(door.templateId);
        if (!template) throw new Error(`Không có dữ liệu mẫu ${door.templateId}.`);
        base = doorValues(door, template);
        currentGlass = Object.values(door.glass);
      } else {
        template = templateId ? findTemplate(templateId) : undefined;
        if (!template) throw new Error('Không tìm thấy mẫu cửa đã chọn.');
        const symbol = await suggestSymbol(db, projectId, template.symbolPrefix);
        const source = copyFromId ? await getDoor(db, copyFromId) : null;
        if (source && source.deletedAt === null && source.templateId === template.id) {
          base = copyDoorValues(source, template, symbol);
        } else {
          const lastGlassRaw = await getSetting(db, `${SETTING_KEYS.lastGlassPrefix}${template.id}`);
          const lastColor = [...doors].sort((a, b) => b.updatedAt - a.updatedAt).find((d) => d.color)?.color ?? null;
          base = newDoorValues(template, {
            symbol,
            ...(lastGlassRaw ? { lastGlass: JSON.parse(lastGlassRaw) as Record<string, string> } : {}),
            color: lastColor,
          });
        }
      }
      const glass = (await listMaterials(db, 'kinh')).filter((m) => !m.hidden || currentGlass.includes(m.code));
      // Kính đã nhớ mà nay bị ẩn/xóa thì về kính mặc định của mẫu.
      for (const g of template.glass) {
        const k = glassKey(g.key);
        if (!glass.some((m) => m.code === base.glass[k])) base.glass[k] = g.defaultCode;
      }
      const draft = await loadDraft<DoorFormValues>(db, draftKey);
      const loaded: Loaded = {
        template,
        base,
        book: await loadPriceBook(db),
        glassOptions: glass,
        usedSymbols: doors.filter((d) => d.id !== doorId).map((d) => d.symbol),
        locations: locationSuggestions(doors.map((d) => d.location)),
        colors: findSystem(template.system)?.colors ?? [],
        projectName: project.name,
        title: base.symbol,
      };
      if (!alive) return;
      setData(loaded);
      if (draft && JSON.stringify(draft.value) !== JSON.stringify(base)) {
        setValues({ ...base, ...draft.value });
        snack.show('Đã mở lại phần đang nhập dở');
      } else {
        setValues(base);
      }
    })().catch((e: unknown) => {
      if (alive) setLoadError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      alive = false;
    };
  }, [projectId, templateId, doorId, copyFromId, draftKey, snack]);

  const ev = useMemo(
    () =>
      data && values
        ? evaluateDoorForm(data.template, values, data.book, data.usedSymbols, { W: touched.W || submitted, H: touched.H || submitted })
        : null,
    [data, values, touched, submitted],
  );
  const dirty = !!data && !!values && JSON.stringify(values) !== JSON.stringify(data.base);
  const guard = useFormGuard({ draftKey, values, dirty, ready: !!data && !!values, saving });

  const set = useCallback(<K extends keyof DoorFormValues>(k: K, v: DoorFormValues[K]) => {
    setValues((s) => (s ? { ...s, [k]: v } : s));
  }, []);

  const jumpTo = (id: SectionId) => {
    const y = sectionY[id];
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };

  const firstError = () => {
    if (!ev || !data) return;
    const f = fieldOrder(data.template).find((k) => ev.errors[k]);
    jumpTo(f ? sectionOf(f, data.template) : 'price');
  };

  const save = async () => {
    if (!data || !values || !ev) return;
    if (!ev.canSave) {
      setSubmitted(true);
      firstError();
      return;
    }
    setSaving(true);
    try {
      const db = await getDb();
      const input = toDoorInput(data.template, values, ev);
      if (doorId) {
        await updateDoor(db, doorId, input);
        await guard.markSaved();
        snack.show(`Đã lưu bộ cửa ${input.symbol}`, { tone: 'success' });
        if (router.canGoBack()) router.back();
        else router.replace(`/du-an/${projectId}`);
        return;
      }
      const door = await createDoor(db, projectId, input);
      await guard.markSaved();
      await setSetting(db, SETTING_KEYS.lastTemplateId, data.template.id);
      await setSetting(db, `${SETTING_KEYS.lastGlassPrefix}${data.template.id}`, JSON.stringify(values.glass));
      await logEvent(db, 'door_saved', {
        projectId,
        doorId: door.id,
        ...(startedAt ? { value: Math.round((now() - startedAt) / 1000) } : {}),
      });
      setSaving(false);
      setAfterSave({ id: door.id, symbol: door.symbol });
    } catch (e) {
      setSaving(false);
      if (e instanceof ValidationError && e.field === 'symbol') {
        setSubmitted(true);
        snack.show(e.message);
      } else {
        snack.show(e instanceof Error ? e.message : 'Không lưu được, hãy thử lại');
      }
    }
  };

  /** Sau khi lưu: nhập tiếp cửa cùng mẫu (giữ tham số, kính, màu; W/H trống; ký hiệu kế tiếp). */
  const addSame = async () => {
    if (!data || !values) return;
    const db = await getDb();
    await setSetting(db, SETTING_KEYS.afterSaveChoice, 'same');
    const doors = await listDoors(db, projectId);
    const next: DoorFormValues = {
      ...newDoorValues(data.template, { symbol: await suggestSymbol(db, projectId, data.template.symbolPrefix), lastGlass: values.glass, color: values.color }),
      params: values.params,
      location: values.location,
    };
    setData({ ...data, base: next, usedSymbols: doors.map((d) => d.symbol), locations: locationSuggestions(doors.map((d) => d.location)), title: next.symbol });
    setValues(next);
    setTouched({});
    setSubmitted(false);
    setAfterSave(null);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const title = editing ? `Sửa bộ cửa ${data?.title ?? ''}` : `Thêm bộ cửa ${values?.symbol ?? ''}`;
  if (loadError) {
    return (
      <Screen>
        <Header title={editing ? 'Sửa bộ cửa' : 'Thêm bộ cửa'} />
        <ErrorState title="Không mở được bộ cửa" message={loadError} onRetry={() => router.back()} />
      </Screen>
    );
  }
  if (!data || !values || !ev) {
    return (
      <Screen>
        <Header title={editing ? 'Sửa bộ cửa' : 'Thêm bộ cửa'} backLabel="Hủy" />
        <Body>
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </Body>
      </Screen>
    );
  }

  const t = data.template;
  const r = ev.result;
  const choiceParams = t.params.filter((p) => p.type === 'choice');
  const numberParams = t.params.filter((p) => p.type === 'number');
  const numParams = Object.fromEntries(t.params.map((p) => [p.key, Number(String(values.params[p.key] ?? p.default).replace(',', '.'))]));
  const unit = r && r.ok ? unitPriceForQuote(r) : null;
  const sectionLayout = (id: SectionId) => (e: { nativeEvent: { layout: { y: number } } }) => {
    const y = e.nativeEvent.layout.y;
    setSectionY((cur) => (cur[id] === y ? cur : { ...cur, [id]: y }));
  };

  return (
    <Screen>
      <Header title={title} backLabel="Hủy" onBack={() => (router.canGoBack() ? router.back() : router.replace(`/du-an/${projectId}`))} />
      <View style={{ paddingTop: 8, paddingBottom: 4 }}>
        <ChipRow>
          {SECTIONS.map((s) => (
            <Chip key={s.id} label={s.label} selected={false} onPress={() => jumpTo(s.id)} testID={`jump-${s.id}`} />
          ))}
        </ChipRow>
      </View>
      <Body ref={scroll} onLayout={(e) => setWidth(Math.min(720, e.nativeEvent.layout.width) - 32)}>
        <View onLayout={sectionLayout('info')} style={{ gap: 12 }}>
          <View style={[styles.templateRow, { backgroundColor: c.surface, borderColor: c.divider }]}>
            <Icon name="door" color={c.text2} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{t.name}</Txt>
              <Txt variant="caption" color="text2">
                {findSystem(t.system)?.name ?? t.system} · {data.projectName}
              </Txt>
            </View>
            {!editing ? (
              <Button kind="ghost" compact label="Đổi mẫu" testID="change-template" onPress={() => router.replace(`/du-an/${projectId}/them-cua`)} />
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/mau/[templateId]', params: { templateId: t.id, v: String(t.version) } })}
            accessibilityRole="link"
            accessibilityLabel="Xem thông số hệ của mẫu: công thức cắt, khe hở, giới hạn"
            style={styles.specLink}
            testID="open-template-spec"
          >
            <Icon name="ruler" color={c.primary} size={20} />
            <Txt variant="bodyStrong" style={{ color: c.primary }}>
              Xem thông số hệ
            </Txt>
          </Pressable>
          <SectionTitle>Thông tin chung</SectionTitle>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextField
                testID="field-symbol"
                label="Ký hiệu"
                required
                value={values.symbol}
                onChangeText={(v) => set('symbol', v)}
                error={ev.errors.symbol}
                maxLength={12}
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Stepper label="Số bộ" value={values.qty} onChange={(v) => set('qty', v)} min={1} max={999} testID="field-qty" />
            </View>
          </View>
          {choiceParams.map((p) =>
            (p.options?.length ?? 0) <= 3 ? (
              <View key={p.key} style={{ gap: 6 }}>
                <Txt variant="label">{p.label}</Txt>
                <Segmented
                  accessibilityLabel={p.label}
                  value={values.params[p.key] ?? String(p.default)}
                  onChange={(v) => set('params', { ...values.params, [p.key]: v })}
                  options={(p.options ?? []).map((o) => ({ value: String(o.value), label: o.label }))}
                />
                {ev.errors[p.key] ? (
                  <Txt variant="caption" color="error">
                    {ev.errors[p.key]}
                  </Txt>
                ) : null}
              </View>
            ) : (
              <Select
                key={p.key}
                label={p.label}
                value={values.params[p.key] ?? String(p.default)}
                onChange={(v) => set('params', { ...values.params, [p.key]: v })}
                options={(p.options ?? []).map((o) => ({ value: String(o.value), label: o.label }))}
                error={ev.errors[p.key]}
              />
            ),
          )}
          <ColorField value={values.color} colors={data.colors} onChange={(v) => set('color', v)} />
        </View>

        <View onLayout={sectionLayout('size')} style={{ gap: 12 }}>
          <SectionTitle>Kích thước</SectionTitle>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextField
                testID="field-W"
                label="Rộng (W)"
                required
                unit="mm"
                kind="decimal"
                value={values.W}
                placeholder="Nhập số"
                onChangeText={(v) => set('W', v)}
                onBlur={() => setTouched((s) => ({ ...s, W: true }))}
                error={ev.errors.W}
                warning={ev.warnings.W}
                maxLength={7}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextField
                testID="field-H"
                label="Cao (H)"
                required
                unit="mm"
                kind="decimal"
                value={values.H}
                placeholder="Nhập số"
                onChangeText={(v) => set('H', v)}
                onBlur={() => setTouched((s) => ({ ...s, H: true }))}
                error={ev.errors.H}
                warning={ev.warnings.H}
                maxLength={7}
              />
            </View>
          </View>
          {numberParams.map((p) => (
            <TextField
              key={p.key}
              testID={`field-${p.key}`}
              label={p.label}
              unit={p.unit}
              kind="decimal"
              value={values.params[p.key] ?? ''}
              onChangeText={(v) => set('params', { ...values.params, [p.key]: v })}
              error={ev.errors[p.key]}
              warning={ev.warnings[p.key]}
              hint={p.hint ?? (p.min !== undefined && p.max !== undefined ? `Từ ${p.min} đến ${p.max}${p.unit ? ` ${p.unit}` : ''}` : undefined)}
              maxLength={6}
            />
          ))}
          <View style={[styles.drawing, { backgroundColor: c.surface, borderColor: c.divider }]}>
            <DoorDrawing template={t} W={ev.input?.W ?? null} H={ev.input?.H ?? null} params={numParams} width={Math.max(200, width - 26)} />
            <Txt variant="caption" color="text2" tabular>
              {r ? `Diện tích 1 bộ ${formatArea(r.areaPerSet, 2)}` : 'Diện tích · nhập rộng và cao'}
            </Txt>
          </View>
        </View>

        <View onLayout={sectionLayout('glass')} style={{ gap: 12 }}>
          <SectionTitle>Kính</SectionTitle>
          {t.glass.map((g) => {
            const k = glassKey(g.key);
            const line = r?.glass.find((x) => x.key === k);
            return (
              <View key={k} style={{ gap: 6 }}>
                <Select
                  testID={`field-glass-${k}`}
                  label={t.glass.length > 1 ? g.label : 'Loại kính'}
                  value={values.glass[k] ?? g.defaultCode}
                  onChange={(v) => set('glass', { ...values.glass, [k]: v })}
                  error={ev.errors[`glass.${k}`]}
                  options={data.glassOptions.map((m) => ({
                    value: m.code,
                    label: m.name,
                    description: `${m.thicknessMm ? `${m.thicknessMm} ly · ` : ''}${formatMoneyPerM2(data.book[m.code]?.costPrice ?? m.costPrice)} (giá gốc)${m.hidden ? ' · đã ẩn' : ''}`,
                  }))}
                />
                {line ? (
                  <Txt variant="caption" color="text2" tabular>
                    {formatSize(line.width, line.height)} · {line.qtyPerSet} tấm/bộ · {formatKg(line.weightEach)}/tấm
                  </Txt>
                ) : null}
              </View>
            );
          })}
        </View>

        <View onLayout={sectionLayout('place')} style={{ gap: 12 }}>
          <SectionTitle>Vị trí & ghi chú</SectionTitle>
          <TextField testID="field-location" label="Vị trí lắp" icon="pin" value={values.location} onChangeText={(v) => set('location', v)} placeholder="Ví dụ: Tầng 2 – P. ngủ" maxLength={200} />
          <View style={styles.chips}>
            {data.locations.map((l) => (
              <Chip key={l} label={l} selected={values.location === l} onPress={() => set('location', values.location === l ? '' : l)} />
            ))}
          </View>
          <TextField
            testID="field-note"
            label="Ghi chú"
            value={values.note}
            onChangeText={(v) => set('note', v)}
            placeholder="Chỉ xưởng xem, không in lên báo giá"
            multiline
            maxLength={200}
          />
        </View>

        {ev.general.length > 0 ? (
          <View style={{ gap: 8 }} testID="checks">
            <SectionTitle>Kiểm tra kỹ thuật</SectionTitle>
            {ev.general.map((g, i) => (
              <Badge
                key={`${g.id}-${i}`}
                tone={g.level === 'error' ? 'error' : g.level === 'warning' ? 'warning' : 'info'}
                icon={g.level === 'info' ? 'info' : 'alert'}
                label={g.message}
              />
            ))}
          </View>
        ) : null}

        <View onLayout={sectionLayout('price')} style={{ gap: 8 }}>
          <SectionTitle>Giá theo Thư viện</SectionTitle>
          {r && r.dataErrors.length === 0 ? (
            <View style={[styles.price, { backgroundColor: c.surface, borderColor: c.divider }]}>
              <PriceRow label="Nhôm" value={formatMoney(r.cost.nhom / r.qty)} meta={`${r.profiles.reduce((a, p) => a + p.qtyPerSet, 0)} thanh · ${formatMeters(r.profiles.reduce((a, p) => a + p.totalM, 0) / r.qty)}`} />
              <PriceRow label="Kính" value={formatMoney(r.cost.kinh / r.qty)} />
              <PriceRow label="Phụ kiện" value={formatMoney(r.cost.phukien / r.qty)} meta={`${r.accessories.length} mã`} />
              <PriceRow label="Nhân công" value={formatMoney(r.cost.nhancong / r.qty)} meta={formatArea(r.areaPerSet, 2)} />
              <View style={[styles.sep, { backgroundColor: c.divider }]} />
              <PriceRow label="Giá vốn 1 bộ" value={formatMoney(r.costPerSet)} />
              <PriceRow label="Giá bán 1 bộ" value={unit !== null ? formatMoney(unit) : '—'} strong />
              <Txt variant="caption" color="text2">
                Giá lấy từ Thư viện (giá gốc × hệ số nhóm). Sửa giá ở Thư viện – mọi bộ cửa cùng đổi theo.
              </Txt>
            </View>
          ) : (
            <Txt color="text2">Nhập đủ kích thước để tính giá.</Txt>
          )}
        </View>
      </Body>

      <BottomBar>
        {ev.errorCount > 0 ? (
          <Pressable onPress={firstError} accessibilityRole="button" accessibilityLabel={`Còn ${ev.errorCount} ô cần sửa, xem`} style={styles.barInfo} testID="error-summary">
            <Icon name="alert" color={c.error} />
            <Txt variant="bodyStrong" color="error" style={{ flex: 1 }}>
              Còn {ev.errorCount} ô cần sửa
            </Txt>
            <Txt variant="bodyStrong" style={{ color: c.primary }}>
              Xem
            </Txt>
          </Pressable>
        ) : (
          <View style={styles.barInfo}>
            <Txt variant="caption" color="text2" style={{ flex: 1 }} tabular>
              {r ? `Tạm tính · ${values.qty} bộ · ${formatArea(r.area, 2)}` : 'Tạm tính · chưa đủ kích thước'}
            </Txt>
            <Txt variant="section" weight="bold" tabular testID="door-total">
              {unit !== null ? formatMoney(unit * values.qty) : '—'}
            </Txt>
          </View>
        )}
        <Button testID="save-door" label="Lưu bộ cửa" icon="check" loading={saving} disabled={ev.errorCount > 0} onPress={save} />
      </BottomBar>

      <BottomSheet visible={afterSave !== null} onClose={() => router.back()} title={`Đã lưu bộ cửa ${afterSave?.symbol ?? ''}`}>
        <ListRow icon="copy" title="Thêm cửa cùng loại" subtitle="Giữ mẫu, tham số, kính, màu; chỉ nhập kích thước" onPress={addSame} testID="after-same" />
        <ListRow
          icon="door"
          title="Thêm cửa khác loại"
          subtitle="Chọn lại mẫu cửa"
          testID="after-other"
          onPress={() => {
            setAfterSave(null);
            getDb()
              .then((db) => setSetting(db, SETTING_KEYS.afterSaveChoice, 'other'))
              .catch(() => {});
            router.replace(`/du-an/${projectId}/them-cua`);
          }}
        />
        <ListRow
          icon="file"
          title="Xem bộ cửa vừa lưu"
          subtitle="Chi tiết cắt nhôm, kính, phụ kiện"
          testID="after-view"
          onPress={() => {
            const saved = afterSave;
            setAfterSave(null);
            if (saved) router.replace(`/du-an/${projectId}/cua/${saved.id}`);
          }}
        />
        <ListRow
          icon="check"
          title="Xong, về dự án"
          testID="after-done"
          onPress={() => {
            setAfterSave(null);
            if (router.canGoBack()) router.back();
            else router.replace(`/du-an/${projectId}`);
          }}
        />
      </BottomSheet>
      {guard.dialog}
    </Screen>
  );
}

function PriceRow({ label, value, meta, strong }: { label: string; value: string; meta?: string; strong?: boolean }) {
  return (
    <View style={styles.priceRow}>
      <View style={{ flex: 1 }}>
        <Txt variant={strong ? 'bodyStrong' : 'body'}>{label}</Txt>
        {meta ? (
          <Txt variant="caption" color="text2">
            {meta}
          </Txt>
        ) : null}
      </View>
      <Txt variant={strong ? 'section' : 'bodyStrong'} weight={strong ? 'bold' : undefined} tabular>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, paddingLeft: 12, paddingVertical: 8 },
  drawing: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 8, alignItems: 'center' },
  price: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sep: { height: 1 },
  barInfo: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
  specLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
});
