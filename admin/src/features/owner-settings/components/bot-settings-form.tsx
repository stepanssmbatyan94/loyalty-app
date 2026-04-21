import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { BotSettingsResponse, useUpdateBotSettings } from '../api/update-bot-settings';

const botSettingsSchema = z.object({
  botToken: z.string().min(1, 'Required'),
  telegramGroupChatId: z.string().optional(),
});

type BotSettingsValues = z.infer<typeof botSettingsSchema>;

export function BotSettingsForm() {
  const [result, setResult] = useState<BotSettingsResponse | null>(null);
  const updateMutation = useUpdateBotSettings({
    mutationConfig: { onSuccess: (data) => setResult(data) },
  });

  return (
    <div className="rounded-xl border bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="mb-4 font-label text-base font-semibold text-on-background">Bot Settings</h2>
      <Form
        onSubmit={(values: BotSettingsValues) =>
          updateMutation.mutate({
            ...values,
            telegramGroupChatId: values.telegramGroupChatId || undefined,
          })
        }
        schema={botSettingsSchema}
      >
        {({ register, formState }) => (
          <div className="space-y-4">
            <Input
              type="password"
              label="Bot Token"
              error={formState.errors['botToken']}
              registration={register('botToken')}
            />
            <Input
              label="Telegram Group Chat ID"
              error={formState.errors['telegramGroupChatId']}
              registration={register('telegramGroupChatId')}
            />
            {result && (
              <p
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  result.webhookRegistered
                    ? 'bg-tertiary-container/20 text-tertiary-container'
                    : 'bg-error/10 text-error',
                )}
              >
                {result.webhookRegistered ? 'Webhook registered' : 'Webhook not registered'}
                {result.botUsername && ` — @${result.botUsername}`}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" isLoading={updateMutation.isPending}>Save</Button>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
}
