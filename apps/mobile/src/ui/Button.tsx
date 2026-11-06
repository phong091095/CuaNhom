/**
 * Nút (Handoff1 mục 3):
 * - primary: nền cam (accent), cao 52 – mỗi lớp (màn, sheet, hộp thoại) chỉ một nút này.
 * - secondary: viền 1 px, chữ màu text.
 * - destructive: nền đỏ (error) – luôn đi kèm hộp xác nhận.
 * - ghost: chỉ chữ màu primary (liên kết, "Sửa", "Hoàn tác").
 * - dangerGhost: chỉ chữ màu error (ví dụ "Xóa hẳn"), luôn kèm hộp xác nhận.
 * Trạng thái: nhấn · vô hiệu (mờ .45 + accessibilityState.disabled) · đang xử lý.
 */
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { RADIUS, SIZE } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './Text';

export type ButtonKind = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'dangerGhost';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Nút nhỏ (cao 48) cho thanh tiêu đề, dòng danh sách. */
  compact?: boolean;
  /** Nhãn đọc cho trình đọc màn hình nếu khác nhãn hiển thị. */
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  compact,
  accessibilityLabel,
  testID,
  style,
}: ButtonProps) {
  const c = useColors();
  const palette = {
    primary: { bg: c.accent, fg: c.onAccent, border: c.accent },
    secondary: { bg: 'transparent', fg: c.text, border: c.border },
    destructive: { bg: c.error, fg: c.onError, border: c.error },
    ghost: { bg: 'transparent', fg: c.primary, border: 'transparent' },
    dangerGhost: { bg: 'transparent', fg: c.error, border: 'transparent' },
  }[kind];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: compact ? SIZE.touch : SIZE.control,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          paddingHorizontal: kind === 'ghost' || kind === 'dangerGhost' ? 8 : 20,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} accessibilityLabel="Đang xử lý" />
      ) : (
        <View style={styles.row}>
          {icon ? <Icon name={icon} color={palette.fg} size={22} /> : null}
          <Txt variant="bodyStrong" style={{ color: palette.fg }} numberOfLines={2} align="center">
            {label}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

/** Nút chỉ có biểu tượng, vùng chạm 48 × 48, luôn có nhãn đọc (thanh tiêu đề, nút ↑ ↓ khi sắp xếp). */
export function IconButton({
  icon,
  label,
  onPress,
  disabled,
  testID,
}: {
  icon: IconName;
  /** Nhãn cho trình đọc màn hình. */
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={4}
      style={({ pressed }) => [styles.icon, { opacity: disabled ? 0.35 : 1 }, pressed && { backgroundColor: c.surface2 }]}
    >
      <Icon name={icon} color={c.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { width: SIZE.touch, height: SIZE.touch, borderRadius: RADIUS.button, alignItems: 'center', justifyContent: 'center' },
  base: {
    borderRadius: RADIUS.button,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
