import { getTranslations } from 'next-intl/server';

export const metadata = {
  title: 'History — Beer House',
};

const HistoryPage = async () => {
  const t = await getTranslations('pointTransactions');

  const transactions = [
    { id: 1, title: t('sampleEarn1'), date: t('sampleDate1'), pts: +120, type: 'earn' as const },
    { id: 2, title: t('sampleRedeem1'), date: t('sampleDate2'), pts: -450, type: 'redeem' as const },
    { id: 3, title: t('sampleEarn2'), date: t('sampleDate3'), pts: +80, type: 'earn' as const },
    { id: 4, title: t('sampleEarn3'), date: t('sampleDate4'), pts: +200, type: 'earn' as const },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-headline font-bold text-2xl tracking-tight">
        {t('historyTitle')}
      </h1>

      {/* Filter chips placeholder */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(['all', 'earn', 'redeem'] as const).map((filter) => (
          <button
            key={filter}
            className={`font-label text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
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
            className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg shadow-sm"
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
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
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{tx.title}</p>
              <p className="text-xs text-on-surface-variant">{tx.date}</p>
            </div>
            <div className="text-right shrink-0">
              <p
                className={`font-headline font-extrabold ${
                  tx.type === 'earn' ? 'text-tertiary' : 'text-error'
                }`}
              >
                {tx.pts > 0 ? `+${tx.pts}` : tx.pts}
              </p>
              <p className="text-[10px] font-label uppercase text-on-surface-variant">
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
