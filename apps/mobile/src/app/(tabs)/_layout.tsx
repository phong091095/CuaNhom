/**
 * Thanh tab: Dự án · Thư viện · Cài đặt (KE_HOACH_GIAO_DIEN: "Tài khoản" đổi thành "Cài đặt").
 * Thanh tab chỉ hiện ở 3 màn gốc; màn con mở chồng lên và ẩn thanh tab.
 */
import { Tabs } from 'expo-router/js-tabs';
import { useColors } from '@/theme/ThemeProvider';
import { TabBar } from '@/ui/TabBar';

export default function TabsLayout() {
  const c = useColors();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dự án' }} />
      <Tabs.Screen name="thu-vien" options={{ title: 'Thư viện' }} />
      <Tabs.Screen name="cai-dat" options={{ title: 'Cài đặt' }} />
    </Tabs>
  );
}
