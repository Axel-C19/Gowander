import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'en' | 'es' | 'fr' | 'de';

const THEME_KEY = 'gowander_theme_mode';
const LANGUAGE_KEY = 'gowander_language';

interface SettingsState {
  themeMode: ThemeMode;
  language: Language;
  hydrated: boolean;

  setThemeMode: (mode: ThemeMode) => void;
  setLanguage: (lang: Language) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: 'system',
  language: 'en',
  hydrated: false,

  setThemeMode: (themeMode) => {
    set({ themeMode });
    SecureStore.setItemAsync(THEME_KEY, themeMode).catch(() => {});
  },

  setLanguage: (language) => {
    set({ language });
    SecureStore.setItemAsync(LANGUAGE_KEY, language).catch(() => {});
  },

  hydrate: async () => {
    try {
      const [theme, lang] = await Promise.all([
        SecureStore.getItemAsync(THEME_KEY),
        SecureStore.getItemAsync(LANGUAGE_KEY),
      ]);
      set({
        themeMode: (theme as ThemeMode) ?? 'system',
        language: (lang as Language) ?? 'en',
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },
}));
