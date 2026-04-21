import { env } from '@/config/env';
import { useAuthStore } from '@/stores/auth-store';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrlWithParams(
  url: string,
  params?: RequestOptions['params'],
): string {
  if (!params) return url;
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null),
  );
  if (Object.keys(filteredParams).length === 0) return url;
  const queryString = new URLSearchParams(
    filteredParams as Record<string, string>,
  ).toString();
  return `${url}?${queryString}`;
}

let refreshingPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;

  refreshingPromise = (async () => {
    const { refreshToken, role, setSession, clearSession } = useAuthStore.getState();
    if (!refreshToken || !role) return false;
    try {
      const r = await fetch(`${env.API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!r.ok) throw new Error('Refresh failed');
      const data = await r.json() as { token: string; refreshToken: string; tokenExpires: number };
      setSession(data.token, data.refreshToken, data.tokenExpires, role);
      return true;
    } catch {
      clearSession();
      return false;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

async function fetchApi<T>(
  url: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const { method = 'GET', headers = {}, body, params } = options;

  const fullUrl = buildUrlWithParams(`${env.API_URL}/api/v1${url}`, params);
  const { token } = useAuthStore.getState();

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (response.status === 401 && !isRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) return fetchApi<T>(url, options, true);
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || response.statusText);
  }

  return response.json();
}

export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'DELETE' });
  },
};
