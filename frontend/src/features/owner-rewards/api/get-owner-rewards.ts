import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { OwnerReward } from '../types';

export const getOwnerRewards = (): Promise<{ data: OwnerReward[] }> => {
  return api.get('/rewards/owner');
};

export const getOwnerRewardsQueryOptions = () => {
  return queryOptions({
    queryKey: ['owner-rewards'],
    queryFn: getOwnerRewards,
  });
};

type UseOwnerRewardsOptions = {
  queryConfig?: QueryConfig<typeof getOwnerRewards>;
};

export const useOwnerRewards = ({
  queryConfig,
}: UseOwnerRewardsOptions = {}) => {
  return useQuery({
    ...getOwnerRewardsQueryOptions(),
    ...queryConfig,
  });
};
