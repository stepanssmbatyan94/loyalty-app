'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

import { formatTransactionDate } from '../utils/format-date';

interface TransactionItemProps {
  type: 'earn' | 'redeem';
  points: number;
  note: string | null;
  createdAt: string;
}

export function TransactionItem({
  type,
  points,
  note,
  createdAt,
}: TransactionItemProps) {
  const t = useTranslations('pointTransactions');

  const isEarn = type === 'earn';
  const label = note ?? (isEarn ? t('earnedPoints') : t('redeemedReward'));

  const dateResult = formatTransactionDate(createdAt);
  let formattedDate: string;
  if (dateResult.key === 'today') {
    formattedDate = t('today', { time: dateResult.time });
  } else if (dateResult.key === 'yesterday') {
    formattedDate = t('yesterday', { time: dateResult.time });
  } else {
    formattedDate = `${dateResult.date} • ${dateResult.time}`;
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-lg flex items-center justify-between transition-all hover:bg-white border border-transparent hover:border-outline-variant/10">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center',
            isEarn
              ? 'bg-tertiary-container/10 text-tertiary-container'
              : 'bg-error-container/10 text-error',
          )}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isEarn ? 'sports_bar' : 'redeem'}
          </span>
        </div>
        <div>
          <h3 className="font-headline font-bold text-on-background">{label}</h3>
          <p className="font-label text-xs text-on-surface-variant mt-0.5">
            {formattedDate}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={cn(
            'font-headline text-lg font-extrabold',
            isEarn ? 'text-tertiary-container' : 'text-error',
          )}
        >
          {isEarn ? '+' : '-'}
          {points}
        </span>
        <p className="font-label text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">
          {isEarn ? t('earned') : t('redeemed')}
        </p>
      </div>
    </div>
  );
}
