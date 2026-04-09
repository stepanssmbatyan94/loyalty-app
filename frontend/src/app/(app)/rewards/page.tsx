import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Rewards — Beer House',
};

const RewardsPage = async () => {
  const t = await getTranslations('rewards');

  return (
    <div className="flex flex-col gap-6">
      {/* Balance hero placeholder */}
      <section className="glass-card flex items-center justify-between rounded-xl p-6 text-white">
        <div>
          <p className="font-label text-xs uppercase tracking-widest opacity-80">
            {t('yourBalance')}
          </p>
          <p className="mt-1 font-headline text-5xl font-extrabold tracking-tighter">
            2,450
          </p>
          <p className="mt-1 font-label text-sm opacity-80">{t('points')}</p>
        </div>
        <span
          className="material-symbols-outlined text-6xl opacity-20"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          stars
        </span>
      </section>

      {/* Rewards list placeholder */}
      <h2 className="font-headline text-xl font-bold tracking-tight">
        {t('catalogTitle')}
      </h2>
      <div className="space-y-4">
        {[
          { name: t('sampleReward1'), cost: 500, unlocked: true },
          { name: t('sampleReward2'), cost: 1000, unlocked: true },
          { name: t('sampleReward3'), cost: 3000, unlocked: false },
        ].map((reward) => (
          <div
            key={reward.name}
            className="flex items-center gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
          >
            <div
              className={`flex size-14 shrink-0 items-center justify-center rounded-lg ${
                reward.unlocked ? 'bg-primary/10' : 'bg-surface-container-high'
              }`}
            >
              <span
                className={`material-symbols-outlined text-2xl ${
                  reward.unlocked ? 'text-primary' : 'text-on-surface-variant'
                }`}
                style={
                  reward.unlocked
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {reward.unlocked ? 'redeem' : 'lock'}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-headline text-sm font-bold">{reward.name}</p>
              <p className="mt-0.5 font-label text-xs text-on-surface-variant">
                {reward.cost} pts
              </p>
            </div>
            {reward.unlocked && (
              <button className="rounded-full bg-primary px-4 py-2 font-label text-xs font-bold text-white">
                {t('redeemButton')}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RewardsPage;
