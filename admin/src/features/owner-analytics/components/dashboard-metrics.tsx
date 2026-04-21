import { useDashboard } from '../api/get-dashboard';
import { KpiCard } from './kpi-card';

export function DashboardMetrics() {
  const { data, isLoading } = useDashboard({ queryConfig: { refetchInterval: 60_000 } });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-container-low" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard label="Total Customers" value={data.totalCustomers} />
      <KpiCard label="Transactions Today" value={data.transactionsToday} />
      <KpiCard label="Total Points Issued" value={data.totalPointsIssuedAllTime} />
      <KpiCard label="Active Rewards" value={data.activeRewards} />
    </div>
  );
}
