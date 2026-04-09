import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Home — Beer House',
};

const HomePage = async () => {
  const t = await getTranslations('loyaltyCards');

  return (
    <div className="flex flex-col gap-6">
      {/* Loyalty Card Hero placeholder */}
      <section className="glass-card rounded-xl p-8 shadow-2xl shadow-primary/20 flex flex-col items-center justify-center text-on-primary-container">
        <div className="flex items-center gap-2 opacity-80 self-start">
          <span className="material-symbols-outlined text-sm text-white">
            auto_awesome
          </span>
          <span className="font-label text-[10px] uppercase tracking-[0.2em] font-bold text-white">
            {t('memberBadge')}
          </span>
        </div>
        <div className="mt-8 mb-2 flex flex-col items-center">
          <span className="font-headline font-extrabold text-7xl tracking-tighter text-white">
            2,450
          </span>
          <span className="font-label text-sm uppercase tracking-widest opacity-80 mt-1 text-white">
            {t('totalPoints')}
          </span>
        </div>
        <div className="w-full mt-10">
          <div className="flex justify-between items-end mb-3">
            <span className="font-headline font-bold text-lg text-white">
              {t('nextReward')}
            </span>
            <span className="font-label text-xs font-semibold bg-white/20 px-3 py-1 rounded-full text-white">
              {t('ptsAway', { count: 50 })}
            </span>
          </div>
          <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-tertiary-fixed rounded-full"
              style={{ width: '85%' }}
            />
          </div>
        </div>
      </section>

      {/* Bento grid placeholder */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-5 rounded-lg flex flex-col justify-between aspect-square">
          <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              event_repeat
            </span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">
              {t('dailyCheckin')}
            </h3>
            <p className="text-on-surface-variant text-xs mt-1 font-medium">
              {t('dailyCheckinPts')}
            </p>
          </div>
        </div>
        <div className="bg-surface-container-low p-5 rounded-lg flex flex-col justify-between aspect-square">
          <div className="bg-secondary/10 w-12 h-12 rounded-full flex items-center justify-center">
            <span
              className="material-symbols-outlined text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              celebration
            </span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-base leading-tight">
              {t('happyHour')}
            </h3>
            <p className="text-on-surface-variant text-xs mt-1 font-medium">
              {t('happyHourMultiplier')}
            </p>
          </div>
        </div>
      </section>

      {/* Recent activity placeholder */}
      <div className="mt-4 flex justify-between items-center">
        <h2 className="font-headline font-bold text-xl tracking-tight">
          {t('recentActivity')}
        </h2>
        <button className="text-primary font-label text-xs font-bold uppercase tracking-widest">
          {t('seeAll')}
        </button>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg shadow-sm">
          <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-tertiary">
              add_circle
            </span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{t('sampleEarnTitle')}</p>
            <p className="text-xs text-on-surface-variant">
              {t('sampleEarnDate')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-headline font-extrabold text-tertiary">+120</p>
            <p className="text-[10px] font-label uppercase text-on-surface-variant">
              pts
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg shadow-sm">
          <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-error">
              remove_circle
            </span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">{t('sampleRedeemTitle')}</p>
            <p className="text-xs text-on-surface-variant">
              {t('sampleRedeemDate')}
            </p>
          </div>
          <div className="text-right">
            <p className="font-headline font-extrabold text-error">-450</p>
            <p className="text-[10px] font-label uppercase text-on-surface-variant">
              pts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
