import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { BusinessesService } from '../businesses/businesses.service';
import { TelegramService } from './telegram.service';

@ApiTags('Telegram')
@Controller({ path: 'telegram', version: '1' })
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly businessesService: BusinessesService,
  ) {}

  @Post(':businessId/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('businessId') businessId: string,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string,
    @Body() update: unknown,
  ): Promise<void> {
    const business = await this.businessesService.findById(businessId);
    if (!business || business.webhookSecret !== secretToken) {
      throw new UnauthorizedException();
    }
    await this.telegramService.handleUpdate(businessId, update);
  }
}
