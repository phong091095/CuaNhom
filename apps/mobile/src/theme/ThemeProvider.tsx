/**
 * Chế độ sáng/tối: Theo máy (mặc định) · Sáng · Tối. Lựa chọn lưu ở cài đặt (khóa "themeMode").
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, type ColorTokens } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

export function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'system' || v === 'light' || v === 'dark';
}

interface ThemeValue {
  colors: ColorTokens;
  dark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function AppThemeProvider({
  children,
  initialMode = 'system',
  onModeChange,
}: {
  children: ReactNode;
  initialMode?: ThemeMode;
  /** Gọi khi người dùng đổi chế độ (để lưu). */
  onModeChange?: (m: ThemeMode) => void;
}) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(initialMode);
  const setMode = useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      onModeChange?.(m);
    },
    [onModeChange],
  );
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  const value = useMemo<ThemeValue>(() => ({ colors: dark ? DARK : LIGHT, dark, mode, setMode }), [dark, mode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useAppTheme phải nằm trong AppThemeProvider');
  return v;
}

/** Lối tắt: chỉ lấy bảng màu. */
export function useColors(): ColorTokens {
  return useAppTheme().colors;
}
