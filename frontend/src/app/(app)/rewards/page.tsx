import { Suspense } from 'react';

import { RewardsHome } from '@/features/rewards/components/rewards-home';
import { RewardsSkeleton } from '@/features/rewards/components/rewards-skeleton';

export const metadata = {
  title: 'Rewards — Beer House',
};

const RewardsPage = () => {
  return (
    <Suspense fallback={<RewardsSkeleton />}>
      <RewardsHome />
    </Suspense>
  );
};

export default RewardsPage;
