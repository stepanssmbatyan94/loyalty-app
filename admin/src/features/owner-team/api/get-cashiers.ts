import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type Cashier = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telegramUserId?: string | null;
  status: { id: number; name: string };
  createdAt: string;
};

export const getCashiers = (): Promise<{ data: Cashier[] }> => {
  return api.get('/users/cashiers');
};

export const getCashiersQueryOptions = () => {
  return queryOptions({
    queryKey: ['cashiers'],
    queryFn: getCashiers,
  });
};

type UseCashiersOptions = {
  queryConfig?: QueryConfig<typeof getCashiers>;
};

export const useCashiers = ({ queryConfig }: UseCashiersOptions = {}) => {
  return useQuery({
    ...getCashiersQueryOptions(),
    ...queryConfig,
  });
};
