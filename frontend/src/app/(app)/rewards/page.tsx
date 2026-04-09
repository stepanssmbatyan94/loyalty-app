import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'Rewards — Beer House',
};

const RewardsPage = async () => {
  const t = await getTranslations('rewards');

  return (
    <div className="flex flex-col gap-6">
      {/* Balance hero placeholder */}
      <section className="glass-card rounded-xl p-6 flex items-center justify-between text-white">
        <div>
          <p className="font-label text-xs uppercase tracking-widest opacity-80">
            {t('yourBalance')}
          </p>
          <p className="font-headline font-extrabold text-5xl tracking-tighter mt-1">
            2,450
          </p>
          <p className="font-label text-sm opacity-80 mt-1">{t('points')}</p>
        </div>
        <span
          className="material-symbols-outlined text-6xl opacity-20"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          stars
        </span>
      </section>

      {/* Rewards list placeholder */}
      <h2 className="font-headline font-bold text-xl tracking-tight">
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
            className="bg-surface-container-lowest rounded-xl p-4 flex items-center gap-4 shadow-sm"
          >
            <div
              className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${
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
              <p className="font-headline font-bold text-sm">{reward.name}</p>
              <p className="font-label text-xs text-on-surface-variant mt-0.5">
                {reward.cost} pts
              </p>
            </div>
            {reward.unlocked && (
              <button className="bg-primary text-white font-label text-xs font-bold px-4 py-2 rounded-full">
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
