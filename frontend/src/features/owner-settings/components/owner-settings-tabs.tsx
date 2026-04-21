'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

import { BotSettingsForm } from './bot-settings-form';
import { BusinessTranslationsForm } from './business-translations-form';
import { EarnRateForm } from './earn-rate-form';
import { LanguageSettingsForm } from './language-settings-form';

type TabKey = 'earnRate' | 'botSettings' | 'languages' | 'translations';

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: 'earnRate', labelKey: 'earnRate' },
  { key: 'botSettings', labelKey: 'botSettings' },
  { key: 'languages', labelKey: 'languages' },
  { key: 'translations', labelKey: 'businessTranslations' },
];

export function OwnerSettingsTabs() {
  const t = useTranslations('admin.settings');
  const [activeTab, setActiveTab] = useState<TabKey>('earnRate');

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-xl bg-surface-container-low p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-label transition-colors',
              activeTab === tab.key
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-background',
            )}
          >
            {t(tab.labelKey as Parameters<typeof t>[0])}
          </button>
        ))}
      </div>

      {activeTab === 'earnRate' && <EarnRateForm />}
      {activeTab === 'botSettings' && <BotSettingsForm />}
      {activeTab === 'languages' && <LanguageSettingsForm />}
      {activeTab === 'translations' && <BusinessTranslationsForm />}
    </div>
  );
}
