import { env } from '@/config/env';

export type RefreshResponse = {
  token: string;
  refreshToken: string;
  tokenExpires: number;
};

// Uses raw fetch (not api client) to avoid triggering another 401 intercept loop.
// Backend expects the refresh token as Bearer in Authorization header.
export const refreshTokenApi = (refreshToken: string): Promise<RefreshResponse> =>
  fetch(`${env.API_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refreshToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  }).then((r) => {
    if (!r.ok) throw new Error('Refresh failed');
    return r.json() as Promise<RefreshResponse>;
  });
