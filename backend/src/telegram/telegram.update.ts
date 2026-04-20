import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard, Keyboard } from 'grammy';

import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { AllConfigType } from '../config/config.type';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { UsersService } from '../users/users.service';

const LANG_MESSAGES: Record<
  string,
  { chooseLanguage: string; welcome: string; openApp: string }
> = {
  en: {
    chooseLanguage: '🌐 Please choose your language:',
    welcome:
      'Welcome to Beer House Loyalty! 🍺\nYour loyalty card is ready. Open the app to check your points.',
    openApp: '🍺 Open App',
  },
  ru: {
    chooseLanguage: '🌐 Пожалуйста, выберите язык:',
    welcome:
      'Добро пожаловать в Beer House Loyalty! 🍺\nВаша карта лояльности готова. Откройте приложение, чтобы проверить баллы.',
    openApp: '🍺 Открыть приложение',
  },
  hy: {
    chooseLanguage: '🌐 Խնդրում ենք ընտրել լեզուն:',
    welcome:
      'Բարի գալուստ Beer House Loyalty! 🍺\nՁեր հավատարմության քարտը պատրաստ է. Բացեք հավելվածը՝ ձեր կետերը ստուգելու համար:',
    openApp: '🍺 Բացել հավելվածը',
  },
};

@Injectable()
export class TelegramUpdate {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  register(bot: Bot, businessId?: string): void {
    bot.command('start', async (ctx) => {
      const keyboard = new InlineKeyboard()
        .text('English 🇺🇸', 'lang:en')
        .text('Русский 🇷🇺', 'lang:ru')
        .text('Հայերեն 🇦🇲', 'lang:hy');

      await ctx.reply(LANG_MESSAGES['en'].chooseLanguage, {
        reply_markup: keyboard,
      });
    });

    bot.callbackQuery(/^lang:(en|ru|hy)$/, async (ctx) => {
      // Acknowledge immediately — Telegram times out after ~10 s
      await ctx.answerCallbackQuery();

      const lang = ctx.match[1];
      const from = ctx.from;

      if (!from) return;

      let user = await this.usersService.findBySocialIdAndProvider({
        socialId: String(from.id),
        provider: AuthProvidersEnum.telegram,
      });

      if (!user) {
        user = await this.usersService.create({
          email: null,
          firstName: from.first_name ?? null,
          lastName: from.last_name ?? null,
          socialId: String(from.id),
          provider: AuthProvidersEnum.telegram,
          role: { id: RoleEnum.user },
          status: { id: StatusEnum.active },
        });
      }

      await this.usersService.update(user.id, { language: lang });

      const messages = LANG_MESSAGES[lang] ?? LANG_MESSAGES['en'];
      const miniAppUrl = this.configService.get('auth.telegramMiniAppUrl', {
        infer: true,
      });

      // web_app button requires a direct https:// URL, not a t.me link
      const isValidWebAppUrl =
        miniAppUrl?.startsWith('https://') &&
        !miniAppUrl.startsWith('https://t.me');

      if (isValidWebAppUrl) {
        const urlWithBusiness = businessId
          ? `${miniAppUrl}?startapp=${businessId}`
          : miniAppUrl!;
        const keyboard = new Keyboard()
          .webApp(messages.openApp, urlWithBusiness)
          .resized();

        await ctx.reply(messages.welcome, { reply_markup: keyboard });
      } else {
        await ctx.reply(messages.welcome);
      }
    });
  }
}
