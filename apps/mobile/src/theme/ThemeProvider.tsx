/**
 * Chế độ sáng/tối: Theo hệ thống (mặc định) · Sáng · Tối.
 * Lựa chọn sẽ được lưu vào cài đặt ở GĐ 10; hiện giữ trong bộ nhớ.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, type ColorTokens } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeValue {
  colors: ColorTokens;
  dark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function AppThemeProvider({ children, initialMode = 'system' }: { children: ReactNode; initialMode?: ThemeMode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const dark = mode === 'dark' || (mode === 'system' && system === 'dark');
  const value = useMemo<ThemeValue>(() => ({ colors: dark ? DARK : LIGHT, dark, mode, setMode }), [dark, mode]);
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
