import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RedemptionRepository } from '../redemption.repository';
import { RedemptionEntity } from './entities/redemption.entity';
import { RedemptionsRelationalRepository } from './repositories/redemptions.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RedemptionEntity])],
  providers: [
    {
      provide: RedemptionRepository,
      useClass: RedemptionsRelationalRepository,
    },
  ],
  exports: [RedemptionRepository],
})
export class RelationalRedemptionPersistenceModule {}
