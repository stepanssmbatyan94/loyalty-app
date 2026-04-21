import { RewardManagementList } from '@/features/owner-rewards/components/reward-management-list';

export const RewardsPage = () => (
  <div className="space-y-6">
    <h1 className="font-headline text-2xl font-bold text-on-background">Rewards</h1>
    <RewardManagementList />
  </div>
);
