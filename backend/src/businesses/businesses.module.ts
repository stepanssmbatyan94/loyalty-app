import { forwardRef, Module } from '@nestjs/common';

import { TelegramModule } from '../telegram/telegram.module';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { RelationalBusinessPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalBusinessPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, forwardRef(() => TelegramModule)],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService, infrastructurePersistenceModule],
})
export class BusinessesModule {}
