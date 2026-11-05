/**
 * Ô nhập (Handoff1): cao 52, nhãn 14 Medium phía trên, đơn vị nằm trong ô,
 * lỗi = viền 2 px màu error + dòng lỗi ngay dưới ô, chỉ đọc = nền surface2.
 */
import { forwardRef, useState, type ComponentRef } from 'react';
import { Platform, StyleSheet, TextInput, View, type KeyboardTypeOptions, type TextInputProps, type TextStyle } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { FONT_FAMILY, RADIUS, SIZE } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'onChange'> {
  label: string;
  value: string;
  onChangeText?: (s: string) => void;
  /** Đơn vị hiện trong ô, ví dụ "mm", "%", "đ". */
  unit?: string;
  error?: string | null;
  /** Nhắc nhưng không chặn lưu (màu cảnh báo, viền thường). */
  warning?: string | null;
  hint?: string;
  required?: boolean;
  readOnly?: boolean;
  /** Bàn phím: "decimal" cho kích thước, %, đơn giá (có dấu phẩy); "phone" cho SĐT. */
  kind?: 'text' | 'decimal' | 'integer' | 'phone';
  /** Icon đầu ô (artboard B2: tên dự án, địa chỉ, SĐT). */
  icon?: IconName;
}

const KEYBOARD: Record<NonNullable<TextFieldProps['kind']>, KeyboardTypeOptions> = {
  text: 'default',
  decimal: 'decimal-pad',
  integer: 'number-pad',
  phone: 'phone-pad',
};

export const TextField = forwardRef<ComponentRef<typeof TextInput>, TextFieldProps>(function TextField(
  { label, value, onChangeText, unit, error, warning, hint, required, readOnly, kind = 'text', icon, testID, onFocus, onBlur, ...rest },
  ref,
) {
  const c = useColors();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? c.error : focused ? c.primary : c.border;
  const borderWidth = error || focused ? 2 : 1;
  return (
    <View style={styles.wrap}>
      <Txt variant="label" color="text">
        {label}
        {required ? <Txt variant="label" color="error"> *</Txt> : null}
      </Txt>
      <View
        style={[
          styles.box,
          {
            borderColor,
            borderWidth,
            backgroundColor: readOnly ? c.surface2 : c.surface,
            paddingHorizontal: 14 - (borderWidth - 1),
          },
        ]}
      >
        {icon ? <Icon name={icon} color={c.text2} /> : null}
        <TextInput
          ref={ref}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          editable={!readOnly}
          keyboardType={KEYBOARD[kind]}
          accessibilityLabel={label}
          accessibilityHint={error ?? warning ?? hint}
          placeholderTextColor={c.text2}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, WEB_NO_OUTLINE, { color: c.text, fontFamily: FONT_FAMILY.regular }]}
          {...(kind === 'phone' ? { textContentType: 'telephoneNumber' as const, autoComplete: 'tel' as const } : {})}
          {...rest}
        />
        {unit ? (
          <Txt variant="body" color="text2">
            {unit}
          </Txt>
        ) : null}
      </View>
      {error ? (
        <View style={styles.msg} accessibilityLiveRegion="polite">
          <Icon name="alert" color={c.error} size={18} />
          <Txt variant="caption" color="error" style={{ flex: 1 }}>
            {error}
          </Txt>
        </View>
      ) : warning ? (
        <View style={styles.msg} accessibilityLiveRegion="polite">
          <Icon name="info" color={c.warning} size={18} />
          <Txt variant="caption" color="warning" style={{ flex: 1 }}>
            {warning}
          </Txt>
        </View>
      ) : hint ? (
        <Txt variant="caption" color="text2">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
});

/** Bỏ viền focus mặc định của trình duyệt (ô đã có viền focus riêng) – chỉ web. */
const WEB_NO_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  box: {
    minHeight: SIZE.control,
    borderRadius: RADIUS.input,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, lineHeight: 22, paddingVertical: 12, minWidth: 0 },
  msg: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
});
