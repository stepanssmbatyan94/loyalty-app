import { Injectable } from '@nestjs/common';

import { Transaction } from './domain/transaction';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionRepository } from './infrastructure/persistence/transaction.repository';

@Injectable()
export class TransactionsService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async create(
    data: Omit<Transaction, 'id' | 'createdAt'>,
  ): Promise<Transaction> {
    return this.transactionRepository.create(data);
  }

  async findManyByCardId(
    cardId: string,
    query: QueryTransactionDto,
  ): Promise<Transaction[]> {
    return this.transactionRepository.findManyByCardId(cardId, {
      type: query.type,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
  }

  async findRecentByBusinessId(
    businessId: string,
    limit = 20,
  ): Promise<Transaction[]> {
    return this.transactionRepository.findRecentByBusinessId(businessId, limit);
  }
}
