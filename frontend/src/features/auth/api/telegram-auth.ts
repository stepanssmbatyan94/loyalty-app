import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

type TelegramAuthResponse = {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  isNew: boolean;
  user: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
};

export const telegramAuth = (
  initData: string,
  businessId?: string,
): Promise<TelegramAuthResponse> =>
  api.post('/api/v1/auth/telegram', { initData, businessId });

export const useTelegramAuth = () => useMutation({ mutationFn: telegramAuth });
