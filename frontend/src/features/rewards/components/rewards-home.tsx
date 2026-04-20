'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useLoyaltyCardMe } from '@/features/loyalty-cards/api/get-loyalty-card-me';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';

import { useRewards } from '../api/get-rewards';

import { PointsBalanceHero } from './points-balance-hero';
import { RewardsList } from './rewards-list';
import { RewardsSkeleton } from './rewards-skeleton';

export function RewardsHome() {
  const t = useTranslations('rewards');
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);
  const hasAuth = !!token;

  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const { data: card, isLoading: isCardLoading } = useLoyaltyCardMe({
    queryConfig: { enabled: hasAuth },
  });
  const {
    data: rewards,
    isLoading: isRewardsLoading,
    isError,
  } = useRewards({ queryConfig: { enabled: hasAuth } });

  if (isAuthLoading || isCardLoading || isRewardsLoading) {
    return <RewardsSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl">error</span>
        <p className="font-body text-sm">{t('loadError')}</p>
      </div>
    );
  }

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    try {
      const redemption = await api.post<{ id: string }>('/api/v1/redemptions', {
        rewardId,
      });
      router.push(`/redemption/${redemption.id}`);
    } catch {
      // error shown via api-client notification
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="flex flex-col">
      <PointsBalanceHero points={card?.points ?? 0} />

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline text-2xl font-bold tracking-tight text-on-background">
          {t('rewardsCatalog')}
        </h2>
        <span className="material-symbols-outlined text-primary">
          filter_list
        </span>
      </div>

      <RewardsList
        rewards={rewards ?? []}
        onRedeem={handleRedeem}
        redeemingId={redeemingId}
      />
    </div>
  );
}
