import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InlineKeyboard } from 'grammy';

import { BusinessesService } from '../../businesses/businesses.service';
import { UsersService } from '../../users/users.service';
import { TelegramService } from '../telegram.service';
import {
  EarnConfirmedEvent,
  LoyaltyCardCreatedEvent,
  RedemptionConfirmedEvent,
  RedemptionExpiredEvent,
} from './notification-events';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly usersService: UsersService,
    private readonly businessesService: BusinessesService,
  ) {}

  private async getTelegramId(customerId: number): Promise<number | null> {
    const user = await this.usersService.findById(customerId);
    if (!user?.socialId) return null;
    return Number(user.socialId);
  }

  @OnEvent('loyalty_card.created')
  async handleCardCreated(payload: LoyaltyCardCreatedEvent): Promise<void> {
    const [telegramId, business] = await Promise.all([
      this.getTelegramId(payload.customerId),
      this.businessesService.findById(payload.businessId),
    ]);

    if (!telegramId || !business) return;

    const bot = this.telegramService.getBot(payload.businessId);
    if (!bot) return;

    const miniAppUrl = process.env.AUTH_TELEGRAM_MINI_APP_URL ?? '';
    const keyboard =
      miniAppUrl.startsWith('https://') && !miniAppUrl.startsWith('https://t.me')
        ? new InlineKeyboard().webApp('🎯 Open My Card', miniAppUrl)
        : undefined;

    await bot.api
      .sendMessage(
        telegramId,
        `👋 Welcome to ${business.name} Loyalty Program!\n\n` +
          `You've been enrolled and start with 0 points.\n` +
          `Earn points every visit and redeem them for rewards. 🍺`,
        keyboard ? { reply_markup: keyboard } : {},
      )
      .catch((e: Error) =>
        this.logger.warn(
          `Welcome notification failed for telegramId ${telegramId}: ${e.message}`,
        ),
      );
  }

  @OnEvent('earn.confirmed')
  async handleEarnConfirmed(payload: EarnConfirmedEvent): Promise<void> {
    const [telegramId, business] = await Promise.all([
      this.getTelegramId(payload.customerId),
      this.businessesService.findById(payload.businessId),
    ]);

    if (!telegramId || !business) return;

    const bot = this.telegramService.getBot(payload.businessId);
    if (!bot) return;

    const miniAppUrl = process.env.AUTH_TELEGRAM_MINI_APP_URL ?? '';
    const keyboard =
      miniAppUrl.startsWith('https://') && !miniAppUrl.startsWith('https://t.me')
        ? new InlineKeyboard().webApp('🎯 View My Card', miniAppUrl)
        : undefined;

    await bot.api
      .sendMessage(
        telegramId,
        `✅ +${payload.pointsAdded} points at ${business.name}!\n\n` +
          `💰 Your balance: ${payload.newBalance.toLocaleString()} pts`,
        keyboard ? { reply_markup: keyboard } : {},
      )
      .catch((e: Error) =>
        this.logger.warn(
          `Earn notification failed for telegramId ${telegramId}: ${e.message}`,
        ),
      );
  }

  @OnEvent('redemption.confirmed')
  async handleRedemptionConfirmed(
    payload: RedemptionConfirmedEvent,
  ): Promise<void> {
    const [telegramId, business] = await Promise.all([
      this.getTelegramId(payload.customerId),
      this.businessesService.findById(payload.businessId),
    ]);

    if (!telegramId || !business) return;

    const bot = this.telegramService.getBot(payload.businessId);
    if (!bot) return;

    const miniAppUrl = process.env.AUTH_TELEGRAM_MINI_APP_URL ?? '';
    const keyboard =
      miniAppUrl.startsWith('https://') && !miniAppUrl.startsWith('https://t.me')
        ? new InlineKeyboard().webApp('🎯 View My Card', miniAppUrl)
        : undefined;

    await bot.api
      .sendMessage(
        telegramId,
        `🎉 Redemption confirmed!\n\n` +
          `✅ ${payload.rewardName} at ${business.name}\n` +
          `-${payload.pointsSpent} pts\n\n` +
          `💰 Remaining balance: ${payload.remainingBalance.toLocaleString()} pts`,
        keyboard ? { reply_markup: keyboard } : {},
      )
      .catch((e: Error) =>
        this.logger.warn(
          `Redemption confirmed notification failed for telegramId ${telegramId}: ${e.message}`,
        ),
      );
  }

  @OnEvent('redemption.expired')
  async handleRedemptionExpired(
    payload: RedemptionExpiredEvent,
  ): Promise<void> {
    const telegramId = await this.getTelegramId(payload.customerId);
    if (!telegramId) return;

    const bot = this.telegramService.getBot(payload.businessId);
    if (!bot) return;

    await bot.api
      .sendMessage(
        telegramId,
        `⏱ Your redemption code for ${payload.rewardName} has expired.\n\n` +
          `${payload.pointsRefunded} pts have been returned to your balance.\n` +
          `💰 Current balance: ${payload.newBalance.toLocaleString()} pts`,
      )
      .catch((e: Error) =>
        this.logger.warn(
          `Expiry notification failed for telegramId ${telegramId}: ${e.message}`,
        ),
      );
  }
}
