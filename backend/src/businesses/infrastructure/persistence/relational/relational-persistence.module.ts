import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessRepository } from '../business.repository';
import { BusinessTranslationRepository } from '../business-translation.repository';
import { BusinessEntity } from './entities/business.entity';
import { BusinessTranslationEntity } from './entities/business-translation.entity';
import { BusinessesRelationalRepository } from './repositories/businesses.repository';
import { BusinessTranslationsRelationalRepository } from './repositories/business-translations.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessEntity, BusinessTranslationEntity]),
  ],
  providers: [
    {
      provide: BusinessRepository,
      useClass: BusinessesRelationalRepository,
    },
    {
      provide: BusinessTranslationRepository,
      useClass: BusinessTranslationsRelationalRepository,
    },
  ],
  exports: [BusinessRepository, BusinessTranslationRepository],
})
export class RelationalBusinessPersistenceModule {}
