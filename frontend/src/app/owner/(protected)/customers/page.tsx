import { getTranslations } from 'next-intl/server';

import { TopCustomersTable } from '@/features/owner-analytics/components/top-customers-table';

export default async function OwnerCustomersPage() {
  const t = await getTranslations('admin.customers');

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-background">
        {t('title')}
      </h1>
      <TopCustomersTable />
    </div>
  );
}
