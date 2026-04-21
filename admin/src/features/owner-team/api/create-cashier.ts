import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getCashiersQueryOptions } from './get-cashiers';

export type CreateCashierDTO = {
  firstName: string;
  lastName: string;
  email: string;
  telegramUserId?: string;
};

export const createCashier = (data: CreateCashierDTO) => {
  return api.post('/users/cashiers', data);
};

type UseCreateCashierOptions = {
  mutationConfig?: MutationConfig<typeof createCashier>;
};

export const useCreateCashier = ({ mutationConfig }: UseCreateCashierOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getCashiersQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: createCashier,
  });
};
