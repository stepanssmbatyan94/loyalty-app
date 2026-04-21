import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getCashiersQueryOptions } from './get-cashiers';

export const deactivateCashier = (id: string): Promise<void> => {
  return api.patch(`/users/cashiers/${id}/deactivate`);
};

type UseDeactivateCashierOptions = {
  mutationConfig?: MutationConfig<typeof deactivateCashier>;
};

export const useDeactivateCashier = ({ mutationConfig }: UseDeactivateCashierOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getCashiersQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deactivateCashier,
  });
};
