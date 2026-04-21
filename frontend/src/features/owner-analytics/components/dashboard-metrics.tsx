'use client';

import { useTranslations } from 'next-intl';

import { useDashboard } from '../api/get-dashboard';
import { KpiCard } from './kpi-card';

export function DashboardMetrics() {
  const t = useTranslations('admin.dashboard');
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl bg-surface-container-low"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label={t('totalCustomers')} value={data.totalCustomers} />
      <KpiCard label={t('transactionsToday')} value={data.transactionsToday} />
      <KpiCard
        label={t('totalPointsIssued')}
        value={data.totalPointsIssuedAllTime}
      />
      <KpiCard label={t('activeRewards')} value={data.activeRewards} />
    </div>
  );
}
