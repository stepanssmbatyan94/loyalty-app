import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { User } from '@/types/api';
import { useAuthStore } from '@/stores/auth-store';
import { api } from './api-client';

export const getUser = async (): Promise<User> => {
  const response = (await api.get('/auth/me')) as { data: User };
  return response.data;
};

const userQueryKey = ['user'];

export const getUserQueryOptions = () =>
  queryOptions({ queryKey: userQueryKey, queryFn: getUser });

export const useUser = () => useQuery(getUserQueryOptions());

export const loginInputSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().min(5, 'Min 5 characters'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const useLogin = ({ onSuccess }: { onSuccess?: (role: 'owner' | 'superadmin') => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const response = await api.post<{
        token: string;
        refreshToken: string;
        tokenExpires: number;
        user: User;
      }>('/auth/email/login', credentials);

      const payload = JSON.parse(atob(response.token.split('.')[1]));
      const role = ((payload.role?.name ?? payload.role) as string)?.toLowerCase();
      if (role !== 'superadmin' && role !== 'owner') {
        throw new Error('Access denied: not an admin account');
      }
      useAuthStore.getState().setSession(
        response.token,
        response.refreshToken,
        response.tokenExpires,
        role as 'owner' | 'superadmin',
      );
      queryClient.setQueryData(userQueryKey, response.user);
      return role as 'owner' | 'superadmin';
    },
    onSuccess,
  });
};

export const useLogout = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<void> => api.post('/auth/logout'),
    onSuccess: () => {
      useAuthStore.getState().clearSession();
      queryClient.removeQueries({ queryKey: userQueryKey });
      onSuccess?.();
    },
    onError: () => {
      useAuthStore.getState().clearSession();
      queryClient.removeQueries({ queryKey: userQueryKey });
      onSuccess?.();
    },
  });
};
