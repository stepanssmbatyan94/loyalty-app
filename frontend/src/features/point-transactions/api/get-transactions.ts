import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

import { Transaction, TransactionFilters } from '../types';

const LIMIT = 20;

export const getTransactions = (
  filters: TransactionFilters,
  offset: number,
): Promise<Transaction[]> => {
  return api.get('/api/v1/transactions', {
    params: { offset, limit: LIMIT, ...filters },
  });
};

export const getTransactionsInfiniteQueryOptions = (
  filters: TransactionFilters,
) => {
  return infiniteQueryOptions({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam }) => getTransactions(filters, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < LIMIT) return undefined;
      return allPages.flat().length;
    },
  });
};

export const useTransactions = (filters: TransactionFilters = {}) => {
  return useInfiniteQuery(getTransactionsInfiniteQueryOptions(filters));
};
