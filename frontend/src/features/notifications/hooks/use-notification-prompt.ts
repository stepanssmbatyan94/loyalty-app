const KEY = 'notifications_prompted';

export const notificationPrompt = {
  get(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(KEY) === 'true';
    } catch {
      return false;
    }
  },

  set(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY, 'true');
    } catch {
      // ignore
    }
  },
};
