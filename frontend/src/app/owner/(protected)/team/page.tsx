import { getTranslations } from 'next-intl/server';

import { CashierList } from '@/features/owner-team/components/cashier-list';

export default async function OwnerTeamPage() {
  const t = await getTranslations('admin.team');

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-background">
        {t('title')}
      </h1>
      <CashierList />
    </div>
  );
}
