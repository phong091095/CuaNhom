/**
 * Màu nhôm (FR-DOR-05): chỉ ghi nhận, không đổi giá ở MVP. Sheet có ô màu mẫu (artboard D5) và "Màu khác…".
 */
import type { AluminumColor } from '@matadoor/data';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { RADIUS, SIZE } from '@/theme/tokens';
import { BottomSheet, Button, Icon, TextField, Txt } from '@/ui';

export function ColorField({ value, colors, onChange }: { value: string | null; colors: readonly AluminumColor[]; onChange: (v: string | null) => void }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const known = colors.find((x) => x.name === value);
  const pick = (v: string | null) => {
    onChange(v);
    setOpen(false);
  };
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="label">Màu nhôm</Txt>
      <Pressable
        testID="field-color"
        onPress={() => {
          setCustom(value && !known ? value : '');
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Màu nhôm: ${value ?? 'chưa chọn'}`}
        style={({ pressed }) => [styles.box, { borderColor: c.border, backgroundColor: pressed ? c.surface2 : c.surface }]}
      >
        {known ? <View style={[styles.dot, { backgroundColor: known.hex, borderColor: c.border }]} /> : null}
        <Txt color={value ? 'text' : 'text2'} style={{ flex: 1 }} numberOfLines={1}>
          {value ?? 'Chưa chọn (không đổi giá)'}
        </Txt>
        <Icon name="chevD" color={c.text2} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Màu nhôm">
        <Txt variant="caption" color="text2">
          Màu chỉ ghi lên bộ cửa, phiếu cắt và báo giá; không làm đổi giá.
        </Txt>
        {colors.map((x) => {
          const on = x.name === value;
          return (
            <Pressable
              key={x.name}
              testID={`color-${x.name}`}
              onPress={() => pick(x.name)}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={x.name}
              style={({ pressed }) => [
                styles.opt,
                { borderColor: on ? c.primary : c.divider, borderWidth: on ? 2 : 1, backgroundColor: on ? c.primarySoft : pressed ? c.surface2 : 'transparent' },
              ]}
            >
              <View style={[styles.swatch, { backgroundColor: x.hex, borderColor: c.border }]} />
              <Txt variant="bodyStrong" style={{ flex: 1, color: on ? c.onPrimarySoft : c.text }}>
                {x.name}
              </Txt>
              {on ? <Icon name="check" color={c.onPrimarySoft} /> : null}
            </Pressable>
          );
        })}
        <TextField label="Màu khác" value={custom} onChangeText={setCustom} placeholder="Ví dụ: Xám ghi sần" maxLength={40} testID="color-custom" />
        <Button kind="secondary" label="Dùng màu này" disabled={custom.trim() === ''} onPress={() => pick(custom.trim())} />
        {value ? <Button kind="ghost" label="Bỏ chọn màu" onPress={() => pick(null)} /> : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: SIZE.control, borderRadius: RADIUS.input, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1 },
  opt: { minHeight: 56, borderRadius: RADIUS.input, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 12 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
});
