import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Home — Beer House',
};

const HomePage = async () => {
  const t = await getTranslations('loyaltyCards');

  return (
    <div className="flex flex-col gap-6">
      {/* Loyalty Card Hero placeholder */}
      <section className="glass-card text-on-primary-container flex flex-col items-center justify-center rounded-xl p-8 shadow-2xl shadow-primary/20">
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
            2,450
          </span>
          <span className="mt-1 font-label text-sm uppercase tracking-widest text-white opacity-80">
            {t('totalPoints')}
          </span>
        </div>
        <div className="mt-10 w-full">
          <div className="mb-3 flex items-end justify-between">
            <span className="font-headline text-lg font-bold text-white">
              {t('nextReward')}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 font-label text-xs font-semibold text-white">
              {t('ptsAway', { count: 50 })}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-tertiary-fixed"
              style={{ width: '85%' }}
            />
          </div>
        </div>
      </section>

      {/* Bento grid placeholder */}
      <section className="grid grid-cols-2 gap-4">
        <div className="flex aspect-square flex-col justify-between rounded-lg bg-surface-container-low p-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <span className="material-symbols-outlined text-primary">
              event_repeat
            </span>
          </div>
          <div>
            <h3 className="font-headline text-base font-bold leading-tight">
              {t('dailyCheckin')}
            </h3>
            <p className="mt-1 text-xs font-medium text-on-surface-variant">
              {t('dailyCheckinPts')}
            </p>
          </div>
        </div>
        <div className="flex aspect-square flex-col justify-between rounded-lg bg-surface-container-low p-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary/10">
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              celebration
            </span>
          </div>
          <div>
            <h3 className="font-headline text-base font-bold leading-tight">
              {t('happyHour')}
            </h3>
            <p className="mt-1 text-xs font-medium text-on-surface-variant">
              {t('happyHourMultiplier')}
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity placeholder */}
      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold tracking-tight">
          {t('recentActivity')}
        </h2>
        <button className="font-label text-xs font-bold uppercase tracking-widest text-primary">
          {t('seeAll')}
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-tertiary/10">
            <span className="material-symbols-outlined text-tertiary">
              add_circle
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t('sampleEarnTitle')}</p>
            <p className="text-xs text-on-surface-variant">
              {t('sampleEarnDate')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-headline font-extrabold text-tertiary">+120</p>
            <p className="font-label text-[10px] uppercase text-on-surface-variant">
              pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-error/10">
            <span className="material-symbols-outlined text-error">
              remove_circle
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{t('sampleRedeemTitle')}</p>
            <p className="text-xs text-on-surface-variant">
              {t('sampleRedeemDate')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-headline font-extrabold text-error">-450</p>
            <p className="font-label text-[10px] uppercase text-on-surface-variant">
              pts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
