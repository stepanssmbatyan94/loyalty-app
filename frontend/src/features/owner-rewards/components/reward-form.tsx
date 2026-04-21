'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';

import { OwnerReward } from '../types';

const rewardSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
  pointsCost: z.number().int().min(1, 'Must be at least 1'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  isActive: z.boolean(),
  stock: z.number().int().min(0).nullable().optional(),
});

type RewardValues = z.infer<typeof rewardSchema>;

interface RewardFormProps {
  defaultValues?: Partial<OwnerReward>;
  onSubmit: (values: RewardValues) => void;
  isLoading?: boolean;
  onCancel: () => void;
}

export function RewardForm({
  defaultValues,
  onSubmit,
  isLoading,
  onCancel,
}: RewardFormProps) {
  const t = useTranslations('admin.rewards');

  return (
    <Form
      onSubmit={onSubmit}
      schema={rewardSchema}
      options={{
        defaultValues: {
          name: defaultValues?.name ?? '',
          description: defaultValues?.description ?? '',
          pointsCost: defaultValues?.pointsCost ?? 100,
          imageUrl: defaultValues?.imageUrl ?? '',
          isActive: defaultValues?.isActive ?? true,
          stock: defaultValues?.stock ?? null,
        },
      }}
    >
      {({ register, formState }) => (
        <div className="space-y-4">
          <Input
            label={t('name')}
            error={formState.errors['name']}
            registration={register('name')}
          />
          <Input
            label={t('description')}
            error={formState.errors['description']}
            registration={register('description')}
          />
          <Input
            type="number"
            label={t('pointsCost')}
            error={formState.errors['pointsCost']}
            registration={register('pointsCost', { valueAsNumber: true })}
          />
          <Input
            label={t('imageUrl')}
            error={formState.errors['imageUrl']}
            registration={register('imageUrl')}
          />
          <Input
            type="number"
            label={t('stock')}
            placeholder={t('stockPlaceholder')}
            error={formState.errors['stock']}
            registration={register('stock', {
              valueAsNumber: true,
              setValueAs: (v) =>
                v === '' || isNaN(Number(v)) ? null : Number(v),
            })}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-on-background">
            <input
              type="checkbox"
              {...register('isActive')}
              className="rounded"
            />
            {t('isActive')}
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('cancel')}
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {t('save')}
            </Button>
          </div>
        </div>
      )}
    </Form>
  );
}
