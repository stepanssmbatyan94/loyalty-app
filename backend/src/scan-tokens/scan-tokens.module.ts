import { Module } from '@nestjs/common';

import { RelationalScanTokenPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ScanTokensService } from './scan-tokens.service';

const infrastructurePersistenceModule = RelationalScanTokenPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  providers: [ScanTokensService],
  exports: [ScanTokensService],
})
export class ScanTokensModule {}
