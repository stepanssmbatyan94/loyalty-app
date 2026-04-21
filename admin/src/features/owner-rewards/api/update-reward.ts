import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { OwnerReward } from '../types';
import { getOwnerRewardsQueryOptions } from './get-owner-rewards';

export type UpdateRewardDTO = {
  id: string;
  name?: string;
  description?: string | null;
  pointsCost?: number;
  imageUrl?: string | null;
  isActive?: boolean;
  stock?: number | null;
};

export const updateReward = ({ id, ...data }: UpdateRewardDTO): Promise<OwnerReward> =>
  api.patch(`/rewards/${id}`, data);

type UseUpdateRewardOptions = { mutationConfig?: MutationConfig<typeof updateReward> };

export const useUpdateReward = ({ mutationConfig }: UseUpdateRewardOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getOwnerRewardsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateReward,
  });
};
