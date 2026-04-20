'use client';

import { useTranslations } from 'next-intl';

import { ProgressToReward } from './progress-to-reward';

interface LoyaltyCardHeroProps {
  points: number;
  nextReward: { name: string; pointsCost: number; ptsRemaining: number } | null;
  progressPercent: number;
  memberSince: string;
}

export function LoyaltyCardHero({
  points,
  nextReward,
  progressPercent,
  memberSince,
}: LoyaltyCardHeroProps) {
  const t = useTranslations('loyaltyCards');

  return (
    <section className="glass-card flex flex-col items-center justify-center rounded-xl p-8 shadow-2xl shadow-primary/20">
      <div className="flex items-center gap-2 self-start opacity-80">
        <span className="material-symbols-outlined text-sm text-white">
          auto_awesome
        </span>
        <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          {t('memberBadge')}
        </span>
      </div>

      <div className="mb-2 mt-8 flex flex-col items-center">
        <span className="font-headline text-7xl font-extrabold tracking-tighter text-white">
          {points.toLocaleString()}
        </span>
        <span className="mt-1 font-label text-sm uppercase tracking-widest text-white opacity-80">
          {t('totalPoints')}
        </span>
      </div>

      {nextReward ? (
        <ProgressToReward
          ptsRemaining={nextReward.ptsRemaining}
          progressPercent={progressPercent}
          nextRewardName={nextReward.name}
        />
      ) : (
        <p className="mt-6 text-center text-sm font-semibold text-white/90">
          {t('allRewardsUnlocked')}
        </p>
      )}

      <p className="mt-4 font-label text-[11px] uppercase tracking-widest text-white/60">
        {t('memberSince')}{' '}
        {new Date(memberSince).toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
        })}
      </p>
    </section>
  );
}
