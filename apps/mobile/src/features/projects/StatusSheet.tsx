/** Đổi trạng thái dự án (FR-PRJ-04): Báo giá · Đã cọc · Đang gia công · Đã lắp. */
import { Pressable, StyleSheet, View } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { PROJECT_STATUSES, PROJECT_STATUS_BADGE, PROJECT_STATUS_LABELS, type ProjectStatus } from '@/domain/types';
import { Badge, BottomSheet, Icon } from '@/ui';

export function StatusSheet({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: ProjectStatus;
  onChange: (s: ProjectStatus) => void;
  onClose: () => void;
}) {
  const c = useColors();
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Trạng thái dự án">
      {PROJECT_STATUSES.map((s) => {
        const on = s === value;
        return (
          <Pressable
            key={s}
            testID={`status-${s}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={PROJECT_STATUS_LABELS[s]}
            onPress={() => {
              onChange(s);
              onClose();
            }}
            style={({ pressed }) => [
              styles.opt,
              { borderColor: on ? c.primary : c.divider, borderWidth: on ? 2 : 1, backgroundColor: pressed ? c.surface2 : 'transparent' },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Badge label={PROJECT_STATUS_LABELS[s]} icon={PROJECT_STATUS_BADGE[s].icon} tone={PROJECT_STATUS_BADGE[s].tone} />
            </View>
            {on ? <Icon name="check" color={c.primary} /> : null}
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  opt: { minHeight: 56, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
});
