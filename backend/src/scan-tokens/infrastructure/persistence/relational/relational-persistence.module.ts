import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ScanTokenRepository } from '../scan-token.repository';
import { ScanTokenEntity } from './entities/scan-token.entity';
import { ScanTokensRelationalRepository } from './repositories/scan-tokens.relational.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ScanTokenEntity])],
  providers: [
    {
      provide: ScanTokenRepository,
      useClass: ScanTokensRelationalRepository,
    },
  ],
  exports: [ScanTokenRepository],
})
export class RelationalScanTokenPersistenceModule {}
