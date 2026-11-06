/**
 * Dựng router thật (expo-router/testing-library) với các màn của app, nhưng DB là node:sqlite trong bộ nhớ.
 * Bỏ phần nạp font / mở expo-sqlite của _layout thật; giữ đủ provider (giao diện, snackbar, vùng an toàn).
 */
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ProjectsScreen from '@/app/(tabs)/index';
import TabsLayout from '@/app/(tabs)/_layout';
import SettingsScreen from '@/app/(tabs)/cai-dat';
import LibraryScreen from '@/app/(tabs)/thu-vien';
import TrashScreen from '@/app/da-xoa';
import ProjectDetailScreen from '@/app/du-an/[id]/index';
import EditProjectScreen from '@/app/du-an/[id]/sua';
import NewProjectScreen from '@/app/du-an/moi';
import PickTemplateScreen from '@/app/du-an/[id]/them-cua';
import NewDoorScreen from '@/app/du-an/[id]/cua/moi';
import EditDoorScreen from '@/app/du-an/[id]/cua/[doorId]/sua';
import DoorDetailScreen from '@/app/du-an/[id]/cua/[doorId]/index';
import TemplateSpecScreen from '@/app/mau/[templateId]';
import { setDbForTests } from '@/db/client';
import type { SqlDb } from '@/db/sql';
import { freshDb, installTestClock } from '@/db/testing/setup';
import { useDataRevision } from '@/store/dataRevision';
import { useProjects } from '@/store/projects';
import { AppThemeProvider } from '@/theme/ThemeProvider';
import { SnackbarProvider } from '@/ui';

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

function TestRoot() {
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <AppThemeProvider>
        <SnackbarProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SnackbarProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

export async function setupDb(): Promise<SqlDb> {
  // Store là singleton: đặt lại để ca test trước (ví dụ chữ tìm) không ảnh hưởng ca sau.
  useProjects.setState({ items: [], totals: {}, query: '', loading: false, error: null });
  useDataRevision.setState({ rev: 0 });
  installTestClock(Date.now());
  const db = await freshDb();
  setDbForTests(db);
  return db;
}

export function renderApp(initialUrl = '/') {
  return renderRouter(
    {
      _layout: TestRoot,
      '(tabs)/_layout': TabsLayout,
      '(tabs)/index': ProjectsScreen,
      '(tabs)/thu-vien': LibraryScreen,
      '(tabs)/cai-dat': SettingsScreen,
      'du-an/moi': NewProjectScreen,
      'du-an/[id]/index': ProjectDetailScreen,
      'du-an/[id]/sua': EditProjectScreen,
      'du-an/[id]/them-cua': PickTemplateScreen,
      'du-an/[id]/cua/moi': NewDoorScreen,
      'du-an/[id]/cua/[doorId]/index': DoorDetailScreen,
      'du-an/[id]/cua/[doorId]/sua': EditDoorScreen,
      'mau/[templateId]': TemplateSpecScreen,
      'da-xoa': TrashScreen,
    },
    { initialUrl },
  );
}
