'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ActivityTransaction } from '../types';

import { ActivityItem } from './activity-item';

interface RecentActivityProps {
  transactions: ActivityTransaction[];
}

export function RecentActivity({ transactions }: RecentActivityProps) {
  const t = useTranslations('loyaltyCards');
  const visible = transactions.slice(0, 2);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold tracking-tight">
          {t('recentActivity')}
        </h2>
        <Link
          href="/history"
          className="font-label text-xs font-bold uppercase tracking-widest text-primary"
        >
          {t('seeAll')}
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-on-surface-variant">
          {t('noActivity')}
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((tx) => (
            <ActivityItem key={tx.id} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
