import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export type UpdateLanguagesDTO = {
  supportedLocales: string[];
  defaultLocale: string;
};

export const updateLanguages = (data: UpdateLanguagesDTO) => {
  return api.patch('/businesses/me/languages', data);
};

type UseUpdateLanguagesOptions = {
  mutationConfig?: MutationConfig<typeof updateLanguages>;
};

export const useUpdateLanguages = ({
  mutationConfig,
}: UseUpdateLanguagesOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: updateLanguages,
  });
};
