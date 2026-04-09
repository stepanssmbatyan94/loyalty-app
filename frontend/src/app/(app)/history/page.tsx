import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'History — Beer House',
};

const HistoryPage = async () => {
  const t = await getTranslations('pointTransactions');

  const transactions = [
    {
      id: 1,
      title: t('sampleEarn1'),
      date: t('sampleDate1'),
      pts: +120,
      type: 'earn' as const,
    },
    {
      id: 2,
      title: t('sampleRedeem1'),
      date: t('sampleDate2'),
      pts: -450,
      type: 'redeem' as const,
    },
    {
      id: 3,
      title: t('sampleEarn2'),
      date: t('sampleDate3'),
      pts: +80,
      type: 'earn' as const,
    },
    {
      id: 4,
      title: t('sampleEarn3'),
      date: t('sampleDate4'),
      pts: +200,
      type: 'earn' as const,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline text-2xl font-bold tracking-tight">
        {t('historyTitle')}
      </h1>

      {/* Filter chips placeholder */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {(['all', 'earn', 'redeem'] as const).map((filter) => (
          <button
            key={filter}
            className={`whitespace-nowrap rounded-full px-4 py-2 font-label text-xs font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            {t(`filter.${filter}`)}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-sm"
          >
            <div
              className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                tx.type === 'earn' ? 'bg-tertiary/10' : 'bg-error/10'
              }`}
            >
              <span
                className={`material-symbols-outlined ${
                  tx.type === 'earn' ? 'text-tertiary' : 'text-error'
                }`}
              >
                {tx.type === 'earn' ? 'add_circle' : 'remove_circle'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{tx.title}</p>
              <p className="text-xs text-on-surface-variant">{tx.date}</p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={`font-headline font-extrabold ${
                  tx.type === 'earn' ? 'text-tertiary' : 'text-error'
                }`}
              >
                {tx.pts > 0 ? `+${tx.pts}` : tx.pts}
              </p>
              <p className="font-label text-[10px] uppercase text-on-surface-variant">
                pts
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
