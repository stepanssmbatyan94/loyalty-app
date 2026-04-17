import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RewardRepository } from '../reward.repository';
import { RewardTranslationRepository } from '../reward-translation.repository';
import { RewardEntity } from './entities/reward.entity';
import { RewardTranslationEntity } from './entities/reward-translation.entity';
import { RewardsRelationalRepository } from './repositories/rewards.repository';
import { RewardTranslationsRelationalRepository } from './repositories/reward-translations.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RewardEntity, RewardTranslationEntity])],
  providers: [
    {
      provide: RewardRepository,
      useClass: RewardsRelationalRepository,
    },
    {
      provide: RewardTranslationRepository,
      useClass: RewardTranslationsRelationalRepository,
    },
  ],
  exports: [RewardRepository, RewardTranslationRepository],
})
export class RelationalRewardPersistenceModule {}
