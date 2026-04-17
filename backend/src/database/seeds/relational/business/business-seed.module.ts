import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessEntity } from '../../../../businesses/infrastructure/persistence/relational/entities/business.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { BusinessSeedService } from './business-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, BusinessEntity])],
  providers: [BusinessSeedService],
  exports: [BusinessSeedService],
})
export class BusinessSeedModule {}
