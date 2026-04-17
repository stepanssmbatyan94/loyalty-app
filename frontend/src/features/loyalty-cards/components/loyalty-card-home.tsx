'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useLoyaltyCardMe } from '../api/get-loyalty-card-me';
import { useRecentTransactions } from '../api/get-recent-transactions';

import { BentoHighlights } from './bento-highlights';
import { LoyaltyCardHero } from './loyalty-card-hero';
import { RecentActivity } from './recent-activity';

export function LoyaltyCardHome() {
  const t = useTranslations('loyaltyCards');
  const { data: card } = useLoyaltyCardMe();
  const { data: txResponse } = useRecentTransactions();

  if (!card) return null;

  const nextReward = card.nextReward
    ? {
        name: card.nextReward.name,
        pointsCost: card.nextReward.pointsCost,
        ptsRemaining: card.nextReward.ptsRemaining,
      }
    : null;

  const recentTransactions = txResponse?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <LoyaltyCardHero
        points={card.points}
        nextReward={nextReward}
        progressPercent={card.progressPercent}
        memberSince={card.memberSince}
      />

      <Link
        href="/rewards"
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-secondary-container py-5 font-headline font-bold text-on-secondary-container transition-colors hover:bg-secondary-fixed"
      >
        <span className="material-symbols-outlined">confirmation_number</span>
        {t('viewMyRewards')}
      </Link>

      <BentoHighlights />

      <RecentActivity transactions={recentTransactions} />
    </div>
  );
}
