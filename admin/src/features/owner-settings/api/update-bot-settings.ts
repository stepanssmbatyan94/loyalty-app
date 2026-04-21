import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';

export type UpdateBotSettingsDTO = {
  botToken: string;
  telegramGroupChatId?: string;
};

export type BotSettingsResponse = {
  webhookRegistered: boolean;
  botUsername: string;
  isActive: boolean;
};

export const updateBotSettings = (data: UpdateBotSettingsDTO): Promise<BotSettingsResponse> =>
  api.patch('/businesses/me/bot-settings', data);

type UseUpdateBotSettingsOptions = { mutationConfig?: MutationConfig<typeof updateBotSettings> };

export const useUpdateBotSettings = ({ mutationConfig }: UseUpdateBotSettingsOptions = {}) =>
  useMutation({ ...mutationConfig, mutationFn: updateBotSettings });
