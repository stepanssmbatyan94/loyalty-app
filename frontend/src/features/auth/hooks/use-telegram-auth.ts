'use client';

import { useEffect } from 'react';

import { refreshTokenApi } from '@/features/auth/api/refresh-token';
import { useAuthStore } from '@/stores/auth-store';

import { telegramAuth } from '../api/telegram-auth';

export function useTelegramAuth() {
  const {
    token,
    refreshToken,
    tokenExpires,
    setSession,
    setAuthLoading,
    setAuthError,
  } = useAuthStore();

  useEffect(() => {
    async function init() {
      // 1. Valid token already in store (hydrated from localStorage) — nothing to do.
      const BUFFER_MS = 60_000;
      if (token && tokenExpires && tokenExpires > Date.now() + BUFFER_MS) {
        setAuthLoading(false);
        return;
      }

      // 2. Access token expired but refresh token present — try a silent refresh.
      if (refreshToken) {
        try {
          const refreshed = await refreshTokenApi(refreshToken);
          setSession(
            refreshed.token,
            refreshed.refreshToken,
            refreshed.tokenExpires,
          );
          return;
        } catch {
          // Refresh token also expired — fall through to full Telegram auth.
        }
      }

      // 3. No valid session — perform full Telegram auth.
      const { default: WebApp } = await import('@twa-dev/sdk');
      WebApp.ready();

      const initData = WebApp.initData;
      if (!initData) {
        console.warn(
          '[TelegramAuth] No initData — not running inside Telegram',
        );
        setAuthLoading(false);
        return;
      }

      const unsafe = WebApp.initDataUnsafe;
      const businessId =
        unsafe.start_param ??
        new URLSearchParams(window.location.search).get('startapp') ??
        undefined;

      try {
        const {
          token: newToken,
          refreshToken: newRefresh,
          tokenExpires: newExpires,
          isNew,
        } = await telegramAuth(initData, businessId);
        setSession(newToken, newRefresh, newExpires);

        if (isNew && WebApp.requestContact) {
          WebApp.requestContact();
        }
      } catch (err) {
        console.error('[TelegramAuth] Auth failed:', err);
        setAuthError('authFailed');
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
