import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

import { LoyaltyCardData } from '../types';

export const getLoyaltyCardMe = (): Promise<LoyaltyCardData> => {
  return api.get('/api/v1/loyalty-cards/me');
};

export const getLoyaltyCardMeQueryOptions = () => {
  return queryOptions({
    queryKey: ['loyalty-cards', 'me'],
    queryFn: getLoyaltyCardMe,
  });
};

type UseLoyaltyCardMeOptions = {
  queryConfig?: QueryConfig<typeof getLoyaltyCardMeQueryOptions>;
};

export const useLoyaltyCardMe = ({
  queryConfig,
}: UseLoyaltyCardMeOptions = {}) => {
  return useQuery({
    ...getLoyaltyCardMeQueryOptions(),
    ...queryConfig,
  });
};
