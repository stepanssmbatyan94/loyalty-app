import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { OwnerReward } from '../types';

export const getOwnerRewards = (): Promise<OwnerReward[]> =>
  api.get('/rewards/owner');

export const getOwnerRewardsQueryOptions = () =>
  queryOptions({ queryKey: ['owner-rewards'], queryFn: getOwnerRewards });

type UseOwnerRewardsOptions = { queryConfig?: QueryConfig<typeof getOwnerRewards> };

export const useOwnerRewards = ({ queryConfig }: UseOwnerRewardsOptions = {}) =>
  useQuery({ ...getOwnerRewardsQueryOptions(), ...queryConfig });
