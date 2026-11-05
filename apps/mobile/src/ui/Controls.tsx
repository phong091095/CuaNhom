/**
 * Ô số có stepper, chip lọc, segmented, huy hiệu, thẻ danh sách (Handoff1 mục 3).
 */
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { RADIUS, SIZE, type ColorTokens } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './Text';

// ---------------------------------------------------------------- Stepper

export interface StepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  testID?: string;
}

/** Hai nút 48 × 48, giá trị ở giữa; chạm ngưỡng thì nút mờ. */
export function Stepper({ label, value, onChange, min = 1, max = 999, step = 1, unit, testID }: StepperProps) {
  const c = useColors();
  const canDec = value - step >= min;
  const canInc = value + step <= max;
  const btn = (icon: IconName, enabled: boolean, next: number, a11y: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      accessibilityState={{ disabled: !enabled }}
      onPress={enabled ? () => onChange(next) : undefined}
      style={({ pressed }) => [
        styles.stepBtn,
        { borderColor: c.border, backgroundColor: pressed && enabled ? c.surface2 : c.surface, opacity: enabled ? 1 : 0.45 },
      ]}
    >
      <Icon name={icon} color={c.text} />
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }} testID={testID}>
      <Txt variant="label">{label}</Txt>
      <View style={styles.stepRow} accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ now: value, min, max }}>
        {btn('minus', canDec, value - step, `Giảm ${label.toLowerCase()}`)}
        <View style={styles.stepValue}>
          <Txt variant="section" tabular>
            {value}
          </Txt>
          {unit ? <Txt color="text2">{unit}</Txt> : null}
        </View>
        {btn('plus', canInc, value + step, `Tăng ${label.toLowerCase()}`)}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- Chip

/** Chip lọc: cao 48, bo tròn; bật = nền primarySoft + dấu tích. */
export function Chip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? c.primarySoft : pressed ? c.surface2 : c.surface,
          borderColor: selected ? c.primarySoft : c.border,
        },
      ]}
    >
      {selected ? <Icon name="check" color={c.onPrimarySoft} size={18} /> : null}
      <Txt variant="label" style={{ color: selected ? c.onPrimarySoft : c.text }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Dải chip cuộn ngang. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
      {children}
    </ScrollView>
  );
}

// ---------------------------------------------------------------- Segmented

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** Segmented cao 56, nút con 48; lựa chọn đang bật nổi lên (nền surface). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel: string;
}) {
  const c = useColors();
  return (
    <View style={[styles.seg, { backgroundColor: c.surface2 }]} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={[styles.segBtn, on && { backgroundColor: c.surface, borderColor: c.divider, borderWidth: 1 }]}
          >
            <Txt variant="bodyStrong" weight={on ? 'bold' : 'medium'} color={on ? 'text' : 'text2'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------- Badge

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

function toneColors(c: ColorTokens, tone: BadgeTone): { bg: string; fg: string } {
  switch (tone) {
    case 'primary':
      return { bg: c.primarySoft, fg: c.onPrimarySoft };
    case 'success':
      return { bg: c.successSoft, fg: c.success };
    case 'warning':
      return { bg: c.warningSoft, fg: c.warning };
    case 'error':
      return { bg: c.errorSoft, fg: c.error };
    case 'info':
      return { bg: c.infoSoft, fg: c.info };
    default:
      return { bg: c.surface2, fg: c.text2 };
  }
}

/** Huy hiệu: luôn icon + chữ (không dùng màu làm tín hiệu duy nhất). */
export function Badge({ label, icon, tone = 'neutral', onPress }: { label: string; icon: IconName; tone?: BadgeTone; onPress?: () => void }) {
  const c = useColors();
  const t = toneColors(c, tone);
  const body = (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Icon name={icon} color={t.fg} size={18} />
      <Txt variant="captionStrong" style={{ color: t.fg }}>
        {label}
      </Txt>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} style={{ minHeight: SIZE.touch, justifyContent: 'center' }}>
      {body}
    </Pressable>
  );
}

// ---------------------------------------------------------------- Card

/** Thẻ danh sách: viền divider 1 px (E0), bo 16; nhấn = nền surface2; đang chọn = viền 2 px primary. */
export function Card({
  children,
  onPress,
  onLongPress,
  selected,
  accessibilityLabel,
  testID,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const base = [
    styles.card,
    {
      backgroundColor: c.surface,
      borderColor: selected ? c.primary : c.divider,
      borderWidth: selected ? 2 : 1,
      padding: selected ? 15 : 16,
    },
    style,
  ];
  if (!onPress && !onLongPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [...base, pressed && { backgroundColor: c.surface2 }]}
    >
      {children}
    </Pressable>
  );
}

/** Dòng danh sách trong thẻ/nhóm: icon + tiêu đề + mô tả + giá trị/mũi tên. Cao ≥ 56. */
export function ListRow({
  title,
  subtitle,
  icon,
  value,
  onPress,
  chevron = !!onPress,
  testID,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  testID?: string;
}) {
  const c = useColors();
  const content = (
    <>
      {icon ? <Icon name={icon} color={c.text2} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="body">{title}</Txt>
        {subtitle ? <Txt variant="caption" color="text2">{subtitle}</Txt> : null}
      </View>
      {value ? (
        <Txt variant="bodyStrong" tabular>
          {value}
        </Txt>
      ) : null}
      {chevron ? <Icon name="chevR" color={c.text2} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.surface2 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: SIZE.touch,
    height: SIZE.touch,
    borderRadius: RADIUS.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', gap: 6 },
  chip: {
    minHeight: SIZE.chip,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seg: { minHeight: SIZE.segmented, borderRadius: RADIUS.input, padding: 4, flexDirection: 'row', gap: 4 },
  segBtn: { flex: 1, minHeight: SIZE.touch, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: RADIUS.pill,
  },
  card: { borderRadius: RADIUS.card },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
});
