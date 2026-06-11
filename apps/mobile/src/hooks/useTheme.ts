import { useColorScheme } from 'react-native';
import { THEMES, type ThemeColors } from '../constants';
import { useSettingsStore } from '../store/slices/settings.slice';

export function useIsDark(): boolean {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();
  if (themeMode === 'system') return system === 'dark';
  return themeMode === 'dark';
}

/** The active color palette. Re-renders consumers when the theme changes. */
export function useThemeColors(): ThemeColors {
  return THEMES[useIsDark() ? 'dark' : 'light'];
}
