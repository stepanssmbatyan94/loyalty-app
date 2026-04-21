import { getTranslations } from 'next-intl/server';

import { OwnerSettingsTabs } from '@/features/owner-settings/components/owner-settings-tabs';

export default async function OwnerSettingsPage() {
  const t = await getTranslations('admin.settings');

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-background">
        {t('title')}
      </h1>
      <OwnerSettingsTabs />
    </div>
  );
}
