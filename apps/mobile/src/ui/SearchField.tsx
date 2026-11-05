/** Ô tìm (artboard B1): cao 48, icon kính lúp, không có nhãn hiện (nhãn cho trình đọc màn hình). */
import { Platform, Pressable, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { FONT_FAMILY, RADIUS } from '@/theme/tokens';
import { Icon } from './Icon';

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  testID,
}: {
  value: string;
  onChangeText: (s: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  testID?: string;
}) {
  const c = useColors();
  return (
    <View style={[styles.box, { borderColor: c.border, backgroundColor: c.surface }]}>
      <Icon name="search" color={c.text2} />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.text2}
        accessibilityLabel={accessibilityLabel}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.input, WEB_NO_OUTLINE, { color: c.text, fontFamily: FONT_FAMILY.regular }]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Xóa nội dung tìm" onPress={() => onChangeText('')} hitSlop={8} style={styles.clear}>
          <Icon name="x" color={c.text2} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Bỏ viền focus mặc định của trình duyệt (ô đã có viền focus riêng) – chỉ web. */
const WEB_NO_OUTLINE = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;

const styles = StyleSheet.create({
  box: { minHeight: 48, borderWidth: 1, borderRadius: RADIUS.input, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12 },
  input: { flex: 1, fontSize: 16, lineHeight: 22, paddingVertical: 10, minWidth: 0 },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
