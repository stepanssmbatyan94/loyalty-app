import { getTranslations } from 'next-intl/server';

import { RewardManagementList } from '@/features/owner-rewards/components/reward-management-list';

export default async function OwnerRewardsPage() {
  const t = await getTranslations('admin.rewards');

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-background">
        {t('title')}
      </h1>
      <RewardManagementList />
    </div>
  );
}
