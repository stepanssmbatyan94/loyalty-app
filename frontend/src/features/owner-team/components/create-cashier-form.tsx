'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';

import { useCreateCashier } from '../api/create-cashier';

const createCashierSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().min(1, 'Required').email('Invalid email'),
  telegramUserId: z.string().optional(),
});

type CreateCashierValues = z.infer<typeof createCashierSchema>;

interface CreateCashierFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateCashierForm({
  onSuccess,
  onCancel,
}: CreateCashierFormProps) {
  const t = useTranslations('admin.team');
  const createMutation = useCreateCashier({ mutationConfig: { onSuccess } });

  return (
    <Form
      onSubmit={(values) =>
        createMutation.mutate({
          ...values,
          telegramUserId: values.telegramUserId || undefined,
        })
      }
      schema={createCashierSchema}
    >
      {({ register, formState }) => (
        <div className="space-y-4">
          <Input
            label={t('firstName')}
            error={formState.errors['firstName']}
            registration={register('firstName')}
          />
          <Input
            label={t('lastName')}
            error={formState.errors['lastName']}
            registration={register('lastName')}
          />
          <Input
            type="email"
            label={t('email')}
            error={formState.errors['email']}
            registration={register('email')}
          />
          <Input
            label={t('telegramUserId')}
            error={formState.errors['telegramUserId']}
            registration={register('telegramUserId')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('cancel')}
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              {t('save')}
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
