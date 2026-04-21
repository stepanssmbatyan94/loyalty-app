import { OwnerSettingsTabs } from '@/features/owner-settings/components/owner-settings-tabs';

export const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-background">Settings</h1>
      <OwnerSettingsTabs />
    </div>
  );
};
