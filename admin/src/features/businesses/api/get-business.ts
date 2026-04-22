import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Business } from '@/types/api';

export const getBusiness = (id: string): Promise<Business> =>
  api.get(`/admin/businesses/${id}`);

export const getBusinessQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['admin-business', id],
    queryFn: () => getBusiness(id),
  });

type UseBusinessOptions = { id: string; queryConfig?: QueryConfig<typeof getBusiness> };

export const useBusiness = ({ id, queryConfig }: UseBusinessOptions) =>
  useQuery({ ...getBusinessQueryOptions(id), ...queryConfig });
