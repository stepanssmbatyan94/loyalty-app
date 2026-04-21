import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRewardTranslations } from '../api/get-reward-translations';
import { useUpdateRewardTranslations } from '../api/update-reward-translations';

const SUPPORTED_LOCALES = ['en', 'ru'];

interface RewardTranslationsFormProps {
  rewardId: string;
  onDone: () => void;
}

export function RewardTranslationsForm({ rewardId, onDone }: RewardTranslationsFormProps) {
  const { data, isLoading } = useRewardTranslations({ rewardId });
  const updateMutation = useUpdateRewardTranslations({ mutationConfig: { onSuccess: onDone } });

  const existing = data?.data ?? [];
  const [values, setValues] = useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    for (const locale of SUPPORTED_LOCALES) {
      init[locale] = { name: '', description: '' };
    }
    for (const entry of existing) {
      if (!init[entry.locale]) init[entry.locale] = { name: '', description: '' };
      init[entry.locale][entry.field] = entry.value;
    }
    return init;
  });

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded bg-surface-container-low" />;
  }

  const handleSubmit = () => {
    const translations: { locale: string; field: 'name' | 'description'; value: string }[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      const loc = values[locale];
      if (loc?.name) translations.push({ locale, field: 'name', value: loc.name });
      if (loc?.description) translations.push({ locale, field: 'description', value: loc.description });
    }
    updateMutation.mutate({ rewardId, translations });
  };

  return (
    <div className="space-y-6">
      {SUPPORTED_LOCALES.map((locale) => (
        <div key={locale} className="space-y-3">
          <h3 className="font-label text-sm font-semibold uppercase text-on-surface-variant">
            {locale.toUpperCase()}
          </h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-background">
              Name ({locale})
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={values[locale]?.name ?? ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [locale]: { ...prev[locale], name: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-background">
              Description ({locale})
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={values[locale]?.description ?? ''}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [locale]: { ...prev[locale], description: e.target.value } }))
              }
            />
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={handleSubmit} isLoading={updateMutation.isPending}>Save</Button>
      </div>
    </div>
  );
}
