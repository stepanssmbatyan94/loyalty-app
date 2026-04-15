# Loyalty App — Domain Rules

You are working on the **Loyalty App** backend. This file defines the five core domain entities, their fields, business rules, and the module structure you must follow.

> Full planning context: `docs/planning/api-contract.md` · `docs/planning/auth-flow.md` · `docs/planning/telegram-bot-flows.md`

---

## Domain Entities

### Business
```typescript
// src/businesses/domain/business.ts
class Business {
  id: string;
  name: string;                    // base field; translations in business_translation table
  ownerId: string;
  logoUrl: string | null;
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';  // default: per_amd_spent
  earnRateValue: number;           // default: 100 (1 pt per 100 AMD)
  botToken: string;                // Telegram Bot API token — NEVER expose in API responses
  botUsername: string;             // e.g. "beer_house_bot" (without @) — used to look up business on /start
  webhookSecret: string;           // random string; validated on every webhook POST
  telegramGroupChatId: string;     // Staff group where cashier bot operates
  supportedLocales: string[];      // e.g. ['en', 'ru', 'hy'] — owner manages this list
  defaultLocale: string;           // e.g. 'en' — used when customer's language not in supported list
  isActive: boolean;
  createdAt: Date;
}
```

### BusinessTranslation
```typescript
// src/businesses/domain/business-translation.ts
class BusinessTranslation {
  id: string;
  businessId: string;
  locale: string;                  // 'en', 'ru', 'hy', etc.
  field: 'name' | 'welcomeMessage' | 'pointsLabel';
  value: string;
}
```

### RewardTranslation
```typescript
// src/rewards/domain/reward-translation.ts
class RewardTranslation {
  id: string;
  rewardId: string;
  locale: string;
  field: 'name' | 'description';
  value: string;
}
```

### LoyaltyCard
```typescript
// src/loyalty-cards/domain/loyalty-card.ts
class LoyaltyCard {
  id: string;
  customerId: string;
  businessId: string;
  points: number;            // Current redeemable balance — NEVER goes negative
  totalPointsEarned: number; // Lifetime total for analytics — only increases
  createdAt: Date;           // memberSince
}
```
**Invariant:** `points >= 0` at all times. Enforce in the service layer before any deduction.

### Reward
```typescript
// src/rewards/domain/reward.ts
class Reward {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  pointsCost: number;    // must be > 0
  imageUrl: string | null;
  isActive: boolean;     // inactive rewards excluded from customer catalog
  stock: number | null;  // null = unlimited; decrease on each confirmed redemption
  deletedAt: Date | null; // soft-delete — never hard-delete
  createdAt: Date;
}
```

### Transaction
```typescript
// src/transactions/domain/transaction.ts
class Transaction {
  id: string;
  cardId: string;
  type: 'earn' | 'redeem';
  points: number;               // always positive; type determines direction
  cashierTelegramId: number | null; // set on earn (cashier's Telegram ID)
  rewardId: string | null;      // set on redeem
  note: string | null;
  createdAt: Date;
}
```
**Immutability rule:** Transactions are never updated or deleted. Mistakes are corrected by creating a reversal transaction of the opposite type.

### Redemption
```typescript
// src/redemptions/domain/redemption.ts
class Redemption {
  id: string;
  cardId: string;
  rewardId: string;
  code: string;           // 6-digit numeric string, e.g. "459201"
  qrData: string;         // URL encoding the code for QR display
  pointsCost: number;     // snapshot of reward.pointsCost at creation time
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  expiresAt: Date;        // createdAt + 5 minutes — enforced by cron
  confirmedAt: Date | null;
  cashierTelegramId: number | null;  // set on confirmation
  createdAt: Date;
}
```

---

## Business Rules (enforce in service layer)

### Earn rate calculation
```typescript
// When earnRateMode === 'per_amd_spent':
const pts = Math.floor(purchaseAmountAmd / business.earnRateValue);
// Example: 3500 AMD / 100 = 35 pts

// When earnRateMode === 'fixed_per_visit':
const pts = business.earnRateValue;
```

### Points balance invariant
```typescript
// Before any redemption POST:
if (card.points < reward.pointsCost) {
  throw new UnprocessableEntityException({ status: 422, errors: { points: 'insufficient' } });
}
// Points are deducted immediately on POST /redemptions (pre-authorization)
// Refunded automatically if redemption expires or is cancelled
```

### Redemption lifecycle
```
POST /redemptions         → status: pending, points deducted
PATCH /:code/confirm      → status: confirmed (points already deducted — no further action)
PATCH /:code/cancel       → status: cancelled, points refunded
cron job (every 30s)      → pending + expiresAt < now → status: expired, points refunded
```

### Scan token
- Generated when customer opens their QR on the Home screen
- HMAC-signed, expires in 5 minutes, single-use
- Stored in DB or Redis with `cardId` and `used: boolean`
- Consumed by `GET /scan/:cardId/:scanToken` → triggers bot message to staff group

---

## Module Ownership

| Module | Owns |
|---|---|
| `businesses/` | Business entity, BusinessTranslation entity, earn rate config, bot config, language management |
| `loyalty-cards/` | LoyaltyCard entity, `GET /loyalty-cards/me`, scan token generation |
| `rewards/` | Reward entity, RewardTranslation entity, customer catalog, owner CRUD |
| `transactions/` | Transaction entity, earn endpoint (called by bot) |
| `redemptions/` | Redemption entity, POST/validate/confirm/cancel/cron |
| `users/` | User entity (customer, cashier, owner, super_admin), cashier management |
| `telegram/` | BotRegistry, webhook controller, all grammy bot logic, `/start` + `lang:*` handlers |
| `analytics/` | Dashboard KPIs, top customers — read-only aggregations |
| `admin/` | Super admin endpoints for business provisioning |
| `auth/` | Telegram initData HMAC strategy + email/password JWT strategy |

---

## Bot Architecture (Multi-Tenant)

The platform is **webhook-based** — no long polling. Each business has its own Telegram bot token configured by the business owner via the admin panel.

### BotRegistry

`TelegramService` maintains an in-memory `Map<businessId, Bot>` (grammy `Bot` instances):

```typescript
// src/telegram/telegram.service.ts
class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bots = new Map<string, Bot>();

  async onModuleInit() {
    // Load all active businesses, create one Bot per business in webhook mode
    const businesses = await this.businessesService.findAllActive();
    for (const business of businesses) {
      await this.registerBot(business);
    }
  }

  async registerBot(business: Business): Promise<void> {
    const bot = new Bot(business.botToken, { botInfo: ... });
    // register handlers
    this.bots.set(business.id, bot);
  }
}
```

### Webhook Controller

All businesses share a single webhook endpoint:

```
POST /api/v1/telegram/:businessId/webhook
Headers: X-Telegram-Bot-Api-Secret-Token: <webhookSecret>
```

The controller:
1. Validates `X-Telegram-Bot-Api-Secret-Token` against `business.webhookSecret`
2. Looks up the bot in `BotRegistry` by `businessId`
3. Feeds the raw Telegram Update to that bot's `handleUpdate()` method

### Bot Token Provisioning

When owner saves bot token via `PATCH /businesses/me/bot-settings`:
1. Backend calls Telegram `getMe` to validate the token
2. Generates a random `webhookSecret`
3. Calls Telegram `setWebhook` with the platform URL + `businessId` + secret header
4. Stores `botToken` (encrypted at rest) + `botUsername` + `webhookSecret` in DB
5. Calls `TelegramService.registerBot(business)` to add to BotRegistry
6. Sets `business.isActive = true`

### Business Lookup on /start

The `/start` handler receives `ctx.me.username` (the bot's username). It:
1. Queries `businesses` table by `botUsername`
2. Builds the language keyboard from `business.supportedLocales`
3. Fetches the welcome message from `business_translation` table

### Locale Resolution

```typescript
function resolveLocale(
  customerLanguage: string,   // from Telegram user.language_code
  supportedLocales: string[], // from business.supportedLocales
  defaultLocale: string,      // from business.defaultLocale
): string {
  if (supportedLocales.includes(customerLanguage)) return customerLanguage;
  return defaultLocale;
}
```

---

## Translation Rules

1. **Every translatable field** (business name, welcomeMessage, pointsLabel, reward name, reward description) is stored in the relevant translation table — NOT as a column on the main entity.

2. **Locale fallback chain:**
   ```
   customer's language → business.defaultLocale → raw base field value
   ```

3. **API responses return pre-translated strings.** The backend reads the `Accept-Language` header, resolves the locale, and returns translated values inline. Consumers never pick a translation themselves.

4. **Bot reads welcomeMessage from DB at runtime** — never hardcoded. Same for `supportedLocales` (builds the language keyboard dynamically).

5. **The owner's admin panel** shows all translations per locale and highlights missing ones. Missing translations fall back silently at runtime.

6. **Translation table constraints:** unique on `(businessId/rewardId, locale, field)`. Foreign keys indexed.

---

## JWT Payload — This Project

The boilerplate JWT strategy populates `req.user` from the decoded token. The base payload is:
```typescript
// Boilerplate base (JwtPayloadType)
{ id: number | string, role: Role, sessionId: string, iat: number, exp: number }
```

After loyalty modules are built (B-01, B-02), extend `JwtPayloadType` with:
```typescript
// Customer (after B-01)
{ id: number, role: { id: 3, name: 'customer' }, sessionId: string,
  businessId: string, cardId: string, telegramId: number }

// Business Owner (after B-02)
{ id: number, role: { id: 2, name: 'owner' }, sessionId: string, businessId: string }

// Super Admin
{ id: number, role: { id: 4, name: 'super_admin' }, sessionId: string }
```

**RoleEnum to update in B-01:**
```typescript
export enum RoleEnum {
  'owner'      = 1,
  'customer'   = 2,
  'cashier'    = 3,
  'super_admin' = 4,
}
```

Controllers extract `businessId` and `cardId` from `req.user` — never accept them from the request body for security-sensitive operations.

---

## Bot Authorization Rules

The Telegram Bot validates every incoming message/callback:
1. `chat.id === business.telegramGroupChatId` — ignore messages from other chats
2. `from.id` must match a registered cashier's `telegramUserId` for earn/confirm actions
3. Bot secret header validated on every webhook POST

---

## Field Exposure Rules

| Field | Exposure |
|---|---|
| `business.botToken` | `@Exclude({ toPlainOnly: true })` — never in API responses |
| `business.webhookSecret` | `@Exclude({ toPlainOnly: true })` — never in API responses |
| `user.password` | `@Exclude({ toPlainOnly: true })` |
| `user.email` | `@Expose({ groups: ['owner', 'admin'] })` only |
| `card.totalPointsEarned` | Public — used for analytics leaderboard |

---

## Forbidden patterns in this domain

| Forbidden | Why |
|---|---|
| Accepting `cardId` or `businessId` from request body in customer endpoints | Extract from JWT only — prevents IDOR |
| Exposing `business.botToken` or `business.webhookSecret` in any API response | Security — treat as secrets |
| Hard-deleting Rewards | Historical transactions reference them; use soft-delete |
| Setting `card.points < 0` | Business invariant — always validate before deduction |
| Creating a Transaction without a corresponding LoyaltyCard update | Must be atomic — wrap in a DB transaction |
| Hardcoding welcome messages or language lists in bot handlers | Must be fetched from DB at runtime — multi-tenant |
| Skipping webhook secret validation in `POST /telegram/:businessId/webhook` | Any unauthenticated request can spoof Telegram updates |
| Storing translatable text in main entity columns instead of `*_translation` tables | Violates translation architecture — use translation tables |
