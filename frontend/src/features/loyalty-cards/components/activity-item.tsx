'use client';

import { useTranslations, useLocale } from 'next-intl';

import { cn } from '@/utils/cn';

import { ActivityTransaction } from '../types';

function formatActivityDate(
  dateStr: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const timeStr = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  if (startOfDate.getTime() === startOfToday.getTime()) {
    return `${todayLabel}, ${timeStr}`;
  }
  if (startOfDate.getTime() === startOfYesterday.getTime()) {
    return `${yesterdayLabel}, ${timeStr}`;
  }
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

interface ActivityItemProps {
  transaction: ActivityTransaction;
}

export function ActivityItem({ transaction }: ActivityItemProps) {
  const t = useTranslations('loyaltyCards');
  const locale = useLocale();
  const { type, note, points, createdAt } = transaction;

  const isEarn = type === 'earn';
  const label = note ?? (isEarn ? t('earnedPoints') : t('redeemedReward'));
  const formattedDate = formatActivityDate(
    createdAt,
    locale,
    t('today'),
    t('yesterday'),
  );

  return (
    <div className="flex items-center gap-4 rounded-lg bg-surface-container-lowest p-4 shadow-sm">
      <div
        className={cn(
          'flex size-12 shrink-0 items-center justify-center rounded-full',
          isEarn ? 'bg-tertiary/10' : 'bg-error/10',
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined',
            isEarn ? 'text-tertiary' : 'text-error',
          )}
        >
          {isEarn ? 'add_circle' : 'remove_circle'}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{label}</p>
        <p className="text-xs text-on-surface-variant">{formattedDate}</p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            'font-headline font-extrabold',
            isEarn ? 'text-tertiary' : 'text-error',
          )}
        >
          {isEarn ? '+' : '-'}
          {points}
        </p>
        <p className="font-label text-[10px] uppercase text-on-surface-variant">
          {t('pts')}
        </p>
      </div>
    </div>
  );
}
