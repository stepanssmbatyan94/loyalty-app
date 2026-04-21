import { TopCustomersTable } from '@/features/owner-analytics/components/top-customers-table';

export const CustomersPage = () => (
  <div className="space-y-6">
    <h1 className="font-headline text-2xl font-bold text-on-background">Customers</h1>
    <TopCustomersTable />
  </div>
);
