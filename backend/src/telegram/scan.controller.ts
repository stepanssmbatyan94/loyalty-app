import {
  Controller,
  Get,
  HttpStatus,
  Param,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

import { BusinessesService } from '../businesses/businesses.service';
import { LoyaltyCardsService } from '../loyalty-cards/loyalty-cards.service';
import { ScanTokensService } from '../scan-tokens/scan-tokens.service';
import { UsersService } from '../users/users.service';
import { TelegramService } from './telegram.service';

@ApiTags('Scan')
@Controller({ path: 'scan', version: '1' })
export class ScanController {
  constructor(
    private readonly scanTokensService: ScanTokensService,
    private readonly loyaltyCardsService: LoyaltyCardsService,
    private readonly usersService: UsersService,
    private readonly businessesService: BusinessesService,
    private readonly telegramService: TelegramService,
  ) {}

  @Get(':cardId/:token')
  async handleScan(
    @Param('cardId') cardId: string,
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    const record = await this.scanTokensService.consume(cardId, token);
    if (!record) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .send(
          'Invalid or expired QR code. Please refresh the app and try again.',
        );
      return;
    }

    const card = await this.loyaltyCardsService.findById(cardId);
    const business = await this.businessesService.findById(record.businessId);

    if (!card || !business?.telegramGroupChatId) {
      res.status(HttpStatus.BAD_REQUEST).send('Business not configured.');
      return;
    }

    const user = await this.usersService.findById(card.customerId);
    const customerName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      'Customer';

    await this.telegramService.sendEarnPrompt({
      businessId: record.businessId,
      chatId: business.telegramGroupChatId,
      cardId: card.id,
      customerId: card.customerId,
      customerName,
      balance: card.points,
      earnRateMode: business.earnRateMode,
      earnRateValue: business.earnRateValue,
    });

    const groupId = business.telegramGroupChatId.replace('-100', '');
    res.redirect(302, `https://t.me/c/${groupId}`);
  }
}
