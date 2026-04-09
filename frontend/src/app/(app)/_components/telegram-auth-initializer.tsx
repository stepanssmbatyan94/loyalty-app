'use client';

import { useTelegramAuth } from '@/features/auth/hooks/use-telegram-auth';

export function TelegramAuthInitializer() {
  useTelegramAuth();
  return null;
}
