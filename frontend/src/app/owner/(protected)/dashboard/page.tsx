import { getTranslations } from 'next-intl/server';

import { DashboardMetrics } from '@/features/owner-analytics/components/dashboard-metrics';
import { TopCustomersTable } from '@/features/owner-analytics/components/top-customers-table';

export default async function OwnerDashboardPage() {
  const t = await getTranslations('admin.dashboard');

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-background">
        {t('title')}
      </h1>
      <DashboardMetrics />
      <TopCustomersTable />
    </div>
  );
}
