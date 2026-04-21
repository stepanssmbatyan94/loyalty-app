import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

import { OwnerReward } from '../types';
import { getOwnerRewardsQueryOptions } from './get-owner-rewards';

export type CreateRewardDTO = {
  name: string;
  description?: string;
  pointsCost: number;
  imageUrl?: string;
  isActive: boolean;
  stock?: number | null;
};

export const createReward = (data: CreateRewardDTO): Promise<OwnerReward> => {
  return api.post('/rewards', data);
};

type UseCreateRewardOptions = {
  mutationConfig?: MutationConfig<typeof createReward>;
};

export const useCreateReward = ({
  mutationConfig,
}: UseCreateRewardOptions = {}) => {
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
    mutationFn: createReward,
  });
};
