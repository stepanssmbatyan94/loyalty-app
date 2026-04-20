import { create } from 'zustand';

interface AuthStore {
  token: string | null;
  isAuthLoading: boolean;
  authError: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  setAuthLoading: (loading: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  isAuthLoading: true,
  authError: null,
  setToken: (token) => set({ token, isAuthLoading: false, authError: null }),
  clearToken: () => set({ token: null, isAuthLoading: false }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
  setAuthError: (error) => set({ authError: error, isAuthLoading: false }),
}));
