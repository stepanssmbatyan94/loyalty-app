import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { DashboardData } from '../types';

export const getDashboard = (): Promise<DashboardData> => {
  return api.get('/analytics/dashboard');
};

export const getDashboardQueryOptions = () => {
  return queryOptions({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getDashboard,
  });
};

type UseDashboardOptions = {
  queryConfig?: QueryConfig<typeof getDashboard>;
};

export const useDashboard = ({ queryConfig }: UseDashboardOptions = {}) => {
  return useQuery({
    ...getDashboardQueryOptions(),
    ...queryConfig,
  });
};
