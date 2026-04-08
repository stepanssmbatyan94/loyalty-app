# Epic 9 — Telegram Notifications (Outbound to Customers)

The business's Telegram Bot sends direct messages to individual customers after key loyalty events. Customers must have started a conversation with the bot first to receive messages (Telegram restriction).

**Depends on:** Epic 2 (domain entities), Epic 7 (Bot infrastructure — webhook handler, grammy setup)

All B-32–B-35 notifications follow the same pattern: listen to a NestJS event (via `EventEmitter2`), then call the Telegram Bot API to send a message to the customer's `telegramId`.

---

## B-32 — Welcome Message on First LoyaltyCard Creation

**SP:** 2 | **Layer:** BOT | **Status:** Todo
**Depends on:** B-04, B-18
**Blocks:** nothing

### Description
When a customer's loyalty card is first created (on Telegram registration), the business bot sends them a welcome DM.

### Files to modify
- `backend/src/telegram/notifications/notification.service.ts` — add `sendWelcome()` method
- `backend/src/loyalty-cards/loyalty-cards.service.ts` — emit `loyalty_card.created` event after save

### Implementation notes

**Event emission in LoyaltyCard service:**
```ts
// After card is created in createForCustomer()
this.eventEmitter.emit('loyalty_card.created', {
  telegramId: customer.telegramId,
  businessId: card.businessId,
  customerName: customer.name,
});
```

**Notification service listener:**
```ts
@OnEvent('loyalty_card.created')
async handleCardCreated(payload: LoyaltyCardCreatedEvent) {
  const bot = await this.botRegistry.getBot(payload.businessId);
  const business = await this.businessesService.findById(payload.businessId);

  await bot.api.sendMessage(
    payload.telegramId,
    `👋 Welcome to ${business.name} Loyalty Program, ${payload.customerName}!\n\n` +
    `You've been enrolled and start with 0 points.\n` +
    `Earn points every visit and redeem them for rewards. 🍺\n\n` +
    `Tap the button below to open your loyalty card:`,
    {
      reply_markup: new InlineKeyboard().webApp(
        '🎯 Open My Card',
        process.env.MINI_APP_URL,
      ),
    },
  );
}
```

**BotRegistry:** A service that maps `businessId → Bot instance` (set up in Epic 7, B-18). Used by all notification handlers to get the correct business bot.

**Telegram restriction:** If customer has not started a conversation with the bot, `sendMessage` will throw a `403 Forbidden`. Catch and log — do not crash the main flow:
```ts
try {
  await bot.api.sendMessage(...);
} catch (e) {
  this.logger.warn(`Cannot send Telegram message to ${payload.telegramId}: ${e.message}`);
}
```

### Acceptance criteria
- [ ] Welcome message sent within 5 seconds of card creation
- [ ] Message includes business name and customer's first name
- [ ] Message includes inline button to open Mini App
- [ ] If customer hasn't started the bot, error is logged (not thrown)
- [ ] No duplicate welcome messages if card creation retried

### Definition of done
- [ ] `npm run lint` passes
- [ ] Manual test: register new customer → check Telegram DM received

---

## B-33 — Notification After Earn Transaction Confirmed

**SP:** 2 | **Layer:** BOT | **Status:** Todo
**Depends on:** B-21 (Bot approve callback), B-32 (notification infrastructure)
**Blocks:** nothing

### Description
After a cashier approves an earn transaction via the bot inline keyboard, the customer receives a DM with the points added and their new balance.

### Files to modify
- `backend/src/transactions/transactions.service.ts` — emit `transaction.earn.confirmed` event
- `backend/src/telegram/notifications/notification.service.ts` — add listener

### Implementation notes

**Event emission (inside earn transaction service after card is updated):**
```ts
this.eventEmitter.emit('transaction.earn.confirmed', {
  telegramId: customer.telegramId,
  businessId: card.businessId,
  businessName: business.name,
  pointsAdded: transaction.points,
  newBalance: card.points,
});
```

**Notification listener:**
```ts
@OnEvent('transaction.earn.confirmed')
async handleEarnConfirmed(payload: EarnConfirmedEvent) {
  const bot = await this.botRegistry.getBot(payload.businessId);

  await bot.api.sendMessage(
    payload.telegramId,
    `✅ +${payload.pointsAdded} points at ${payload.businessName}!\n\n` +
    `💰 Your balance: ${payload.newBalance.toLocaleString()} pts`,
    {
      reply_markup: new InlineKeyboard().webApp('🎯 View My Card', process.env.MINI_APP_URL),
    },
  ).catch(e => this.logger.warn(`Earn notification failed: ${e.message}`));
}
```

### Acceptance criteria
- [ ] Notification sent within 5 seconds of cashier pressing "Approve"
- [ ] Shows `+{pts}` earned and new balance
- [ ] Shows business name
- [ ] Includes "View My Card" deep link button
- [ ] Silent failure if customer hasn't started bot

### Definition of done
- [ ] `npm run lint` passes
- [ ] Manual test: complete earn flow → confirm DM received

---

## B-34 — Notification After Redemption Confirmed by Cashier

**SP:** 2 | **Layer:** BOT | **Status:** Todo
**Depends on:** B-23 (Bot confirm redemption callback), B-32
**Blocks:** nothing

### Description
After a cashier confirms a redemption code via the bot, the customer receives a DM confirming the reward was claimed and showing their remaining balance.

### Files to modify
- `backend/src/redemptions/redemptions.service.ts` — emit `redemption.confirmed` event after status update
- `backend/src/telegram/notifications/notification.service.ts` — add listener

### Implementation notes

**Event emission:**
```ts
this.eventEmitter.emit('redemption.confirmed', {
  telegramId: customer.telegramId,
  businessId: card.businessId,
  businessName: business.name,
  rewardName: reward.name,
  pointsSpent: redemption.pointsCost,
  remainingBalance: card.points,
});
```

**Notification listener:**
```ts
@OnEvent('redemption.confirmed')
async handleRedemptionConfirmed(payload: RedemptionConfirmedEvent) {
  const bot = await this.botRegistry.getBot(payload.businessId);

  await bot.api.sendMessage(
    payload.telegramId,
    `🎉 Redemption confirmed!\n\n` +
    `✅ ${payload.rewardName} at ${payload.businessName}\n` +
    `-${payload.pointsSpent} pts\n\n` +
    `💰 Remaining balance: ${payload.remainingBalance.toLocaleString()} pts`,
    {
      reply_markup: new InlineKeyboard().webApp('🎯 View My Card', process.env.MINI_APP_URL),
    },
  ).catch(e => this.logger.warn(`Redemption notification failed: ${e.message}`));
}
```

### Acceptance criteria
- [ ] Notification sent within 5 seconds of cashier confirming
- [ ] Shows reward name, points spent, and remaining balance
- [ ] Emoji markers for visual clarity

### Definition of done
- [ ] `npm run lint` passes
- [ ] Manual test: complete redemption flow → confirm DM received

---

## B-35 — Notification When Redemption Code Expires (Auto-Refund)

**SP:** 2 | **Layer:** BOT | **Status:** Todo
**Depends on:** B-13 (cron expiry job), B-32
**Blocks:** nothing

### Description
When the 5-minute cron job expires a pending redemption and auto-refunds points, the customer is notified so they know their points are safe.

### Files to modify
- `backend/src/redemptions/redemptions.service.ts` — emit `redemption.expired` event in expiry cron
- `backend/src/telegram/notifications/notification.service.ts` — add listener

### Implementation notes

**Event emission (inside the expiry cron, after each expired redemption is processed):**
```ts
// For each expired redemption:
this.eventEmitter.emit('redemption.expired', {
  telegramId: customer.telegramId,
  businessId: card.businessId,
  rewardName: reward.name,
  pointsRefunded: redemption.pointsCost,
  newBalance: card.points,  // after refund
});
```

**Notification listener:**
```ts
@OnEvent('redemption.expired')
async handleRedemptionExpired(payload: RedemptionExpiredEvent) {
  const bot = await this.botRegistry.getBot(payload.businessId);

  await bot.api.sendMessage(
    payload.telegramId,
    `⏱ Your redemption code for ${payload.rewardName} has expired.\n\n` +
    `${payload.pointsRefunded} pts have been returned to your balance.\n` +
    `💰 Current balance: ${payload.newBalance.toLocaleString()} pts`,
  ).catch(e => this.logger.warn(`Expiry notification failed: ${e.message}`));
}
```

**Note:** No Mini App button in this notification — it's informational only.

### Acceptance criteria
- [ ] Notification sent for every expired redemption within the cron run
- [ ] Correctly states points refunded and new balance
- [ ] Fires only once per expired redemption (idempotency via status check)

### Definition of done
- [ ] `npm run lint` passes
- [ ] Manual test: let code expire → confirm DM received with correct balance

---

## F-27 — Customer: Enable Notifications Prompt

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** F-04 (Telegram init), F-09 (Home page)
**Blocks:** nothing

### Description
On first Mini App open, prompt the customer to start a conversation with the business's Telegram bot so they can receive notifications. Without this step, the bot cannot send DMs to the customer.

### Files to create
- `frontend/src/features/notifications/components/enable-notifications-banner.tsx`
- `frontend/src/features/notifications/hooks/use-notification-prompt.ts`

### Implementation notes

**Show condition:** Display banner once, on first app open. Dismiss and save to `localStorage` once user taps "Enable" or "Maybe Later".

**Banner component:**
```tsx
<div className="mx-6 mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
  <span className="material-symbols-outlined text-primary text-2xl">notifications</span>
  <div className="flex-1">
    <p className="font-label text-sm font-semibold text-on-surface">{t('enableNotifications')}</p>
    <p className="font-body text-xs text-on-surface-variant mt-0.5">{t('enableNotificationsDesc')}</p>
  </div>
  <div className="flex flex-col gap-1">
    <button
      onClick={handleEnable}
      className="px-3 py-1 bg-primary text-white rounded-full text-xs font-bold">
      {t('enable')}
    </button>
    <button
      onClick={handleDismiss}
      className="px-3 py-1 text-on-surface-variant text-xs">
      {t('later')}
    </button>
  </div>
</div>
```

**Handle enable:**
```ts
const handleEnable = () => {
  // Open the business bot chat in Telegram
  WebApp.openTelegramLink(`https://t.me/${business.botUsername}`);
  localStorage.setItem('notifications_prompted', 'true');
  setVisible(false);
};
```

**The `botUsername`** is included in the `GET /businesses/me` response (add to DTO if not already present).

**Placement:** Rendered between `TopAppBar` and `LoyaltyCardHero` on the Home page, only when `localStorage.getItem('notifications_prompted')` is falsy.

**i18n keys** (`notifications` namespace): `enableNotifications`, `enableNotificationsDesc`, `enable`, `later`

### Acceptance criteria
- [ ] Banner shown only on first Home page visit (not on subsequent opens)
- [ ] "Enable" opens Telegram app with the correct bot URL
- [ ] "Later" dismisses banner and saves flag to localStorage
- [ ] Banner does not render if `notifications_prompted` is set

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings
