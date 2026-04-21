import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { RewardTranslation } from '../types';

export const getRewardTranslations = (
  rewardId: string,
): Promise<{ data: RewardTranslation[] }> => {
  return api.get(`/rewards/${rewardId}/translations`);
};

export const getRewardTranslationsQueryOptions = (rewardId: string) => {
  return queryOptions({
    queryKey: ['reward-translations', rewardId],
    queryFn: () => getRewardTranslations(rewardId),
  });
};

type UseRewardTranslationsOptions = {
  rewardId: string;
  queryConfig?: QueryConfig<typeof getRewardTranslations>;
};

export const useRewardTranslations = ({
  rewardId,
  queryConfig,
}: UseRewardTranslationsOptions) => {
  return useQuery({
    ...getRewardTranslationsQueryOptions(rewardId),
    ...queryConfig,
  });
};
