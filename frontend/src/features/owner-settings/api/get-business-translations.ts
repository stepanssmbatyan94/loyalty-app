import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';

export type BusinessTranslationEntry = {
  locale: string;
  field: 'name' | 'welcomeMessage' | 'pointsLabel';
  value: string;
};

export const getBusinessTranslations = (): Promise<{
  translations: BusinessTranslationEntry[];
}> => {
  return api.get('/businesses/me/translations');
};

export const getBusinessTranslationsQueryOptions = () => {
  return queryOptions({
    queryKey: ['business-translations'],
    queryFn: getBusinessTranslations,
  });
};

type UseBusinessTranslationsOptions = {
  queryConfig?: QueryConfig<typeof getBusinessTranslations>;
};

export const useBusinessTranslations = ({
  queryConfig,
}: UseBusinessTranslationsOptions = {}) => {
  return useQuery({
    ...getBusinessTranslationsQueryOptions(),
    ...queryConfig,
  });
};
