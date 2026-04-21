const KEY = 'admin_auth_session';

type StoredSession = {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  role: 'owner' | 'superadmin';
};

export const tokenStorage = {
  get(): StoredSession | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  },

  set(session: StoredSession): void {
    localStorage.setItem(KEY, JSON.stringify(session));
  },

  clear(): void {
    localStorage.removeItem(KEY);
  },
};
