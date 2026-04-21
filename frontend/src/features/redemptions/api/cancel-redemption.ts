import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export const cancelRedemption = (code: string): Promise<{ success: boolean; pointsRefunded: number }> =>
  api.patch(`/api/v1/redemptions/${code}/cancel`);

type UseCancelRedemptionOptions = {
  mutationConfig?: MutationConfig<typeof cancelRedemption>;
};

export const useCancelRedemption = ({ mutationConfig }: UseCancelRedemptionOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig ?? {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-card'] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: cancelRedemption,
  });
};
