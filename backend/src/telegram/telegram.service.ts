import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Update } from '@grammyjs/types';
import { Bot, InlineKeyboard } from 'grammy';

import { BusinessesService } from '../businesses/businesses.service';
import { AllConfigType } from '../config/config.type';
import { TelegramUpdate } from './telegram.update';

export interface EarnPromptContext {
  businessId: string;
  chatId: string;
  cardId: string;
  customerId: number;
  customerName: string;
  balance: number;
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';
  earnRateValue: number;
}

export interface PendingEarnContext {
  cardId: string;
  customerId: number;
  customerName: string;
  balance: number;
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';
  earnRateValue: number;
  expiresAt: Date;
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bots = new Map<string, Bot>();
  private pendingEarns = new Map<string, PendingEarnContext>();
  private webhookMode = false;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly telegramUpdate: TelegramUpdate,
    private readonly businessesService: BusinessesService,
  ) {}

  async onModuleInit(): Promise<void> {
    const miniAppUrl = this.configService.get('auth.telegramMiniAppUrl', {
      infer: true,
    });

    const isValidWebAppUrl =
      miniAppUrl?.startsWith('https://') &&
      !miniAppUrl.startsWith('https://t.me');

    const webhookBaseUrl = this.configService.get(
      'auth.telegramWebhookBaseUrl',
      {
        infer: true,
      },
    );

    this.webhookMode = !!webhookBaseUrl;

    const businesses = await this.businessesService.findAllActive();
    console.log(
      `[TelegramService] active businesses found: ${businesses.length}`,
    );

    for (const business of businesses) {
      const tokenStatus = business.botToken ? '***set***' : 'NULL';
      console.log(
        `[TelegramService] business ${business.id} — botToken: ${tokenStatus} — botUsername: ${business.botUsername}`,
      );

      if (!business.botToken) {
        console.warn(
          `[TelegramService] skipping business ${business.id} — no botToken in DB. Run seed first.`,
        );
        continue;
      }

      const bot = new Bot(business.botToken);
      bot.catch((err) => {
        console.error(`[Bot:${business.id}] ${err.message}`);
      });

      this.telegramUpdate.register(bot, business.id, this.pendingEarns);

      if (isValidWebAppUrl) {
        void bot.api.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: 'Open App',
            web_app: { url: `${miniAppUrl}?startapp=${business.id}` },
          },
        });
      }

      if (this.webhookMode && business.webhookSecret) {
        await bot.api.setWebhook(
          `${webhookBaseUrl}/api/v1/telegram/${business.id}/webhook`,
          { secret_token: business.webhookSecret },
        );
        console.log(
          `[TelegramService] webhook set for business ${business.id}`,
        );
      } else {
        void bot.start();
        console.log(
          `[TelegramService] bot started (polling) for business ${business.id} (@${business.botUsername})`,
        );
      }

      this.bots.set(business.id, bot);
    }
  }

  onModuleDestroy(): void {
    if (!this.webhookMode) {
      for (const bot of this.bots.values()) {
        void bot.stop();
      }
    }
  }

  async registerBot(business: {
    id: string;
    botToken: string;
    botUsername: string | null;
    webhookSecret: string | null;
  }): Promise<void> {
    if (this.bots.has(business.id)) {
      const existing = this.bots.get(business.id)!;
      if (!this.webhookMode) existing.stop();
      this.bots.delete(business.id);
    }

    const bot = new Bot(business.botToken);
    bot.catch((err) => {
      console.error(`[Bot:${business.id}] ${err.message}`);
    });

    this.telegramUpdate.register(bot, business.id, this.pendingEarns);

    const webhookBaseUrl = this.configService.get(
      'auth.telegramWebhookBaseUrl',
      {
        infer: true,
      },
    );

    if (webhookBaseUrl && business.webhookSecret) {
      await bot.api.setWebhook(
        `${webhookBaseUrl}/api/v1/telegram/${business.id}/webhook`,
        { secret_token: business.webhookSecret },
      );
    } else {
      void bot.start();
    }

    this.bots.set(business.id, bot);
  }

  async handleUpdate(businessId: string, update: unknown): Promise<void> {
    const bot = this.bots.get(businessId);
    if (!bot) return;
    await bot.handleUpdate(update as Update);
  }

  async sendEarnPrompt(ctx: EarnPromptContext): Promise<void> {
    const bot = this.bots.get(ctx.businessId);
    if (!bot) {
      console.warn(
        `[TelegramService] no bot found for business ${ctx.businessId}`,
      );
      return;
    }

    if (ctx.earnRateMode === 'fixed_per_visit') {
      const pts = ctx.earnRateValue;
      const keyboard = new InlineKeyboard()
        .text(`✅ Add ${pts} pts`, `earn_confirm:${ctx.cardId}:${pts}:0`)
        .text('❌ Cancel', `earn_cancel:${ctx.cardId}`);

      await bot.api.sendMessage(
        ctx.chatId,
        `🍺 *Customer:* ${ctx.customerName}\n` +
          `*Balance:* ${ctx.balance} pts\n\n` +
          `Fixed reward: *+${pts} pts*\n\nConfirm adding points?`,
        { reply_markup: keyboard, parse_mode: 'Markdown' },
      );
      return;
    }

    const text =
      `🍺 *Customer:* ${ctx.customerName}\n` +
      `*Balance:* ${ctx.balance} pts\n\n` +
      `Enter purchase amount in AMD:`;

    await bot.api.sendMessage(ctx.chatId, text, { parse_mode: 'Markdown' });

    this.pendingEarns.set(String(ctx.chatId), {
      cardId: ctx.cardId,
      customerId: ctx.customerId,
      customerName: ctx.customerName,
      balance: ctx.balance,
      earnRateMode: ctx.earnRateMode,
      earnRateValue: ctx.earnRateValue,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
  }

  getBot(businessId: string): Bot | undefined {
    return this.bots.get(businessId);
  }

  getPendingEarn(chatId: string): PendingEarnContext | undefined {
    return this.pendingEarns.get(chatId);
  }

  clearPendingEarn(chatId: string): void {
    this.pendingEarns.delete(chatId);
  }
}
