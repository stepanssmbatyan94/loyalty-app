import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Transaction } from '../../../../domain/transaction';
import { TransactionRepository } from '../../transaction.repository';
import { TransactionEntity } from '../entities/transaction.entity';
import { TransactionMapper } from '../mappers/transaction.mapper';

@Injectable()
export class TransactionsRelationalRepository implements TransactionRepository {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  async create(
    data: Omit<Transaction, 'id' | 'createdAt'>,
  ): Promise<Transaction> {
    const entity = this.repo.create(
      TransactionMapper.toPersistence(data as Transaction),
    );
    const saved = await this.repo.save(entity);
    return TransactionMapper.toDomain(saved);
  }

  async findManyByCardId(
    cardId: string,
    options: {
      type?: 'earn' | 'redeem';
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Transaction[]> {
    const qb = this.repo
      .createQueryBuilder('t')
      .where('t.cardId = :cardId', { cardId })
      .orderBy('t.createdAt', 'DESC');

    if (options.type) {
      qb.andWhere('t.type = :type', { type: options.type });
    }
    if (options.from) {
      qb.andWhere('t.createdAt >= :from', { from: options.from });
    }
    if (options.to) {
      qb.andWhere('t.createdAt <= :to', { to: options.to });
    }
    if (options.limit !== undefined) {
      qb.take(options.limit);
    }
    if (options.offset !== undefined) {
      qb.skip(options.offset);
    }

    const entities = await qb.getMany();
    return entities.map((e) => TransactionMapper.toDomain(e));
  }

  async findRecentByBusinessId(
    businessId: string,
    limit: number,
  ): Promise<Transaction[]> {
    const entities = await this.repo
      .createQueryBuilder('t')
      .innerJoin('loyalty_cards', 'lc', 'lc.id = t.cardId')
      .where('lc.businessId = :businessId', { businessId })
      .orderBy('t.createdAt', 'DESC')
      .take(limit)
      .getMany();

    return entities.map((e) => TransactionMapper.toDomain(e));
  }
}
