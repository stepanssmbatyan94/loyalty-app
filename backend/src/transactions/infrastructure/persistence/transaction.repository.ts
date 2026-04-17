import { Transaction } from '../../domain/transaction';

export abstract class TransactionRepository {
  abstract create(
    data: Omit<Transaction, 'id' | 'createdAt'>,
  ): Promise<Transaction>;

  abstract findManyByCardId(
    cardId: string,
    options?: {
      type?: 'earn' | 'redeem';
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<Transaction[]>;

  abstract findRecentByBusinessId(
    businessId: string,
    limit: number,
  ): Promise<Transaction[]>;
}
