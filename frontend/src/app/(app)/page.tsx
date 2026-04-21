import { Suspense } from 'react';

import { LoyaltyCardSkeleton } from '@/features/loyalty-cards/components/loyalty-card-skeleton';

import { HomeWithNotifications } from './_components/home-with-notifications';

export const metadata = {
  title: 'Home — Beer House',
};

const HomePage = () => {
  return (
    <Suspense fallback={<LoyaltyCardSkeleton />}>
      <HomeWithNotifications />
    </Suspense>
  );
};

export default HomePage;
