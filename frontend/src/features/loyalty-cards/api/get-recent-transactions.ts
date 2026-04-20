import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { ActivityTransaction } from '../types';

export const getRecentTransactions = (): Promise<ActivityTransaction[]> =>
  api.get('/api/v1/transactions', { params: { limit: 2 } });

export const getRecentTransactionsQueryOptions = () =>
  queryOptions({
    queryKey: ['transactions', 'recent'],
    queryFn: getRecentTransactions,
  });

type UseRecentTransactionsOptions = {
  queryConfig?: QueryConfig<typeof getRecentTransactionsQueryOptions>;
};

export const useRecentTransactions = ({
  queryConfig,
}: UseRecentTransactionsOptions = {}) =>
  useQuery({ ...getRecentTransactionsQueryOptions(), ...queryConfig });
