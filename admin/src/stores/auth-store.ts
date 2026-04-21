import { create } from 'zustand';
import { tokenStorage } from '@/lib/token-storage';

interface AuthStore {
  token: string | null;
  refreshToken: string | null;
  tokenExpires: number | null;
  role: 'owner' | 'superadmin' | null;
  setSession: (
    token: string,
    refreshToken: string,
    tokenExpires: number,
    role: 'owner' | 'superadmin',
  ) => void;
  clearSession: () => void;
}

const stored = tokenStorage.get();

export const useAuthStore = create<AuthStore>((set) => ({
  token: stored?.token ?? null,
  refreshToken: stored?.refreshToken ?? null,
  tokenExpires: stored?.tokenExpires ?? null,
  role: stored?.role ?? null,

  setSession: (token, refreshToken, tokenExpires, role) => {
    tokenStorage.set({ token, refreshToken, tokenExpires, role });
    set({ token, refreshToken, tokenExpires, role });
  },

  clearSession: () => {
    tokenStorage.clear();
    set({ token: null, refreshToken: null, tokenExpires: null, role: null });
  },
}));
