'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

import {
  BusinessTranslationEntry,
  useBusinessTranslations,
} from '../api/get-business-translations';
import { useUpdateBusinessTranslations } from '../api/update-business-translations';

const SUPPORTED_LOCALES = ['en', 'ru'];
const FIELDS: BusinessTranslationEntry['field'][] = [
  'name',
  'welcomeMessage',
  'pointsLabel',
];

export function BusinessTranslationsForm() {
  const t = useTranslations('admin.settings');
  const { data, isLoading } = useBusinessTranslations();
  const updateMutation = useUpdateBusinessTranslations();

  const existing = data?.translations ?? [];
  const [values, setValues] = useState<Record<string, Record<string, string>>>(
    () => {
      const init: Record<string, Record<string, string>> = {};
      for (const locale of SUPPORTED_LOCALES) {
        init[locale] = { name: '', welcomeMessage: '', pointsLabel: '' };
      }
      for (const entry of existing) {
        if (!init[entry.locale]) init[entry.locale] = {};
        init[entry.locale][entry.field] = entry.value;
      }
      return init;
    },
  );

  const fieldLabel = (
    field: BusinessTranslationEntry['field'],
    locale: string,
  ) => {
    if (field === 'name') return t('translationName', { locale });
    if (field === 'welcomeMessage') return t('welcomeMessage', { locale });
    return t('pointsLabel', { locale });
  };

  if (isLoading) {
    return (
      <div className="h-48 animate-pulse rounded-xl bg-surface-container-low" />
    );
  }

  const handleSubmit = () => {
    const translations: BusinessTranslationEntry[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      for (const field of FIELDS) {
        const val = values[locale]?.[field];
        if (val) translations.push({ locale, field, value: val });
      }
    }
    updateMutation.mutate({ translations });
  };

  return (
    <div className="rounded-xl border bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="mb-4 font-label text-base font-semibold text-on-background">
        {t('businessTranslations')}
      </h2>
      <div className="space-y-6">
        {SUPPORTED_LOCALES.map((locale) => (
          <div key={locale} className="space-y-3">
            <h3 className="font-label text-sm font-semibold uppercase text-on-surface-variant">
              {locale.toUpperCase()}
            </h3>
            {FIELDS.map((field) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-on-background">
                  {fieldLabel(field, locale)}
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
                  value={values[locale]?.[field] ?? ''}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [locale]: { ...prev[locale], [field]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        ))}
        <div className="flex justify-end">
          <Button isLoading={updateMutation.isPending} onClick={handleSubmit}>
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
