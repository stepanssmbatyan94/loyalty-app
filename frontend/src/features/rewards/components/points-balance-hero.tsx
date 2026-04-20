'use client';

import { useTranslations } from 'next-intl';

interface PointsBalanceHeroProps {
  points: number;
}

export function PointsBalanceHero({ points }: PointsBalanceHeroProps) {
  const t = useTranslations('rewards');

  return (
    <section className="relative mb-10 overflow-hidden rounded-xl p-8 text-white shadow-lg premium-gradient">
      <div className="relative z-10 flex flex-col gap-1">
        <span className="font-label text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
          {t('availableBalance')}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-headline text-5xl font-extrabold tracking-tight">
            {points.toLocaleString()}
          </span>
          <span className="font-body text-lg opacity-90">{t('ptsLabel')}</span>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute right-6 top-4">
        <span
          className="material-symbols-outlined text-4xl opacity-20"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          redeem
        </span>
      </div>
    </section>
  );
}
