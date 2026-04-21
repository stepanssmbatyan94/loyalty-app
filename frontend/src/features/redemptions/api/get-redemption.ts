import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { RedemptionResponse } from '../types';

export const getRedemption = (id: string): Promise<RedemptionResponse> =>
  api.get(`/api/v1/redemptions/${id}`);

export const getRedemptionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['redemption', id],
    queryFn: () => getRedemption(id),
    refetchInterval: 5000,
  });

type UseRedemptionOptions = {
  queryConfig?: QueryConfig<typeof getRedemption>;
};

export const useRedemption = (id: string, { queryConfig }: UseRedemptionOptions = {}) =>
  useQuery({ ...getRedemptionQueryOptions(id), ...queryConfig });
