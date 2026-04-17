import { Module } from '@nestjs/common';

import { RelationalTransactionPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

const infrastructurePersistenceModule = RelationalTransactionPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService, infrastructurePersistenceModule],
})
export class TransactionsModule {}
