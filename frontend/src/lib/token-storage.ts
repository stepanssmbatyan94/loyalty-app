const KEY = 'loyalty_auth_session';

type StoredSession = {
  token: string;
  refreshToken: string;
  tokenExpires: number;
};

export const tokenStorage = {
  get(): StoredSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  },

  set(session: StoredSession): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(session));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY);
  },
};
