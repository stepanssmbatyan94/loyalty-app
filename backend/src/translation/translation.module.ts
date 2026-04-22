import { Module } from '@nestjs/common';

import { RelationalBusinessPersistenceModule } from '../businesses/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalRewardPersistenceModule } from '../rewards/infrastructure/persistence/relational/relational-persistence.module';
import { TranslationService } from './translation.service';

@Module({
  imports: [
    RelationalBusinessPersistenceModule,
    RelationalRewardPersistenceModule,
  ],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
