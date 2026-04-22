import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Bot, InlineKeyboard, Keyboard } from 'grammy';

import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { BusinessesService } from '../businesses/businesses.service';
import { AllConfigType } from '../config/config.type';
import { LoyaltyCardsService } from '../loyalty-cards/loyalty-cards.service';
import { RedemptionsService } from '../redemptions/redemptions.service';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { EarnConfirmedEvent } from './notifications/notification-events';
import { TransactionsService } from '../transactions/transactions.service';
import { UsersService } from '../users/users.service';
import { PendingEarnContext } from './telegram.service';

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

const LOCALE_BUTTON_LABELS: Record<string, string> = {
  en: 'English 🇺🇸',
  ru: 'Русский 🇷🇺',
  hy: 'Հայերեն 🇦🇲',
};

const SIX_DIGIT_RE = /^\d{6}$/;

@Injectable()
export class TelegramUpdate {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly businessesService: BusinessesService,
    private readonly loyaltyCardsService: LoyaltyCardsService,
    private readonly transactionsService: TransactionsService,
    private readonly redemptionsService: RedemptionsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  register(
    bot: Bot,
    businessId: string | undefined,
    pendingEarns: Map<string, PendingEarnContext>,
  ): void {
    // ── /start ──────────────────────────────────────────────────────────────
    bot.command('start', async (ctx) => {
      const business = businessId
        ? await this.businessesService.findById(businessId)
        : null;

      const locales = business?.supportedLocales?.length
        ? business.supportedLocales
        : ['en', 'ru', 'hy'];

      const keyboard = new InlineKeyboard();
      for (const locale of locales) {
        keyboard.text(LOCALE_BUTTON_LABELS[locale] ?? locale, `lang:${locale}`);
      }

      const promptLocale = business?.defaultLocale ?? 'en';
      const promptText =
        LANG_MESSAGES[promptLocale]?.chooseLanguage ??
        LANG_MESSAGES['en'].chooseLanguage;

      await ctx.reply(promptText, { reply_markup: keyboard });
    });

    // ── lang:* callback ──────────────────────────────────────────────────────
    bot.callbackQuery(/^lang:([a-z]{2,5})$/, async (ctx) => {
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

      const business = businessId
        ? await this.businessesService.findById(businessId)
        : null;

      const defaultLocale = business?.defaultLocale ?? 'en';
      const dbWelcome = business
        ? await this.businessesService.getTranslatedField(
            business.id,
            lang,
            'welcomeMessage',
            defaultLocale,
          )
        : null;

      const fallbackMessages = LANG_MESSAGES[lang] ?? LANG_MESSAGES['en'];
      const welcomeText = dbWelcome ?? fallbackMessages.welcome;

      const miniAppUrl = this.configService.get('auth.telegramMiniAppUrl', {
        infer: true,
      });

      const isValidWebAppUrl =
        miniAppUrl?.startsWith('https://') &&
        !miniAppUrl.startsWith('https://t.me');

      if (isValidWebAppUrl) {
        const urlWithBusiness = businessId
          ? `${miniAppUrl}?startapp=${businessId}`
          : miniAppUrl!;
        const keyboard = new Keyboard()
          .webApp(fallbackMessages.openApp, urlWithBusiness)
          .resized();

        await ctx.reply(welcomeText, { reply_markup: keyboard });
      } else {
        await ctx.reply(welcomeText);
      }
    });

    // ── /balance command ─────────────────────────────────────────────────────
    bot.command('balance', async (ctx) => {
      if (!businessId) return;

      const query = ctx.match?.trim();
      if (!query) {
        await ctx.reply('Usage: /balance <customer name>');
        return;
      }

      const results = await this.loyaltyCardsService.searchCustomers(
        businessId,
        query,
      );

      if (!results.length) {
        await ctx.reply(`No customer found for "${query}"`);
        return;
      }

      const lines = results.map(
        (c) =>
          `👤 ${[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown'}\n` +
          `💰 Balance: *${c.points} pts* | Total earned: ${c.totalPointsEarned} pts`,
      );

      await ctx.reply(lines.join('\n\n'), { parse_mode: 'Markdown' });
    });

    // ── /history command ─────────────────────────────────────────────────────
    bot.command('history', async (ctx) => {
      if (!businessId) return;

      const txs = await this.transactionsService.findRecentByBusinessId(
        businessId,
        10,
      );

      if (!txs.length) {
        await ctx.reply('No transactions yet.');
        return;
      }

      const lines = txs.map((tx, i) => {
        const sign = tx.type === 'earn' ? '🟢 +' : '🔴 -';
        const label = tx.note ?? tx.type;
        const time = tx.createdAt.toLocaleTimeString('en', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${i + 1}. ${sign}${tx.points} pts — ${label} (${time})`;
      });

      await ctx.reply(`📋 *Last 10 transactions:*\n\n${lines.join('\n')}`, {
        parse_mode: 'Markdown',
      });
    });

    // ── earn_confirm callback ────────────────────────────────────────────────
    bot.callbackQuery(/^earn_confirm:([^:]+):(\d+):(\d+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const [, cardId, ptsStr, cashierIdStr] = ctx.match;
      const pts = parseInt(ptsStr, 10);
      const cashierTelegramId = parseInt(cashierIdStr, 10);

      const updatedCard = await this.loyaltyCardsService.addPoints(cardId, pts);
      await this.transactionsService.create({
        cardId,
        type: 'earn',
        points: pts,
        cashierTelegramId,
        rewardId: null,
        note: null,
      });

      this.eventEmitter.emit('earn.confirmed', {
        customerId: updatedCard.customerId,
        businessId: businessId ?? updatedCard.businessId,
        pointsAdded: pts,
        newBalance: updatedCard.points,
      } satisfies EarnConfirmedEvent);

      await ctx.editMessageText(
        `✅ *${pts} pts added!*\nNew balance: ${updatedCard.points} pts`,
        { parse_mode: 'Markdown' },
      );
    });

    // ── earn_cancel callback ─────────────────────────────────────────────────
    bot.callbackQuery(/^earn_cancel:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.editMessageText('❌ Cancelled.');
    });

    // ── redeem_confirm callback ──────────────────────────────────────────────
    bot.callbackQuery(/^redeem_confirm:([^:]+):(\d+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const [, code, cashierIdStr] = ctx.match;
      const cashierTelegramId = parseInt(cashierIdStr, 10);

      try {
        await this.redemptionsService.confirm(code, cashierTelegramId);
        await ctx.editMessageText('✅ Redemption confirmed!');
      } catch {
        await ctx.editMessageText(
          '❌ Could not confirm — code may have expired.',
        );
      }
    });

    // ── redeem_reject callback ───────────────────────────────────────────────
    bot.callbackQuery(/^redeem_reject:(.+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const code = ctx.match[1];
      try {
        await this.redemptionsService.cancel(code, true);
        await ctx.editMessageText(
          '❌ Redemption rejected. Points returned to customer.',
        );
      } catch {
        await ctx.editMessageText(
          '❌ Could not reject — code may have already expired or been confirmed.',
        );
      }
    });

    // ── staff group text messages (redemption code or purchase amount) ───────
    bot.on('message:text', async (ctx) => {
      if (!businessId) return;

      const business = await this.businessesService.findById(businessId);
      if (
        !business?.telegramGroupChatId ||
        String(ctx.chat.id) !== business.telegramGroupChatId
      ) {
        return;
      }

      const text = ctx.message.text.trim();

      // B-22: 6-digit redemption code
      if (SIX_DIGIT_RE.test(text)) {
        const result =
          await this.redemptionsService.findByCodeForValidation(text);

        if (!result || result.status !== 'valid') {
          await ctx.reply(
            `❌ Code *${text}* is ${result?.status ?? 'invalid'}.`,
            { parse_mode: 'Markdown' },
          );
          return;
        }

        const keyboard = new InlineKeyboard()
          .text(
            `✅ Confirm: ${result.rewardName}`,
            `redeem_confirm:${text}:${ctx.from?.id ?? 0}`,
          )
          .text('❌ Reject', `redeem_reject:${text}`);

        await ctx.reply(
          `🎁 *Redemption Code:* ${text}\n` +
            `*Reward:* ${result.rewardName}\n` +
            `*Cost:* ${result.pointsCost} pts\n` +
            `⏱ ${result.secondsRemaining}s remaining`,
          { reply_markup: keyboard, parse_mode: 'Markdown' },
        );
        return;
      }

      // B-20: purchase amount entry
      const pending = pendingEarns.get(String(ctx.chat.id));
      if (!pending || pending.expiresAt < new Date()) return;

      const amount = parseFloat(text.replace(',', '.'));
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply('Please enter a valid amount in AMD.');
        return;
      }

      const pts =
        pending.earnRateMode === 'fixed_per_visit'
          ? pending.earnRateValue
          : Math.floor(amount / pending.earnRateValue);

      if (pts <= 0) {
        await ctx.reply(
          `Amount too small. Minimum: ${pending.earnRateValue} AMD.`,
        );
        return;
      }

      const keyboard = new InlineKeyboard()
        .text(
          `✅ Add ${pts} pts`,
          `earn_confirm:${pending.cardId}:${pts}:${ctx.from?.id ?? 0}`,
        )
        .text('❌ Cancel', `earn_cancel:${pending.cardId}`);

      pendingEarns.delete(String(ctx.chat.id));

      await ctx.reply(
        `🍺 *${pending.customerName}*\n` +
          `Amount: ${amount} AMD → *${pts} pts*\n\n` +
          `Confirm adding points?`,
        { reply_markup: keyboard, parse_mode: 'Markdown' },
      );
    });
  }
}
