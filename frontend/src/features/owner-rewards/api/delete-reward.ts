import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { getOwnerRewardsQueryOptions } from './get-owner-rewards';

export const deleteReward = (id: string): Promise<void> => {
  return api.delete(`/rewards/${id}`);
};

type UseDeleteRewardOptions = {
  mutationConfig?: MutationConfig<typeof deleteReward>;
};

export const useDeleteReward = ({
  mutationConfig,
}: UseDeleteRewardOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({
        queryKey: getOwnerRewardsQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: deleteReward,
  });
};
