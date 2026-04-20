import { forwardRef, Module } from '@nestjs/common';

import { RewardsModule } from '../rewards/rewards.module';
import { RelationalLoyaltyCardPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { LoyaltyCardsController } from './loyalty-cards.controller';
import { LoyaltyCardsService } from './loyalty-cards.service';

const infrastructurePersistenceModule = RelationalLoyaltyCardPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, forwardRef(() => RewardsModule)],
  controllers: [LoyaltyCardsController],
  providers: [LoyaltyCardsService],
  exports: [LoyaltyCardsService, infrastructurePersistenceModule],
})
export class LoyaltyCardsModule {}
