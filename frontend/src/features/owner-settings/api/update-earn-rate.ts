import { useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export type UpdateEarnRateDTO = {
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';
  earnRateValue: number;
};

export const updateEarnRate = (data: UpdateEarnRateDTO) => {
  return api.patch('/businesses/me/settings', data);
};

type UseUpdateEarnRateOptions = {
  mutationConfig?: MutationConfig<typeof updateEarnRate>;
};

export const useUpdateEarnRate = ({
  mutationConfig,
}: UseUpdateEarnRateOptions = {}) => {
  return useMutation({
    ...mutationConfig,
    mutationFn: updateEarnRate,
  });
};
