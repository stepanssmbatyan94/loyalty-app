import { useState } from 'react';
import { cn } from '@/utils/cn';
import { BotSettingsForm } from './bot-settings-form';
import { BusinessTranslationsForm } from './business-translations-form';
import { EarnRateForm } from './earn-rate-form';
import { LanguageSettingsForm } from './language-settings-form';

type TabKey = 'earnRate' | 'botSettings' | 'languages' | 'translations';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'earnRate', label: 'Earn Rate' },
  { key: 'botSettings', label: 'Bot Settings' },
  { key: 'languages', label: 'Languages' },
  { key: 'translations', label: 'Business Translations' },
];

export function OwnerSettingsTabs() {
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
              'flex-1 rounded-lg px-3 py-2 font-label text-sm transition-colors',
              activeTab === tab.key
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-background',
            )}
          >
            {tab.label}
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
