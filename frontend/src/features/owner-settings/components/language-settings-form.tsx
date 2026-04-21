'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import { useUpdateLanguages } from '../api/update-languages';

const AVAILABLE_LOCALES = ['en', 'ru', 'hy', 'fr', 'de', 'es'];

export function LanguageSettingsForm() {
  const t = useTranslations('admin.settings');
  const [selected, setSelected] = useState<string[]>(['en', 'ru']);
  const [defaultLocale, setDefaultLocale] = useState('en');

  const updateMutation = useUpdateLanguages();

  const toggleLocale = (locale: string) => {
    setSelected((prev) =>
      prev.includes(locale)
        ? prev.filter((l) => l !== locale)
        : [...prev, locale],
    );
  };

  return (
    <div className="rounded-xl border bg-surface-container-lowest p-6 shadow-sm">
      <h2 className="mb-4 font-label text-base font-semibold text-on-background">
        {t('languages')}
      </h2>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-on-background">
            {t('supportedLocales')}
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => toggleLocale(locale)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm font-label transition-colors',
                  selected.includes(locale)
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-primary/10',
                )}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-on-background">
            {t('defaultLocale')}
          </p>
          <select
            value={defaultLocale}
            onChange={(e) => setDefaultLocale(e.target.value)}
            className="rounded-md border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {selected.map((locale) => (
              <option key={locale} value={locale}>
                {locale.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <Button
            isLoading={updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate({
                supportedLocales: selected,
                defaultLocale,
              })
            }
          >
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
