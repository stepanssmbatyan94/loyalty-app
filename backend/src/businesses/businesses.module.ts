import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { LocaleMiddleware } from '../common/middleware/locale.middleware';
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
export class BusinessesModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LocaleMiddleware).forRoutes(BusinessesController);
  }
}
