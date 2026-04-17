'use client';

import { useTranslations } from 'next-intl';

interface ProgressToRewardProps {
  ptsRemaining: number;
  progressPercent: number;
  nextRewardName: string;
}

export function ProgressToReward({
  ptsRemaining,
  progressPercent,
  nextRewardName,
}: ProgressToRewardProps) {
  const t = useTranslations('loyaltyCards');

  return (
    <div className="mt-10 w-full">
      <div className="mb-3 flex items-end justify-between">
        <span className="font-headline text-lg font-bold text-white">
          {t('nextReward')}
        </span>
        <span className="rounded-full bg-white/20 px-3 py-1 font-label text-xs font-semibold text-white">
          {t('ptsAway', { count: ptsRemaining })}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-tertiary-fixed transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-3 text-center text-sm text-white/80">
        {ptsRemaining} {t('morePointsFor')} <strong>{nextRewardName}</strong>
      </p>
    </div>
  );
}
