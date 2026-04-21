import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

type BusinessInfo = {
  botUsername: string;
};

export const getBusinessInfo = (): Promise<BusinessInfo> => {
  return api.get('/api/v1/businesses/customer-info');
};

export const getBusinessInfoQueryOptions = () => {
  return queryOptions({
    queryKey: ['businesses', 'customer-info'],
    queryFn: getBusinessInfo,
  });
};

type UseBusinessInfoOptions = {
  queryConfig?: QueryConfig<typeof getBusinessInfoQueryOptions>;
};

export const useBusinessInfo = ({
  queryConfig,
}: UseBusinessInfoOptions = {}) => {
  return useQuery({
    ...getBusinessInfoQueryOptions(),
    ...queryConfig,
  });
};
