import { CashierList } from '@/features/owner-team/components/cashier-list';

export const TeamPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl font-bold text-on-background">Team</h1>
      <CashierList />
    </div>
  );
};
