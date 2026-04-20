import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { Reward } from '../types';

export const getRewards = (): Promise<Reward[]> => api.get('/api/v1/rewards');

export const getRewardsQueryOptions = () =>
  queryOptions({
    queryKey: ['rewards'],
    queryFn: getRewards,
  });

type UseRewardsOptions = {
  queryConfig?: QueryConfig<typeof getRewardsQueryOptions>;
};

export const useRewards = ({ queryConfig }: UseRewardsOptions = {}) =>
  useQuery({ ...getRewardsQueryOptions(), ...queryConfig });
