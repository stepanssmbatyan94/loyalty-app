import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoyaltyCardRepository } from '../loyalty-card.repository';
import { LoyaltyCardEntity } from './entities/loyalty-card.entity';
import { LoyaltyCardsRelationalRepository } from './repositories/loyalty-cards.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyCardEntity])],
  providers: [
    {
      provide: LoyaltyCardRepository,
      useClass: LoyaltyCardsRelationalRepository,
    },
  ],
  exports: [LoyaltyCardRepository],
})
export class RelationalLoyaltyCardPersistenceModule {}
