# Epic 7 — Telegram Bot (Cashier Tool)

The cashier's entire workflow runs through the business's dedicated Telegram Bot inside the staff group. See `docs/planning/telegram-bot-flows.md` for full interaction diagrams.

Each business has its own `BOT_TOKEN` stored in the `Business` entity. The backend registers a webhook for each bot at `POST /api/v1/telegram/webhook/:businessId`.

**Recommended library:** `grammy` (modern, TypeScript-first) or `node-telegram-bot-api`.

---

## B-18 — Telegram Bot Webhook Handler

**SP:** 5 | **Layer:** BE | **Status:** Todo
**Depends on:** B-03
**Blocks:** B-19–B-25

### Description
Core infrastructure for receiving and routing Telegram updates. The backend registers one webhook URL per business bot. All incoming updates are routed to a central handler that dispatches to the correct bot handler based on `businessId`.

### Files to create
- `backend/src/telegram/telegram.module.ts`
- `backend/src/telegram/telegram.controller.ts` — webhook endpoint
- `backend/src/telegram/telegram.service.ts` — bot instance management
- `backend/src/telegram/handlers/base-handler.ts` — abstract base
- `backend/src/telegram/dto/telegram-update.dto.ts`

### Implementation notes

**Install:**
```bash
npm install grammy
```

**Webhook endpoint:**
```ts
// telegram.controller.ts
@Post('telegram/webhook/:businessId')
@HttpCode(HttpStatus.OK)
async handleWebhook(
  @Param('businessId') businessId: string,
  @Body() update: TelegramUpdate,
  @Headers('x-telegram-bot-api-secret-token') secretToken: string,
) {
  await this.telegramService.handleUpdate(businessId, update, secretToken);
  return {}; // Always return 200 to Telegram
}
```

**Bot registry** (in `TelegramService`):
```ts
// Map of businessId → grammy Bot instance
private bots = new Map<string, Bot>();

async getOrCreateBot(business: Business): Promise<Bot> {
  if (this.bots.has(business.id)) return this.bots.get(business.id)!;
  const bot = new Bot(business.botToken);
  this.bots.set(business.id, bot);
  return bot;
}

async handleUpdate(businessId: string, update: Update, secret: string) {
  const business = await this.businessesService.findById(businessId);
  // Validate secret token matches business bot
  const bot = await this.getOrCreateBot(business);

  // Security: only process messages from registered group
  const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
  if (chatId?.toString() !== business.telegramGroupChatId) return;

  // Validate sender is a registered cashier
  const senderId = update.message?.from?.id ?? update.callback_query?.from?.id;
  const isRegisteredCashier = await this.usersService.isCashierByTelegramId(senderId, businessId);
  if (!isRegisteredCashier) return;

  // Dispatch to correct handler
  await bot.handleUpdate(update);
}
```

**Webhook registration** (called when business is created):
```ts
async registerWebhook(botToken: string, businessId: string) {
  const webhookUrl = `${this.configService.get('app.apiUrl')}/api/v1/telegram/webhook/${businessId}`;
  const secretToken = this.generateSecretToken(botToken); // store this to verify incoming requests
  await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, secret_token: secretToken }),
  });
}
```

### Acceptance criteria
- [ ] Webhook endpoint returns 200 for all valid Telegram updates
- [ ] Updates from unregistered groups are silently ignored
- [ ] Updates from unregistered cashier Telegram IDs are silently ignored
- [ ] Webhook registration works when called with a valid bot token

### Definition of done
- [ ] `grammy` in `package.json`
- [ ] `TelegramModule` registered in `AppModule`
- [ ] `npm run lint` passes

---

## B-19 — Bot: Handle Customer QR Scan

**SP:** 5 | **Layer:** BE | **Status:** Todo
**Depends on:** B-18, B-04, B-26
**Blocks:** B-20

### Description
When a cashier scans the customer's QR code, the browser opens a URL that triggers this handler. It validates the scan token, looks up the customer, and posts a "Enter amount" message to the business group.

### Files to create/modify
- `backend/src/loyalty-cards/loyalty-cards.controller.ts` — add `GET /scan/:cardId/:scanToken`
- `backend/src/telegram/handlers/scan-handler.ts`

### Implementation notes

**GET /scan/:cardId/:scanToken (no auth — secured by token):**
```ts
@Get('scan/:cardId/:scanToken')
@HttpCode(HttpStatus.OK)
async handleScan(
  @Param('cardId') cardId: string,
  @Param('scanToken') scanToken: string,
) {
  return this.loyaltyCardsService.handleScan(cardId, scanToken);
}
```

**`handleScan()` service method:**
```ts
async handleScan(cardId: string, scanToken: string) {
  // 1. Validate scan token
  const isValid = await this.scanTokenService.validateAndInvalidate(cardId, scanToken);
  if (!isValid) throw new GoneException({ errors: { scanToken: 'expired' } });

  // 2. Load card + customer info
  const card = await this.loyaltyCardsRepository.findById(cardId);
  const customer = await this.usersService.findById(card.customerId);
  const business = await this.businessesService.findById(card.businessId);

  // 3. Send message to Telegram group
  await this.telegramService.sendScanNotification(business, {
    cardId,
    customerName: `${customer.firstName} ${customer.lastName}`,
    currentBalance: card.points,
  });

  return { status: 'scan_accepted', customerName: `${customer.firstName} ${customer.lastName}` };
}
```

**Telegram group message sent:**
```
🍺 Loyalty Scan

Customer: Armen Petrosyan
Current balance: 2,450 pts

Enter purchase amount in AMD:
```

Store a pending scan context (in Redis or DB) keyed by `businessId + chatId` so the next numeric message from a cashier is associated with this scan.

### Acceptance criteria
- [ ] Valid scan token: sends message to group, returns 200
- [ ] Expired token: returns 410
- [ ] Already-used token: returns 409
- [ ] Group message contains customer name and current balance
- [ ] Pending scan context stored for amount entry step

### Definition of done
- [ ] Unit test: valid token, expired token, already-used
- [ ] `npm run lint` passes

---

## B-20 — Bot: Handle Cashier Amount Reply

**SP:** 5 | **Layer:** BE | **Status:** Todo
**Depends on:** B-19, B-03
**Blocks:** B-21

### Description
After the cashier types the AMD purchase amount in response to the scan notification, the bot reads it, calculates points using the business's earn rate, and sends a confirmation message with Approve/Cancel inline keyboard.

### Files to create/modify
- `backend/src/telegram/handlers/amount-handler.ts`
- Register handler in `TelegramService`

### Implementation notes

**Detect amount message:**
```ts
// In bot setup, listen for text messages that are numeric
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();

  // Check if there's a pending scan context for this chat
  const pendingScan = await this.pendingScanService.get(ctx.chat.id.toString());
  if (!pendingScan) return; // no pending scan, ignore

  const amount = parseInt(text, 10);
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply('⚠️ Please enter a valid amount in AMD (e.g. 3500)');
    return;
  }

  await this.handleAmountEntry(ctx, pendingScan, amount);
});
```

**`handleAmountEntry()`:**
```ts
const business = await this.businessesService.findById(pendingScan.businessId);
const pts = Math.floor(amount / business.earnRateValue); // floor(3500 / 100) = 35

// Clear pending scan context (amount entered)
await this.pendingScanService.clear(ctx.chat.id.toString());

// Send confirm message with inline keyboard
const confirmMessage = await ctx.reply(
  `✅ Confirm Points\n\nCustomer: ${pendingScan.customerName}\nPurchase: ${amount.toLocaleString()} AMD\nPoints to add: +${pts} pts\nNew balance: ${pendingScan.currentBalance + pts} pts`,
  {
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Approve', callback_data: `approve:${pendingScan.cardId}:${pts}` },
        { text: '❌ Cancel', callback_data: `cancel_earn:${pendingScan.cardId}` },
      ]],
    },
  }
);
```

**Edge cases:**
- Amount = 0: reply with error, clear pending scan
- Amount results in 0 pts (e.g. 50 AMD with earnRateValue 100): reply asking to enter larger amount

### Acceptance criteria
- [ ] Non-numeric message when no pending scan: ignored
- [ ] Numeric message with pending scan: sends confirm keyboard
- [ ] Points calculated correctly: `floor(amount / earnRateValue)`
- [ ] 0 pts result: error reply
- [ ] Confirmation message shows correct calculation

### Definition of done
- [ ] `npm run lint` passes

---

## B-21 — Bot: Handle Approve Callback

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-20, B-06
**Blocks:** nothing (completes the earn flow)

### Description
Cashier taps "✅ Approve" on the confirmation message. Bot calls the earn transaction endpoint, updates the message to show success, and triggers a customer notification.

### Files to create/modify
- `backend/src/telegram/handlers/approve-handler.ts`

### Implementation notes

```ts
bot.callbackQuery(/^approve:(.+):(\d+)$/, async (ctx) => {
  const [, cardId, ptsStr] = ctx.match;
  const pts = parseInt(ptsStr, 10);
  const cashierTelegramId = ctx.from.id;

  try {
    const result = await this.loyaltyCardsService.addPointsFromCashier({
      cardId, points: pts, cashierTelegramId,
    });

    await ctx.editMessageText(
      `✅ Points Added\n\nCustomer: ${result.customerName}\n+${pts} pts added\nNew balance: ${result.newBalance} pts`
    );
    await ctx.answerCallbackQuery(); // dismiss spinner on button

    // Trigger customer notification (B-33)
    await this.notificationsService.sendEarnNotification(cardId, pts, result.newBalance);
  } catch (e) {
    await ctx.editMessageText('❌ Failed to add points. Please try again.');
    await ctx.answerCallbackQuery('Error');
  }
});
```

**`addPointsFromCashier()` creates a Transaction record + updates card balance.**

**Cancel callback:**
```ts
bot.callbackQuery(/^cancel_earn:(.+)$/, async (ctx) => {
  await ctx.editMessageText('Transaction cancelled.');
  await ctx.answerCallbackQuery();
});
```

### Acceptance criteria
- [ ] Points added to card balance
- [ ] Transaction record created with `type: 'earn'` and `cashierTelegramId`
- [ ] Bot message updated to success state
- [ ] Cancel: message updated to "Transaction cancelled", no points added
- [ ] API failure: message updated to error state

### Definition of done
- [ ] `npm run lint` passes

---

## B-22 — Bot: Handle 6-Digit Redemption Code Input

**SP:** 5 | **Layer:** BE | **Status:** Todo
**Depends on:** B-18, B-14
**Blocks:** B-23

### Description
When a cashier types a 6-digit number in the group, the bot checks if it matches a pending redemption code. If yes, it calls the validate endpoint and shows the Confirm/Reject keyboard.

### Files to create/modify
- `backend/src/telegram/handlers/redemption-code-handler.ts`

### Implementation notes

**Detect 6-digit code:**
```ts
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();

  // 6-digit code pattern takes priority over amount entry
  if (/^\d{6}$/.test(text)) {
    await this.handleRedemptionCode(ctx, text);
    return;
  }

  // ... amount entry logic (B-20)
});
```

**`handleRedemptionCode()`:**
```ts
async handleRedemptionCode(ctx, code: string) {
  const validation = await this.redemptionsService.validateForBot(code);

  if (validation.status === 'expired') {
    await ctx.reply(`❌ Code ${code} has expired. Points were automatically refunded to the customer.`);
    return;
  }
  if (validation.status === 'already_used') {
    await ctx.reply(`❌ Code ${code} was already confirmed.`);
    return;
  }
  if (!validation) {
    await ctx.reply(`❌ Code ${code} not found. Double-check with the customer.`);
    return;
  }

  const minutesRemaining = Math.floor(validation.secondsRemaining / 60);
  const secondsRemaining = validation.secondsRemaining % 60;

  await ctx.reply(
    `🎁 Redemption Request\n\nReward: ${validation.rewardName}\nCustomer: ${validation.customerName}\nPoints cost: ${validation.pointsCost} pts\nExpires in: ${minutesRemaining}:${String(secondsRemaining).padStart(2, '0')}`,
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Confirm', callback_data: `confirm_redemption:${code}` },
          { text: '❌ Reject', callback_data: `reject_redemption:${code}` },
        ]],
      },
    }
  );
}
```

### Acceptance criteria
- [ ] 6-digit input triggers redemption lookup (not amount entry)
- [ ] Valid code: shows reward details + Confirm/Reject buttons
- [ ] Expired code: error message mentioning auto-refund
- [ ] Already-used code: error message
- [ ] Not-found code: error message

### Definition of done
- [ ] `npm run lint` passes

---

## B-23 — Bot: Handle Confirm Redemption Callback

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-22, B-15
**Blocks:** nothing (completes the redemption flow)

### Description
Cashier taps "✅ Confirm" on the redemption message. Bot calls `PATCH /redemptions/:code/confirm`, edits the message to success state, and triggers customer notification.

### Files to create/modify
- `backend/src/telegram/handlers/confirm-redemption-handler.ts`

### Implementation notes

```ts
bot.callbackQuery(/^confirm_redemption:(\d{6})$/, async (ctx) => {
  const code = ctx.match[1];
  const cashierTelegramId = ctx.from.id;

  try {
    const result = await this.redemptionsService.confirm(code, cashierTelegramId);

    await ctx.editMessageText(
      `✅ Redemption Confirmed\n\n${result.rewardName} — served to ${result.customerName}\n-${result.pointsDeducted} pts deducted`
    );
    await ctx.answerCallbackQuery('Confirmed!');

    // Trigger notification B-34
    await this.notificationsService.sendRedemptionNotification(result);
  } catch (e) {
    if (e.status === 410) {
      await ctx.editMessageText('❌ Code expired. Points already refunded.');
    } else {
      await ctx.editMessageText('❌ Failed to confirm. Please try again.');
    }
    await ctx.answerCallbackQuery('Error');
  }
});

// Reject callback
bot.callbackQuery(/^reject_redemption:(\d{6})$/, async (ctx) => {
  const code = ctx.match[1];
  await this.redemptionsService.cancel(code);
  await ctx.editMessageText('Redemption rejected. Points have been returned to the customer.');
  await ctx.answerCallbackQuery();
});
```

### Acceptance criteria
- [ ] Confirm: marks redemption as confirmed, creates Transaction, edits message
- [ ] Reject: cancels redemption, refunds points, edits message
- [ ] Confirming expired code: error message
- [ ] Customer notified on confirm (B-34)

### Definition of done
- [ ] `npm run lint` passes

---

## B-24 — Bot: /balance Command

**SP:** 2 | **Layer:** BE | **Status:** Todo
**Depends on:** B-18, B-04
**Blocks:** nothing

### Description
Cashier can look up a customer's balance without scanning a QR. Used when a customer asks about their balance verbally.

### Files to create/modify
- `backend/src/telegram/handlers/balance-command-handler.ts`

### Implementation notes

```ts
// Usage: /balance +37491234567  OR  /balance Armen
bot.command('balance', async (ctx) => {
  const query = ctx.match?.trim();
  if (!query) {
    await ctx.reply('Usage: /balance <phone number or name>');
    return;
  }

  const results = await this.loyaltyCardsService.searchCustomers(ctx.chat.id.toString(), query);

  if (results.length === 0) {
    await ctx.reply(`No customer found for "${query}"`);
    return;
  }

  const messages = results.slice(0, 3).map(c =>
    `👤 ${c.firstName} ${c.lastName} (${c.phone})\n💰 Balance: ${c.points} pts\n📈 Total earned: ${c.totalPointsEarned} pts`
  );
  await ctx.reply(messages.join('\n\n'));
});
```

### Acceptance criteria
- [ ] `/balance +37491234567` returns customer info + balance
- [ ] `/balance Armen` searches by name (partial match)
- [ ] No results: friendly "not found" message
- [ ] Multiple results: shows top 3

### Definition of done
- [ ] `npm run lint` passes

---

## B-25 — Bot: /history Command

**SP:** 2 | **Layer:** BE | **Status:** Todo
**Depends on:** B-18, B-06
**Blocks:** nothing

### Description
Shows the last 10 transactions across all cashiers at this business. Satisfies US-11 (cashier recent log).

### Implementation notes

```ts
bot.command('history', async (ctx) => {
  const business = await this.businessesService.findByGroupChatId(ctx.chat.id.toString());
  const transactions = await this.transactionsService.findRecentByBusiness(business.id, 10);

  if (transactions.length === 0) {
    await ctx.reply('No transactions yet today.');
    return;
  }

  const lines = transactions.map((t, i) => {
    const sign = t.type === 'earn' ? '+' : '-';
    const time = new Date(t.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    return `${i + 1}. ${t.label} — ${sign}${t.points} pts (${time})`;
  });

  await ctx.reply(`📋 Recent Transactions:\n\n${lines.join('\n')}`);
});
```

### Acceptance criteria
- [ ] Shows last 10 transactions ordered by `createdAt DESC`
- [ ] Each line shows: customer/reward label, ±points, time
- [ ] Empty state: "No transactions yet"

### Definition of done
- [ ] `npm run lint` passes

---

## B-26 — Scan Token Generation & Validation

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-04
**Blocks:** B-19, B-10 (QR URL in loyalty-cards/me)

### Description
Service for generating and validating short-lived, single-use HMAC scan tokens embedded in customer QR codes.

### Files to create
- `backend/src/loyalty-cards/scan-token.service.ts`

### Implementation notes

```ts
@Injectable()
export class ScanTokenService {
  private readonly SECRET = this.configService.get('app.scanTokenSecret');

  generate(cardId: string): string {
    const timestamp = Date.now().toString();
    const token = crypto
      .createHmac('sha256', this.SECRET)
      .update(`${cardId}:${timestamp}`)
      .digest('hex')
      .slice(0, 32);
    // Store token with TTL in DB: scan_tokens(token, card_id, expires_at, used)
    return token;
  }

  async validateAndInvalidate(cardId: string, token: string): Promise<boolean> {
    const record = await this.scanTokenRepository.findByToken(token);
    if (!record) return false;
    if (record.cardId !== cardId) return false;
    if (record.expiresAt < new Date()) return false; // expired
    if (record.used) return false; // already used

    await this.scanTokenRepository.markUsed(token);
    return true;
  }
}
```

**`scan_tokens` table:** `token (unique)`, `card_id`, `expires_at` (5 min TTL), `used (boolean)`

Add migration for this table to B-08 or create a separate migration here.

**Token refreshed:** Every time `GET /loyalty-cards/me` is called, a new scan token is generated and embedded in the `qrCodeUrl`. Old tokens expire after 5 minutes.

### Acceptance criteria
- [ ] Token is 32-character hex string (URL-safe)
- [ ] Token expires after 5 minutes
- [ ] Token can only be used once (second validation returns false)
- [ ] Wrong `cardId` for a valid token returns false

### Definition of done
- [ ] Unit test: generate, valid validation, expired, already-used, wrong cardId
- [ ] `npm run lint` passes

---

## F-21 — Customer QR Code Display

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-05, B-10 (returns `qrCodeUrl`)
**Blocks:** nothing

### Description
Display a scannable QR code on the Home screen loyalty card that the cashier scans to initiate the earn flow. The QR encodes the scan URL received from the API.

### Files to create/modify
- `frontend/src/features/loyalty-cards/components/loyalty-card-qr.tsx`
- `frontend/src/features/loyalty-cards/components/loyalty-card-hero.tsx` — add QR section

### Implementation notes

The QR is displayed below the loyalty card hero, or as a separate tap-to-show section to keep the UI clean. Design doesn't show a separate QR section — add a small "Show QR" button below the card that reveals the QR.

```tsx
interface LoyaltyCardQrProps {
  qrCodeUrl: string;  // the scan URL from API, not the QR image
}

export function LoyaltyCardQr({ qrCodeUrl }: LoyaltyCardQrProps) {
  const [visible, setVisible] = useState(false);
  const t = useTranslations('loyaltyCards');
  return (
    <div className="mt-4 text-center">
      <button onClick={() => setVisible(v => !v)}
        className="text-primary font-label text-sm font-bold uppercase tracking-widest">
        {visible ? t('hideQr') : t('showQr')}
      </button>
      {visible && (
        <div className="mt-4 flex justify-center">
          <div className="bg-white p-4 rounded-xl shadow-lg inline-block">
            <QRCode value={qrCodeUrl} size={160} level="M" />
          </div>
          <p className="mt-2 text-xs text-on-surface-variant">{t('showToCashier')}</p>
        </div>
      )}
    </div>
  );
}
```

**QR refreshes:** `qrCodeUrl` comes from `useLoyaltyCard()` which refetches on every app open. The QR is always fresh.

**i18n keys:** `showQr`, `hideQr`, `showToCashier`

### Acceptance criteria
- [ ] "Show QR" button visible on Home screen
- [ ] Tapping reveals QR code with white background
- [ ] QR encodes the correct scan URL from API
- [ ] QR is scannable on a real device (manually test)
- [ ] "Hide QR" collapses the QR

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings
