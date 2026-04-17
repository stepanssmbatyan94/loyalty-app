import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessEntity } from '../../../../businesses/infrastructure/persistence/relational/entities/business.entity';
import { RewardEntity } from '../../../../rewards/infrastructure/persistence/relational/entities/reward.entity';
import { RewardSeedService } from './reward-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity, RewardEntity])],
  providers: [RewardSeedService],
  exports: [RewardSeedService],
})
export class RewardSeedModule {}
