'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/utils/cn';

import { FilterPeriod } from '../types';

interface TransactionFilterChipsProps {
  active: FilterPeriod;
  onChange: (period: FilterPeriod) => void;
}

const PERIODS: FilterPeriod[] = ['all', 'month', 'week'];

const PERIOD_KEY: Record<FilterPeriod, string> = {
  all: 'allTime',
  month: 'thisMonth',
  week: 'thisWeek',
};

export function TransactionFilterChips({
  active,
  onChange,
}: TransactionFilterChipsProps) {
  const t = useTranslations('pointTransactions');

  return (
    <div className="flex gap-2">
      {PERIODS.map((period) => (
        <button
          key={period}
          onClick={() => onChange(period)}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-1.5 font-label text-xs font-semibold transition-colors',
            active === period
              ? 'bg-primary text-white'
              : 'bg-surface-container-high text-on-surface-variant',
          )}
        >
          {t(PERIOD_KEY[period])}
        </button>
      ))}
    </div>
  );
}
