import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { Business, PaginationMeta } from '@/types/api';

type BusinessesResponse = { data: Business[]; meta: PaginationMeta };

export const getBusinesses = (page: number): Promise<BusinessesResponse> =>
  api.get('/admin/businesses', { params: { page, limit: 20 } });

export const getBusinessesQueryOptions = (page: number) =>
  queryOptions({
    queryKey: ['admin-businesses', page],
    queryFn: () => getBusinesses(page),
  });

type UseBusinessesOptions = { page: number; queryConfig?: QueryConfig<typeof getBusinesses> };

export const useBusinesses = ({ page, queryConfig }: UseBusinessesOptions) =>
  useQuery({ ...getBusinessesQueryOptions(page), ...queryConfig });
