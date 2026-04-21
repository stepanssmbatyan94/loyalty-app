import { DashboardMetrics } from '@/features/owner-analytics/components/dashboard-metrics';
import { TopCustomersTable } from '@/features/owner-analytics/components/top-customers-table';

export const DashboardPage = () => (
  <div className="space-y-6">
    <h1 className="font-headline text-2xl font-bold text-on-background">Dashboard</h1>
    <DashboardMetrics />
    <TopCustomersTable />
  </div>
);
