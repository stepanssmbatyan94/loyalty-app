import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessRepository } from '../business.repository';
import { BusinessEntity } from './entities/business.entity';
import { BusinessesRelationalRepository } from './repositories/businesses.repository';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity])],
  providers: [
    {
      provide: BusinessRepository,
      useClass: BusinessesRelationalRepository,
    },
  ],
  exports: [BusinessRepository],
})
export class RelationalBusinessPersistenceModule {}
