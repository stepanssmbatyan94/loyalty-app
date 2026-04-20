'use client';

import { useTranslations } from 'next-intl';

import { Reward } from '../types';

import { RewardCard } from './reward-card';

interface RewardsListProps {
  rewards: Reward[];
  onRedeem: (rewardId: string) => void;
  redeemingId: string | null;
}

export function RewardsList({
  rewards,
  onRedeem,
  redeemingId,
}: RewardsListProps) {
  const t = useTranslations('rewards');

  if (rewards.length === 0) {
    return (
      <div className="py-16 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl opacity-40">
          redeem
        </span>
        <p className="mt-4 font-body">{t('noRewardsYet')}</p>
      </div>
    );
  }

  const sorted = [...rewards].sort((a, b) => {
    if (a.canRedeem !== b.canRedeem) return a.canRedeem ? -1 : 1;
    return a.pointsCost - b.pointsCost;
  });

  return (
    <div className="grid grid-cols-1 gap-6">
      {sorted.map((reward) => (
        <RewardCard
          key={reward.id}
          {...reward}
          isLoading={redeemingId === reward.id}
          onRedeem={onRedeem}
        />
      ))}
    </div>
  );
}
