import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Business } from '@/types/api';

export type UpdateBusinessDto = {
  name?: string;
  logoUrl?: string;
  isActive?: boolean;
};

export const updateBusiness = (id: string, dto: UpdateBusinessDto): Promise<Business> =>
  api.patch(`/admin/businesses/${id}`, dto);

export const useUpdateBusiness = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateBusinessDto) => updateBusiness(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
    },
  });
};

export const reregisterWebhook = (id: string): Promise<{ ok: boolean }> =>
  api.post(`/admin/businesses/${id}/webhook`);
