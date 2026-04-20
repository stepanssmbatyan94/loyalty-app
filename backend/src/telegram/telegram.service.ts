import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { BusinessesService } from '../businesses/businesses.service';
import { AllConfigType } from '../config/config.type';
import { TelegramUpdate } from './telegram.update';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bots = new Map<string, Bot>();

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

      this.telegramUpdate.register(bot, business.id);
      if (isValidWebAppUrl) {
        void bot.api.setChatMenuButton({
          menu_button: {
            type: 'web_app',
            text: 'Open 12121',
            web_app: { url: `${miniAppUrl}?startapp=${business.id}` },
          },
        });
      }

      void bot.start();
      this.bots.set(business.id, bot);
      console.log(
        `[TelegramService] bot started for business ${business.id} (@${business.botUsername})`,
      );
    }
  }

  onModuleDestroy(): void {
    for (const bot of this.bots.values()) {
      void bot.stop();
    }
  }
}
