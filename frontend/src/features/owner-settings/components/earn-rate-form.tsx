'use client';

import { useTranslations } from 'next-intl';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';

import { useUpdateEarnRate } from '../api/update-earn-rate';

const earnRateSchema = z.object({
  earnRateMode: z.enum(['per_amd_spent', 'fixed_per_visit']),
  earnRateValue: z.number().int().min(1, 'Must be at least 1'),
});

type EarnRateValues = z.infer<typeof earnRateSchema>;

export function EarnRateForm() {
  const t = useTranslations('admin.settings');
  const updateMutation = useUpdateEarnRate();

  return (
    <div className="rounded-xl border bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="mb-4 font-label text-base font-semibold text-on-background">
        {t('earnRate')}
      </h2>
      <Form
        onSubmit={(values) =>
          updateMutation.mutate(
            values as {
              earnRateMode: 'per_amd_spent' | 'fixed_per_visit';
              earnRateValue: number;
            },
          )
        }
        schema={earnRateSchema}
        options={{
          defaultValues: { earnRateMode: 'per_amd_spent', earnRateValue: 100 },
        }}
      >
        {({ register, formState }) => (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-on-background">
                {t('earnRateMode')}
              </p>
              <div className="space-y-2">
                {(['per_amd_spent', 'fixed_per_visit'] as const).map((mode) => (
                  <label
                    key={mode}
                    className="flex items-center gap-2 text-sm text-on-background"
                  >
                    <input
                      type="radio"
                      value={mode}
                      {...register('earnRateMode')}
                    />
                    {mode === 'per_amd_spent'
                      ? t('perAmdSpent')
                      : t('fixedPerVisit')}
                  </label>
                ))}
              </div>
            </div>
            <Input
              type="number"
              label={t('earnRateValue')}
              error={formState.errors['earnRateValue']}
              registration={register('earnRateValue', { valueAsNumber: true })}
            />
            <div className="flex justify-end">
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t('save')}
              </Button>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
}
