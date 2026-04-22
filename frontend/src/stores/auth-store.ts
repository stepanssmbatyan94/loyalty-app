import { create } from 'zustand';

import { tokenStorage } from '@/lib/token-storage';

interface AuthStore {
  token: string | null;
  refreshToken: string | null;
  tokenExpires: number | null;
  language: string | null;
  isAuthLoading: boolean;
  authError: string | null;
  setToken: (token: string) => void;
  setSession: (
    token: string,
    refreshToken: string,
    tokenExpires: number,
  ) => void;
  setLanguage: (language: string) => void;
  clearToken: () => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
}

const stored = tokenStorage.get();

export const useAuthStore = create<AuthStore>((set) => ({
  token: stored?.token ?? null,
  refreshToken: stored?.refreshToken ?? null,
  tokenExpires: stored?.tokenExpires ?? null,
  language: stored?.language ?? null,
  isAuthLoading: true,
  authError: null,

  setToken: (token) => set({ token, isAuthLoading: false, authError: null }),

  setSession: (token, refreshToken, tokenExpires) => {
    tokenStorage.set({ token, refreshToken, tokenExpires });
    set({
      token,
      refreshToken,
      tokenExpires,
      isAuthLoading: false,
      authError: null,
    });
  },

  setLanguage: (language) => {
    const current = tokenStorage.get();
    if (current) {
      tokenStorage.set({ ...current, language });
    }
    set({ language });
  },

  clearToken: () => {
    tokenStorage.clear();
    set({
      token: null,
      refreshToken: null,
      tokenExpires: null,
      language: null,
      isAuthLoading: false,
    });
  },

  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setAuthError: (error) => set({ authError: error, isAuthLoading: false }),
}));
