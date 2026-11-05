/**
 * Cài đặt (C1 → SCR-09). GĐ 3: logo, chọn giao diện, lối vào bộ component (chỉ bản dev).
 * Thông tin xưởng, mặc định dự án mới, sao lưu/khôi phục, đã xóa gần đây làm ở GĐ 10.
 */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';
import { DATA_VERSION } from '@matadoor/data';
import { useAppTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { Body, Card, ListRow, Logo, Screen, ScreenTitle, SectionTitle, Segmented, Txt } from '@/ui';

export default function SettingsScreen() {
  const { mode, setMode } = useAppTheme();
  return (
    <Screen>
      <ScreenTitle title="Cài đặt" />
      <Body>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Logo size={56} />
            <View style={{ flex: 1 }}>
              <Txt variant="section">MATADOOR</Txt>
              <Txt variant="caption" color="text2">
                Phiên bản {Constants.expoConfig?.version ?? '—'} · Dữ liệu {DATA_VERSION}
              </Txt>
            </View>
          </View>
        </Card>
        <SectionTitle>Giao diện</SectionTitle>
        <Segmented<ThemeMode>
          accessibilityLabel="Chế độ sáng tối"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'system', label: 'Theo máy' },
            { value: 'light', label: 'Sáng' },
            { value: 'dark', label: 'Tối' },
          ]}
        />
        {__DEV__ ? (
          <>
            <SectionTitle>Công cụ</SectionTitle>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <ListRow
                icon="section"
                title="Bộ component"
                subtitle="So với artboard Hệ thống thiết kế"
                onPress={() => router.push('/dev-components')}
                testID="open-dev-components"
              />
            </Card>
          </>
        ) : null}
      </Body>
    </Screen>
  );
}
