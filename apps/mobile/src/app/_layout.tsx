import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { openAppDatabase } from '@/db/client';
import { logEvent } from '@/db/repos/events';
import { getSetting, setSetting, SETTING_KEYS } from '@/db/repos/settings';
import { AppThemeProvider, isThemeMode, useAppTheme, type ThemeMode } from '@/theme/ThemeProvider';
import { ErrorState, SnackbarProvider } from '@/ui';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Root() {
  const { colors, dark } = useAppTheme();
  return (
    <SnackbarProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </SnackbarProvider>
  );
}

type Boot = { state: 'loading' } | { state: 'ready'; themeMode: ThemeMode } | { state: 'error'; message: string };

/** Mở DB (migrate, đồng bộ dữ liệu gói kèm, dọn thùng rác) trong lúc splash còn hiện. */
function useBoot(): [Boot, () => void] {
  const [boot, setBoot] = useState<Boot>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { db } = await openAppDatabase();
      const saved = await getSetting(db, SETTING_KEYS.themeMode);
      await logEvent(db, 'app_open');
      if (alive) setBoot({ state: 'ready', themeMode: isThemeMode(saved) ? saved : 'system' });
    })().catch((e: unknown) => {
      if (alive) setBoot({ state: 'error', message: e instanceof Error ? e.message : String(e) });
    });
    return () => {
      alive = false;
    };
  }, [attempt]);
  const retry = useCallback(() => {
    setBoot({ state: 'loading' });
    setAttempt((a) => a + 1);
  }, []);
  return [boot, retry];
}

async function saveThemeMode(m: ThemeMode) {
  try {
    const { db } = await openAppDatabase();
    await setSetting(db, SETTING_KEYS.themeMode, m);
  } catch {
    // Không lưu được lựa chọn giao diện thì lần sau dùng mặc định – không chặn người dùng.
  }
}

export default function RootLayout() {
  // Font nạp từ gói kèm app (không tải qua mạng) – chạy được offline (NFR-OFF-01).
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  const [boot, retry] = useBoot();
  const fontsDone = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontsDone && boot.state !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [fontsDone, boot.state]);

  // Chờ font và dữ liệu xong mới vẽ (chữ không nhảy font, màn đầu có dữ liệu ngay).
  if (!fontsDone || boot.state === 'loading') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider initialMode={boot.state === 'ready' ? boot.themeMode : 'system'} onModeChange={saveThemeMode}>
          {boot.state === 'ready' ? (
            <Root />
          ) : (
            <BootError message={boot.message} onRetry={retry} />
          )}
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function BootError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
      <ErrorState title="Không mở được dữ liệu trên máy" message={`${message} Dữ liệu đã lưu không bị xóa.`} onRetry={onRetry} />
    </View>
  );
}
