'use client';

import { LoyaltyCardHome } from '@/features/loyalty-cards/components/loyalty-card-home';
import { useBusinessInfo } from '@/features/notifications/api/get-business-info';
import { EnableNotificationsBanner } from '@/features/notifications/components/enable-notifications-banner';
import { useAuthStore } from '@/stores/auth-store';

export function HomeWithNotifications() {
  const token = useAuthStore((s) => s.token);
  const { data: businessInfo } = useBusinessInfo({
    queryConfig: { enabled: !!token },
  });

  return (
    <div className="flex flex-col gap-6">
      <EnableNotificationsBanner
        botUsername={businessInfo?.botUsername ?? ''}
      />
      <LoyaltyCardHome />
    </div>
  );
}
