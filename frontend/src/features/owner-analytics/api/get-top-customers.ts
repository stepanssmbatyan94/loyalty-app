import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { TopCustomersResponse } from '../types';

type TopCustomersParams = {
  page?: number;
  limit?: number;
};

export const getTopCustomers = (
  params: TopCustomersParams = {},
): Promise<TopCustomersResponse> => {
  return api.get('/analytics/top-customers', { params });
};

export const getTopCustomersQueryOptions = (
  params: TopCustomersParams = {},
) => {
  return queryOptions({
    queryKey: ['analytics', 'top-customers', params],
    queryFn: () => getTopCustomers(params),
  });
};

type UseTopCustomersOptions = {
  params?: TopCustomersParams;
  queryConfig?: QueryConfig<typeof getTopCustomers>;
};

export const useTopCustomers = ({
  params,
  queryConfig,
}: UseTopCustomersOptions = {}) => {
  return useQuery({
    ...getTopCustomersQueryOptions(params),
    ...queryConfig,
  });
};
