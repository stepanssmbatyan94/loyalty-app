'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/stores/auth-store';

import { telegramAuth } from '../api/telegram-auth';

export function useTelegramAuth() {
  const setToken = useAuthStore((s) => s.setToken);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const setAuthError = useAuthStore((s) => s.setAuthError);

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
        setAuthLoading(false);
        return;
      }

      const unsafe = WebApp.initDataUnsafe;

      // start_param is populated from Telegram deep links (t.me/bot/app?startapp=X).
      // For web_app button URLs (?startapp=X in the URL), it's absent from initData —
      // read it from window.location.search as fallback.
      const businessId =
        unsafe.start_param ??
        new URLSearchParams(window.location.search).get('startapp') ??
        undefined;

      try {
        const { token, isNew } = await telegramAuth(initData, businessId);
        setToken(token);

        // First-time user: request phone number sharing
        if (isNew && WebApp.requestContact) {
          WebApp.requestContact();
        }
      } catch (err) {
        console.error('[TelegramAuth] Auth failed:', err);
        setAuthError('authFailed');
      }
    }

    init();
  }, [setToken, setAuthLoading, setAuthError]);
}
