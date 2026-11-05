/**
 * Cài đặt (C1 → SCR-09). GĐ 5: logo, giao diện, Đã xóa gần đây, công cụ bản dev.
 * Thông tin xưởng, mặc định dự án mới, sao lưu/khôi phục làm ở GĐ 10.
 */
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';
import { DATA_VERSION } from '@matadoor/data';
import { getDb } from '@/db/client';
import { createSampleProject } from '@/domain/sampleProject';
import { useAppTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { Body, Card, ListRow, Logo, Screen, ScreenTitle, SectionTitle, Segmented, Txt, useSnackbar } from '@/ui';

export default function SettingsScreen() {
  const { mode, setMode } = useAppTheme();
  const snack = useSnackbar();
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
        <SectionTitle>Dữ liệu</SectionTitle>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <ListRow
            icon="trash"
            title="Đã xóa gần đây"
            subtitle="Khôi phục dự án, bộ cửa trong 30 ngày"
            onPress={() => router.push('/da-xoa')}
            testID="open-trash"
          />
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
              <ListRow
                icon="projects"
                title="Tạo dự án mẫu"
                subtitle="4 bộ cửa, gồm ca TC-07 của đặc tả"
                testID="create-sample"
                onPress={async () => {
                  const p = await createSampleProject(await getDb());
                  snack.show(`Đã tạo “${p.name}”`, { tone: 'success' });
                  router.push(`/du-an/${p.id}`);
                }}
              />
            </Card>
          </>
        ) : null}
      </Body>
    </Screen>
  );
}
