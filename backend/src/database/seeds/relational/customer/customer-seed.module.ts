import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessEntity } from '../../../../businesses/infrastructure/persistence/relational/entities/business.entity';
import { LoyaltyCardEntity } from '../../../../loyalty-cards/infrastructure/persistence/relational/entities/loyalty-card.entity';
import { TransactionEntity } from '../../../../transactions/infrastructure/persistence/relational/entities/transaction.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { CustomerSeedService } from './customer-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      BusinessEntity,
      LoyaltyCardEntity,
      TransactionEntity,
    ]),
  ],
  providers: [CustomerSeedService],
  exports: [CustomerSeedService],
})
export class CustomerSeedModule {}
