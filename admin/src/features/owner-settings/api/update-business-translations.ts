import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { BusinessTranslationEntry, getBusinessTranslationsQueryOptions } from './get-business-translations';

export type UpdateBusinessTranslationsDTO = {
  translations: BusinessTranslationEntry[];
};

export const updateBusinessTranslations = (data: UpdateBusinessTranslationsDTO) =>
  api.put('/businesses/me/translations', data);

type UseUpdateBusinessTranslationsOptions = {
  mutationConfig?: MutationConfig<typeof updateBusinessTranslations>;
};

export const useUpdateBusinessTranslations = ({ mutationConfig }: UseUpdateBusinessTranslationsOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};
  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: getBusinessTranslationsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: updateBusinessTranslations,
  });
};
