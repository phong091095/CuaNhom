/**
 * Thanh tab dưới (artboard ProjectList): 3 tab, tab đang mở có viên nền primarySoft 56 × 30,
 * icon luôn kèm nhãn. Cao 64 + vùng an toàn dưới.
 */
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useColors } from '@/theme/ThemeProvider';
import { SIZE } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './Text';

export const TAB_ICONS: Record<string, IconName> = {
  index: 'projects',
  'thu-vien': 'library',
  'cai-dat': 'gear',
};

export function TabBar({ state, descriptors, navigateToTab, insets }: BottomTabBarProps) {
  const c = useColors();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.divider, paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const options = descriptors[route.key]?.options;
        const label = typeof options?.title === 'string' ? options.title : route.name;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => {
              if (!focused) navigateToTab(route.key);
            }}
            style={styles.item}
          >
            <View style={[styles.pill, focused && { backgroundColor: c.primarySoft }]}>
              <Icon name={TAB_ICONS[route.name] ?? 'folder'} color={focused ? c.onPrimarySoft : c.text2} />
            </View>
            <Txt variant="caption" weight={focused ? 'bold' : 'medium'} style={{ color: focused ? c.onPrimarySoft : c.text2 }}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 6, paddingHorizontal: 8, gap: 8 },
  item: { flex: 1, minHeight: SIZE.tabBar - 8, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { width: 56, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
});
