'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useLoyaltyCardMe } from '@/features/loyalty-cards/api/get-loyalty-card-me';

import { useTransactions } from '../api/get-transactions';
import { FilterPeriod, TransactionFilters } from '../types';

import { TransactionFilterChips } from './transaction-filter-chips';
import { TransactionItem } from './transaction-item';
import { TransactionSkeleton } from './transaction-skeleton';

function getDateRange(period: FilterPeriod): TransactionFilters {
  if (period === 'all') return {};
  const from = new Date();
  if (period === 'week') from.setDate(from.getDate() - 7);
  if (period === 'month') from.setMonth(from.getMonth() - 1);
  return { from: from.toISOString() };
}

export function TransactionHistory() {
  const t = useTranslations('pointTransactions');
  const [filter, setFilter] = useState<FilterPeriod>('all');
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: card } = useLoyaltyCardMe();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useTransactions(getDateRange(filter));

  const transactions = data?.pages.flat() ?? [];

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col gap-6">
      {/* Balance header */}
      <section>
        <div className="flex flex-col items-start">
          <span className="mb-2 font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70">
            {t('loyaltyBalance')}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-5xl font-extrabold text-primary">
              {(card?.points ?? 0).toLocaleString()}
            </span>
            <span className="font-headline text-lg font-bold text-secondary">
              PTS
            </span>
          </div>
        </div>
      </section>

      {/* Section header + filter chips */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold text-on-background">
          {t('history')}
        </h2>
        <TransactionFilterChips active={filter} onChange={setFilter} />
      </div>

      {/* List */}
      {isLoading ? (
        <TransactionSkeleton />
      ) : transactions.length === 0 ? (
        <div className="py-16 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl opacity-40">
            receipt_long
          </span>
          <p className="mt-4 font-body text-sm">{t('noTransactionsYet')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              type={tx.type}
              points={tx.points}
              note={tx.note}
              createdAt={tx.createdAt}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more spinner */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <span className="material-symbols-outlined animate-spin text-on-surface-variant">
            progress_activity
          </span>
        </div>
      )}

      {/* Footer */}
      {!isLoading && transactions.length > 0 && (
        <div className="mt-4 rounded-b-xl bg-gradient-to-b from-transparent to-surface-container-low/50 p-8 text-center">
          <p className="font-body text-sm text-on-surface-variant/60">
            {t('showingLast30Days')}
          </p>
        </div>
      )}
    </div>
  );
}
