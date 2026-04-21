'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/stores/auth-store';

import { useLoyaltyCardMe } from '../api/get-loyalty-card-me';
import { useRecentTransactions } from '../api/get-recent-transactions';

import { BentoHighlights } from './bento-highlights';
import { LoyaltyCardHero } from './loyalty-card-hero';
import { LoyaltyCardQr } from './loyalty-card-qr';
import { LoyaltyCardSkeleton } from './loyalty-card-skeleton';
import { RecentActivity } from './recent-activity';

export function LoyaltyCardHome() {
  const t = useTranslations('loyaltyCards');
  const token = useAuthStore((s) => s.token);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);
  const authError = useAuthStore((s) => s.authError);

  const hasAuth = !!token;
  const {
    data: card,
    isLoading: isCardLoading,
    isError: isCardError,
  } = useLoyaltyCardMe({
    queryConfig: { enabled: hasAuth },
  });
  const { data: txResponse } = useRecentTransactions({
    queryConfig: { enabled: hasAuth },
  });

  if (isAuthLoading || isCardLoading) return <LoyaltyCardSkeleton />;

  if (authError || isCardError || !card) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl">error</span>
        <p className="font-body text-sm">{t('loadError')}</p>
      </div>
    );
  }

  const nextReward = card.nextReward
    ? {
        name: card.nextReward.name,
        pointsCost: card.nextReward.pointsCost,
        ptsRemaining: card.nextReward.ptsRemaining,
      }
    : null;

  const recentTransactions = txResponse ?? [];

  return (
    <div className="flex flex-col gap-6">
      <LoyaltyCardHero
        points={card.points}
        nextReward={nextReward}
        progressPercent={card.progressPercent}
        memberSince={card.memberSince}
      />

      <LoyaltyCardQr qrCodeUrl={card.qrCodeUrl} />

      <Link
        href="/rewards"
        className="flex w-full items-center justify-center gap-3 rounded-lg bg-secondary-container py-5 font-headline font-bold text-on-secondary-container transition-colors hover:bg-secondary-fixed"
      >
        <span className="material-symbols-outlined">confirmation_number</span>
        {t('viewMyRewards')}
      </Link>

      <BentoHighlights qrCodeUrl={card.qrCodeUrl} />

      <RecentActivity transactions={recentTransactions} />
    </div>
  );
}
