import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { Business } from '@/types/api';

export type CreateBusinessDto = {
  name: string;
  logoUrl?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  botToken: string;
  telegramGroupChatId: string;
  botUsername: string;
};

export const createBusiness = (dto: CreateBusinessDto): Promise<{ business: Business }> =>
  api.post('/admin/businesses', dto);

export const useCreateBusiness = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createBusiness,
    onSuccess: ({ business }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      toast.success('Business created! Owner credentials sent by email.');
      navigate(`/businesses/${business.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create business.');
    },
  });
};
