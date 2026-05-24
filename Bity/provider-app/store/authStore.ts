import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProviderProfile } from '../types';

interface AuthState {
  provider: ProviderProfile | null;
  token: string | null;
  isLoading: boolean;
  isOnboarded: boolean;
  setProvider: (p: ProviderProfile) => void;
  setToken: (t: string) => void;
  setOnboarded: (v: boolean) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  provider: null,
  token: null,
  isLoading: true,
  isOnboarded: false,

  setProvider: (provider) => {
    set({ provider });
    AsyncStorage.setItem('bity_provider', JSON.stringify(provider));
  },

  setToken: (token) => {
    set({ token });
    AsyncStorage.setItem('bity_provider_token', token);
  },

  setOnboarded: (v) => {
    set({ isOnboarded: v });
    AsyncStorage.setItem('bity_provider_onboarded', v ? '1' : '0');
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['bity_provider_token', 'bity_provider_refresh', 'bity_provider']);
    set({ provider: null, token: null });
  },

  loadFromStorage: async () => {
    try {
      const [token, provStr, onboarded] = await AsyncStorage.multiGet([
        'bity_provider_token',
        'bity_provider',
        'bity_provider_onboarded',
      ]);
      set({
        token: token[1] ?? null,
        provider: provStr[1] ? JSON.parse(provStr[1]) : null,
        isOnboarded: onboarded[1] === '1',
        isLoading: false,
      });

      if (token[1]) {
        try {
          const { api } = await import('../services/api');
          const freshProfile = await api.provider.getProfile();
          set({ provider: freshProfile });
          AsyncStorage.setItem('bity_provider', JSON.stringify(freshProfile));
        } catch (e: any) {
          if (e?.message?.includes('session expired') || e?.message?.includes('log in')) {
            await AsyncStorage.multiRemove(['bity_provider_token', 'bity_provider_refresh', 'bity_provider']);
            set({ provider: null, token: null });
          }
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  refreshProfile: async () => {
    try {
      const { api } = await import('../services/api');
      const freshProfile = await api.provider.getProfile();
      set({ provider: freshProfile });
      AsyncStorage.setItem('bity_provider', JSON.stringify(freshProfile));
    } catch (e: any) {
      if (e?.message?.includes('log in') || e?.status === 401) {
        await AsyncStorage.multiRemove(['bity_provider_token', 'bity_provider_refresh', 'bity_provider']);
        set({ provider: null, token: null });
      }
    }
  },
}));
