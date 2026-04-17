'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';

import { telegramAuth } from '../api/telegram-auth';

export function useTelegramAuth() {
  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    async function init() {
      // Dynamically import to avoid SSR issues — @twa-dev/sdk is browser-only
      const { default: WebApp } = await import('@twa-dev/sdk');

      WebApp.ready();

      const initData = WebApp.initData;
      if (!initData) {
        // Running outside Telegram (e.g. local browser) — skip auth
        console.warn(
          '[TelegramAuth] No initData — not running inside Telegram',
        );
        return;
      }

      try {
        const { token, isNew } = await telegramAuth(initData);
        setToken(token);

        // First-time user: request phone number sharing
        if (isNew && WebApp.requestContact) {
          WebApp.requestContact();
        }
      } catch (err) {
        console.error('[TelegramAuth] Auth failed:', err);
      }
    }

    init();
  }, [setToken]);
}
