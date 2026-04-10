import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { AllConfigType } from '../config/config.type';
import { TelegramUpdate } from './telegram.update';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Bot;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly telegramUpdate: TelegramUpdate,
  ) {}

  onModuleInit(): void {
    const token = this.configService.get('auth.telegramBotToken', {
      infer: true,
    });

    if (!token) {
      return;
    }

    this.bot = new Bot(token);
    this.bot.catch((err) => {
      console.error('Bot error:', err.message);
    });
    this.telegramUpdate.register(this.bot);

    const miniAppUrl = this.configService.get('auth.telegramMiniAppUrl', {
      infer: true,
    });

    const isValidWebAppUrl =
      miniAppUrl?.startsWith('https://') &&
      !miniAppUrl.startsWith('https://t.me');

    if (isValidWebAppUrl) {
      void this.bot.api.setChatMenuButton({
        menu_button: {
          type: 'web_app',
          text: 'Open',
          web_app: { url: miniAppUrl! },
        },
      });
    }

    void this.bot.start();
  }

  onModuleDestroy(): void {
    if (this.bot) {
      void this.bot.stop();
    }
  }
}
