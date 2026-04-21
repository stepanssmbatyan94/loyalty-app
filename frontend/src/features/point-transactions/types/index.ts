export interface Transaction {
  id: string;
  cardId: string;
  type: 'earn' | 'redeem';
  points: number;
  note: string | null;
  rewardId: string | null;
  cashierTelegramId: number | null;
  createdAt: string;
}

export type FilterPeriod = 'all' | 'month' | 'week';

export interface TransactionFilters {
  type?: 'earn' | 'redeem';
  from?: string;
  to?: string;
}
