import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import type { Lang } from '../constants/i18n';

interface SettingsState {
  language: Lang;
  setLanguage: (lang: Lang) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',

  setLanguage: async (lang) => {
    await AsyncStorage.setItem('bity_provider_language', lang);
    I18nManager.forceRTL(lang === 'ar');
    set({ language: lang });
  },

  loadFromStorage: async () => {
    try {
      const lang = await AsyncStorage.getItem('bity_provider_language');
      if (lang === 'ar' || lang === 'en') {
        I18nManager.forceRTL(lang === 'ar');
        set({ language: lang });
      }
    } catch {}
  },
}));
