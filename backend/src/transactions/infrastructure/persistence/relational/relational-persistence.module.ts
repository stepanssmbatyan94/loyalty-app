import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TransactionRepository } from '../transaction.repository';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionsRelationalRepository } from './repositories/transactions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
  providers: [
    {
      provide: TransactionRepository,
      useClass: TransactionsRelationalRepository,
    },
  ],
  exports: [TransactionRepository],
})
export class RelationalTransactionPersistenceModule {}
