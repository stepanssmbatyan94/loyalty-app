import { Module } from '@nestjs/common';

import { RelationalRewardPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

const infrastructurePersistenceModule = RelationalRewardPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService, infrastructurePersistenceModule],
})
export class RewardsModule {}
