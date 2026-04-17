import { Suspense } from 'react';

import { LoyaltyCardHome } from '@/features/loyalty-cards/components/loyalty-card-home';
import { LoyaltyCardSkeleton } from '@/features/loyalty-cards/components/loyalty-card-skeleton';

export const metadata = {
  title: 'Home — Beer House',
};

const HomePage = () => {
  return (
    <Suspense fallback={<LoyaltyCardSkeleton />}>
      <LoyaltyCardHome />
    </Suspense>
  );
};

export default HomePage;
