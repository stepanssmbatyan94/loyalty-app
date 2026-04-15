import { Module } from '@nestjs/common';

import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { RelationalBusinessPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

const infrastructurePersistenceModule = RelationalBusinessPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService, infrastructurePersistenceModule],
})
export class BusinessesModule {}
