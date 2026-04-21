import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getRewardTranslationsQueryOptions } from './get-reward-translations';

export type RewardTranslationEntry = {
  locale: string;
  field: 'name' | 'description';
  value: string;
};

export type UpdateRewardTranslationsDTO = {
  rewardId: string;
  translations: RewardTranslationEntry[];
};

export const updateRewardTranslations = ({ rewardId, translations }: UpdateRewardTranslationsDTO): Promise<void> =>
  api.put(`/rewards/${rewardId}/translations`, { translations });

type UseUpdateRewardTranslationsOptions = {
  mutationConfig?: MutationConfig<typeof updateRewardTranslations>;
};

export const useUpdateRewardTranslations = ({ mutationConfig }: UseUpdateRewardTranslationsOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    onSuccess: (data, variables, ...rest) => {
      queryClient.invalidateQueries({
        queryKey: getRewardTranslationsQueryOptions(variables.rewardId).queryKey,
      });
      onSuccess?.(data, variables, ...rest);
    },
    ...restConfig,
    mutationFn: updateRewardTranslations,
  });
};
