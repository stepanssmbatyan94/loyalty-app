# Epic 2 — Core Domain (Backend)

Pure backend epic. All 7 tickets follow the Hexagonal Architecture pattern from `backend/docs/conventions.md`. Reference implementation: `backend/src/users/`. Run `npm run generate:resource:relational -- --name <Name>` to scaffold each module skeleton before filling in.

---

## B-03 — Business Module

**SP:** 5 | **Layer:** BE | **Status:** Done
**Depends on:** B-02 (roles enum)
**Blocks:** B-03b, B-04, B-09, B-10, B-11, B-27b, B-27c, B-27d, B-28, B-29, B-30

### Description
Create the `Business` domain entity and full Hexagonal Architecture module. A Business is a merchant registered on the platform (e.g. Beer House). It holds earn rate config, Telegram bot credentials, supported locales, and webhook secret for multi-tenant operation.

### Files created
```
backend/src/businesses/
├── domain/business.ts
├── dto/create-business.dto.ts
├── dto/update-business.dto.ts
├── infrastructure/persistence/business.repository.ts
├── infrastructure/persistence/relational/
│   ├── entities/business.entity.ts
│   ├── mappers/business.mapper.ts
│   ├── repositories/businesses.repository.ts
│   └── relational-persistence.module.ts
├── businesses.service.ts
├── businesses.controller.ts
└── businesses.module.ts
```

### Implementation notes

**Domain entity (`domain/business.ts`) — as built:**
```ts
export class Business {
  id: string;                              // UUID — @PrimaryGeneratedColumn('uuid')
  name: string;                            // base field; translations in business_translation
  ownerId: number;                         // integer FK → users.id
  logoUrl: string | null;
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';  // default: per_amd_spent
  earnRateValue: number;                   // default: 100 (1 pt per 100 AMD)
  botToken: string | null;                 // @Exclude({ toPlainOnly: true }) — never in API responses
  botUsername: string | null;              // indexed + unique; used to look up business on /start
  webhookSecret: string | null;            // @Exclude({ toPlainOnly: true }) — validated on webhook POST
  telegramGroupChatId: string | null;
  supportedLocales: string[];              // PostgreSQL text[] — default ['en']
  defaultLocale: string;                   // default 'en'
  isActive: boolean;                       // false until owner configures bot (B-27b)
  createdAt: Date;
}
```

**TypeORM entity:** `botToken` and `webhookSecret` use `@Exclude({ toPlainOnly: true })` on the domain class so they never appear in any API response. `supportedLocales` stored as PostgreSQL native `text[]`. `isActive` defaults to `false`.

**Earn rate defaults:** `earnRateMode: 'per_amd_spent'`, `earnRateValue: 100`

**Controller routes delivered by B-03:**
- `GET /api/v1/businesses/me` — owner gets their own business (role: owner) ✅

Not in B-03 (separate tickets):
- `PATCH /api/v1/businesses/me/settings` → B-28
- `PATCH /api/v1/businesses/me/bot-settings` → B-27b
- `GET/POST /api/v1/admin/businesses` → B-36

**Repository methods:**
- `create(data)` → `Business`
- `findById(id)` → `Business | null`
- `findByOwnerId(ownerId: number)` → `Business | null`
- `findByBotUsername(botUsername: string)` → `Business | null` — used by BotRegistry on /start
- `findAllActive()` → `Business[]` — used by BotRegistry on startup
- `update(id, payload)` → `Business`

### Acceptance criteria
- [x] `GET /businesses/me` returns business without `botToken` or `webhookSecret` in response
- [x] Non-owner cannot call `/businesses/me` (403 via RolesGuard)
- [x] Domain entity has no TypeORM imports
- [x] Mapper converts both directions (toDomain / toPersistence)
- [x] `botToken` and `webhookSecret` excluded from all API responses (`@Exclude`)
- [x] `isActive` defaults to `false` (business inactive until bot configured)
- [ ] `PATCH /businesses/me/settings` updates `earnRateMode` and `earnRateValue` — belongs to B-28

### Definition of done
- [ ] Unit tests in `businesses.service.spec.ts` — pending
- [x] `npm run build` passes
- [ ] Migration generated in B-08

---

## B-03b — BusinessTranslation Module

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-03
**Blocks:** B-37 (translation service), B-18c (bot welcome from DB), B-27d (translation editor endpoint)

### Description
Stores per-locale translations for the three customizable Business text fields: `name`, `welcomeMessage`, and `pointsLabel`. One row per `(businessId, locale, field)` combination. Provides the lookup service with locale fallback used by both the bot and the API.

### Files to create
```
backend/src/businesses/
├── domain/business-translation.ts
├── dto/upsert-business-translation.dto.ts
├── infrastructure/persistence/business-translation.repository.ts
└── infrastructure/persistence/relational/
    ├── entities/business-translation.entity.ts
    ├── mappers/business-translation.mapper.ts
    ├── repositories/business-translations.repository.ts
    └── (re-uses RelationalBusinessPersistenceModule — add entity there)
```

No separate module or controller — `BusinessTranslation` is owned by `BusinessesModule`.

### Implementation notes

**Domain entity (`domain/business-translation.ts`):**
```ts
export class BusinessTranslation {
  id: string;                                            // UUID
  businessId: string;
  locale: string;                                        // e.g. 'en', 'ru', 'hy'
  field: 'name' | 'welcomeMessage' | 'pointsLabel';
  value: string;
}
```

**TypeORM entity constraints:**
- Unique constraint on `(businessId, locale, field)` — enforced at DB level
- Index on `businessId` for fast lookup
- FK to `business.id`

**Repository methods (abstract port):**
- `upsert(data: Omit<BusinessTranslation, 'id'>)` → `BusinessTranslation` — insert or update on unique constraint
- `findByBusiness(businessId: string)` → `BusinessTranslation[]` — all translations for a business
- `findByBusinessAndLocale(businessId: string, locale: string)` → `BusinessTranslation[]`
- `getField(businessId: string, locale: string, field: string)` → `string | null` — single value lookup

**Service method (add to `BusinessesService`):**
```ts
async getTranslatedField(
  businessId: string,
  locale: string,
  field: 'name' | 'welcomeMessage' | 'pointsLabel',
  defaultLocale: string,
): Promise<string | null> {
  // 1. Try requested locale
  const value = await this.businessTranslationRepository.getField(businessId, locale, field);
  if (value) return value;
  // 2. Fall back to defaultLocale
  if (locale !== defaultLocale) {
    return this.businessTranslationRepository.getField(businessId, defaultLocale, field);
  }
  return null; // caller uses raw base field as final fallback
}
```

**Upsert pattern (PostgreSQL ON CONFLICT):**
```ts
await this.repo
  .createQueryBuilder()
  .insert()
  .into(BusinessTranslationEntity)
  .values(entity)
  .orUpdate(['value'], ['businessId', 'locale', 'field'])
  .execute();
```

### Acceptance criteria
- [ ] `upsert` creates a new row when `(businessId, locale, field)` does not exist
- [ ] `upsert` updates existing `value` when the same combination is called again
- [ ] `getField` returns the value for the requested locale
- [ ] `getField` returns `null` (not throws) when no translation exists
- [ ] `getTranslatedField` falls back to `defaultLocale` when requested locale is missing
- [ ] DB has unique constraint on `(businessId, locale, field)`
- [ ] Domain entity has no TypeORM imports

### Definition of done
- [ ] Unit tests: upsert, getField (found / not found), fallback chain
- [ ] Migration generated in B-08b
- [ ] `npm run build` passes

---

## B-04 — LoyaltyCard Module

**SP:** 8 | **Layer:** BE | **Status:** Todo
**Depends on:** B-03
**Blocks:** B-10, B-11, B-12, B-17, B-19

### Description
The core entity — a customer's membership card at a specific business. Tracks current points balance and lifetime earnings. Generates a scannable QR code URL for the cashier earn flow.

### Files to create
```
backend/src/loyalty-cards/
├── domain/loyalty-card.ts
├── dto/create-loyalty-card.dto.ts
├── dto/update-loyalty-card.dto.ts
├── infrastructure/persistence/loyalty-card.repository.ts
├── infrastructure/persistence/relational/
│   ├── entities/loyalty-card.entity.ts
│   ├── mappers/loyalty-card.mapper.ts
│   ├── repositories/loyalty-cards.repository.ts
│   └── relational-persistence.module.ts
├── loyalty-cards.service.ts
├── loyalty-cards.controller.ts
└── loyalty-cards.module.ts
```

### Implementation notes

**Domain entity (`domain/loyalty-card.ts`):**
```ts
export class LoyaltyCard {
  id: string;
  customerId: string;
  businessId: string;
  points: number;              // current spendable balance (never < 0)
  totalPointsEarned: number;   // lifetime total, never decreases
  createdAt: Date;
  updatedAt: Date;
}
```

**QR code URL** is not stored — generated on the fly:
```ts
// In service
getScanUrl(cardId: string, token: string): string {
  return `${this.configService.get('app.frontendDomain')}/api/v1/scan/${cardId}/${token}`;
}
```

**Scan token** (short-lived, single-use HMAC):
- Generate: `crypto.createHmac('sha256', SECRET).update(cardId + timestamp).digest('hex').slice(0, 16)`
- Store in Redis with 5-min TTL, or as a DB column `ScanToken` table (simpler for MVP)
- Invalidate after first use

**Service methods:**
- `findOrCreateForCustomer(customerId, businessId)` → `LoyaltyCard`
- `findByCustomerAndBusiness(customerId, businessId)` → `LoyaltyCard | null`
- `addPoints(cardId, points)` → `LoyaltyCard` — increments both `points` and `totalPointsEarned`
- `deductPoints(cardId, points)` → `LoyaltyCard` — decrements `points` only; throws if insufficient
- `getWithNextReward(customerId, businessId)` → `LoyaltyCard + Reward | null` — for Home screen

**Controller routes:**
- `GET /api/v1/loyalty-cards/me` — returns card + next reward + progress (role: customer)
- `GET /api/v1/scan/:cardId/:scanToken` — validates token, triggers bot notification (no auth — secured by token)

**Business rule:** `points` must never go below 0. Enforce in `deductPoints()`:
```ts
if (card.points < points) {
  throw new UnprocessableEntityException({ status: 422, errors: { points: 'insufficient' } });
}
```

### Acceptance criteria
- [ ] `GET /loyalty-cards/me` returns card with `nextReward` (null if all rewards are reachable)
- [ ] `addPoints` increases both `points` and `totalPointsEarned`
- [ ] `deductPoints` decreases `points` only, throws 422 if insufficient
- [ ] `points` can never go below 0 (validated in service, not just DB)
- [ ] `GET /scan/:cardId/:scanToken` returns 410 if token expired, 409 if already used

### Definition of done
- [ ] Unit tests: `loyalty-cards.service.spec.ts` covers addPoints, deductPoints (insufficient), findOrCreate
- [ ] `npm run lint` passes
- [ ] Migration generated in B-08

---

## B-05 — Reward Module

**SP:** 5 | **Layer:** BE | **Status:** Todo
**Depends on:** B-03
**Blocks:** B-11, B-12, B-27

### Description
Rewards are prizes customers can redeem points for. Created and managed by the Business Owner. Supports soft-delete and active/inactive toggling.

### Files to create
```
backend/src/rewards/
├── domain/reward.ts
├── dto/create-reward.dto.ts
├── dto/update-reward.dto.ts
├── dto/query-reward.dto.ts
├── infrastructure/persistence/reward.repository.ts
├── infrastructure/persistence/relational/
│   ├── entities/reward.entity.ts
│   ├── mappers/reward.mapper.ts
│   ├── repositories/rewards.repository.ts
│   └── relational-persistence.module.ts
├── rewards.service.ts
├── rewards.controller.ts
└── rewards.module.ts
```

### Implementation notes

**Domain entity:**
```ts
export class Reward {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  pointsCost: number;         // positive integer
  imageUrl: string | null;
  isActive: boolean;
  stock: number | null;       // null = unlimited
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;     // soft-delete
}
```

**Service methods:**
- `findAllForBusiness(businessId, includeInactive?)` → `Reward[]`
- `findActiveWithEligibility(businessId, customerPoints)` → `Array<Reward & { canRedeem, ptsNeeded }>`
- `create(businessId, dto)` → `Reward`
- `update(id, businessId, dto)` → `Reward` — validates ownership
- `softDelete(id, businessId)` → `void`

**Validation:**
- `pointsCost` must be > 0 (class-validator: `@IsInt() @Min(1)`)
- Owner can only modify rewards belonging to their `businessId` (check in service)

**Controller routes:**
- `GET /api/v1/rewards` — customer sees active rewards with `canRedeem` (role: customer)
- `POST /api/v1/rewards` — owner creates reward (role: owner)
- `PATCH /api/v1/rewards/:id` — owner updates (role: owner)
- `DELETE /api/v1/rewards/:id` — owner soft-deletes (role: owner)

**Sorting for customer endpoint:** `ORDER BY pointsCost ASC`

### Acceptance criteria
- [ ] `GET /rewards` excludes inactive and soft-deleted rewards
- [ ] `canRedeem` computed correctly based on requesting customer's balance
- [ ] Owner cannot modify a reward from another business (403)
- [ ] Soft-deleted rewards not returned to customers
- [ ] `pointsCost` validates as positive integer

### Definition of done
- [ ] Unit tests in `rewards.service.spec.ts`
- [ ] `npm run lint` passes
- [ ] Migration generated in B-08

---

## B-06 — Transaction Module

**SP:** 8 | **Layer:** BE | **Status:** Todo
**Depends on:** B-04
**Blocks:** B-17, B-21, B-23

### Description
Immutable record of every points earn or redeem event. Transactions are never edited or deleted. Supports paginated history for customers and full list for owners.

### Files to create
```
backend/src/transactions/
├── domain/transaction.ts
├── dto/create-transaction.dto.ts
├── dto/query-transaction.dto.ts
├── infrastructure/persistence/transaction.repository.ts
├── infrastructure/persistence/relational/
│   ├── entities/transaction.entity.ts
│   ├── mappers/transaction.mapper.ts
│   ├── repositories/transactions.repository.ts
│   └── relational-persistence.module.ts
├── transactions.service.ts
├── transactions.controller.ts
└── transactions.module.ts
```

### Implementation notes

**Domain entity:**
```ts
export class Transaction {
  id: string;
  cardId: string;
  businessId: string;
  type: 'earn' | 'redeem';
  points: number;             // always positive — type indicates direction
  label: string;              // display name: "Beer House" for earn, reward name for redeem
  cashierTelegramId: number | null;
  rewardId: string | null;
  note: string | null;
  createdAt: Date;
}
```

**No `updatedAt` or `deletedAt`** — transactions are immutable by design.

**Service methods:**
- `create(dto)` → `Transaction` — called internally by bot earn/redeem flows
- `findManyByCardId(cardId, pagination, filters)` → `{ data, meta }`
- `findRecentByBusinessId(businessId, limit)` → `Transaction[]` — for cashier log

**Query filters (from `api-contract.md`):**
- `type?: 'earn' | 'redeem'`
- `from?: Date` (default: 30 days ago)
- `to?: Date` (default: now)
- `page: number`, `limit: number` (max 50)

**Controller routes:**
- `GET /api/v1/transactions` — customer's own history (role: customer)

**Important:** `TransactionsService` is called by `LoyaltyCardsService` and the bot handlers — it does NOT call those services back (no circular dependencies).

### Acceptance criteria
- [ ] Transactions cannot be updated or deleted (no update/delete endpoints)
- [ ] Paginated response includes `meta.total`, `meta.hasNextPage`
- [ ] Default date range is last 30 days
- [ ] `label` shows "Beer House" for earn transactions
- [ ] `label` shows reward name for redeem transactions
- [ ] Customer can only see their own card's transactions

### Definition of done
- [ ] Unit tests: create, findMany with filters, pagination
- [ ] `npm run lint` passes
- [ ] Migration generated in B-08

---

## B-07 — Redemption Module

**SP:** 5 | **Layer:** BE | **Status:** Todo
**Depends on:** B-04, B-05
**Blocks:** B-12, B-13, B-14, B-15, B-16

### Description
Manages the lifecycle of a reward redemption: creation (code generation + points pre-deduction), validation, confirmation by cashier, cancellation, and automatic expiry with points refund.

### Files to create
```
backend/src/redemptions/
├── domain/redemption.ts
├── dto/create-redemption.dto.ts
├── dto/query-redemption.dto.ts
├── infrastructure/persistence/redemption.repository.ts
├── infrastructure/persistence/relational/
│   ├── entities/redemption.entity.ts
│   ├── mappers/redemption.mapper.ts
│   ├── repositories/redemptions.repository.ts
│   └── relational-persistence.module.ts
├── redemptions.service.ts
├── redemptions.controller.ts
├── redemptions.module.ts
└── redemptions.cron.ts      ← expiry job
```

### Implementation notes

**Domain entity:**
```ts
export class Redemption {
  id: string;
  cardId: string;
  rewardId: string;
  businessId: string;
  code: string;               // 6-digit numeric string e.g. "459201"
  qrData: string;             // full URL for QR encoding
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  pointsCost: number;
  expiresAt: Date;
  confirmedAt: Date | null;
  cashierTelegramId: number | null;
  createdAt: Date;
}
```

**Code generation:**
```ts
// Cryptographically random 6-digit code
const code = crypto.randomInt(100000, 999999).toString();
```

**Cron job for expiry (in `redemptions.cron.ts`):**
```ts
@Cron(CronExpression.EVERY_30_SECONDS)
async expirePendingRedemptions() {
  const expired = await this.redemptionsRepository.findExpiredPending();
  for (const r of expired) {
    await this.redemptionsService.expire(r.id); // refunds points
  }
}
```

**`expire()` method:**
1. Set status to `expired`
2. Call `loyaltyCardsService.addPoints(cardId, pointsCost)` — refund
3. Create reversal Transaction record
4. Trigger customer notification (B-35)

**Service methods:**
- `create(customerId, rewardId)` → `Redemption` — validates balance, deducts points, generates code
- `findByCode(code)` → `Redemption | null`
- `confirm(code, cashierTelegramId)` → `Redemption`
- `cancel(code)` → `Redemption` — refunds points
- `expire(id)` → `void` — refunds points (called by cron)

### Acceptance criteria
- [ ] `create()` throws 422 if `card.points < reward.pointsCost`
- [ ] Code is unique 6-digit numeric string
- [ ] `expiresAt` = `createdAt + 5 minutes`
- [ ] `confirm()` throws 410 if status is `expired`, 409 if `confirmed`
- [ ] Cron runs every 30s and expires overdue codes
- [ ] Expired redemptions auto-refund points (card balance restored)

### Definition of done
- [ ] Unit tests: create (success + insufficient pts), confirm, cancel, expire (cron)
- [ ] `@nestjs/schedule` added to `AppModule`
- [ ] `npm run lint` passes
- [ ] Migration generated in B-08

---

## B-08 — Database Migrations

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-03, B-04, B-05, B-06, B-07
**Blocks:** B-09 (seeds), all integration tests

### Description
Generate and run TypeORM migrations for all 5 new tables. Add correct indexes on all foreign key columns.

### Commands to run
```bash
npm run migration:generate -- src/database/migrations/CreateBusinessesTable
npm run migration:generate -- src/database/migrations/CreateLoyaltyCardsTable
npm run migration:generate -- src/database/migrations/CreateRewardsTable
npm run migration:generate -- src/database/migrations/CreateTransactionsTable
npm run migration:generate -- src/database/migrations/CreateRedemptionsTable
npm run migration:run:relational
```

### Implementation notes

**Required indexes** (PostgreSQL does not auto-index FKs):

| Table | Index on |
|---|---|
| `loyalty_cards` | `customer_id`, `business_id`, `(customer_id, business_id)` unique |
| `rewards` | `business_id`, `is_active` |
| `transactions` | `card_id`, `business_id`, `created_at`, `type` |
| `redemptions` | `code` unique, `card_id`, `status`, `expires_at` |

**Unique constraints:**
- `loyalty_cards(customer_id, business_id)` — one card per customer per business
- `redemptions(code)` — codes must be globally unique

### Acceptance criteria
- [ ] All 5 migrations run without errors
- [ ] All FK columns have indexes
- [ ] `(customer_id, business_id)` unique constraint on `loyalty_cards`
- [ ] `code` unique index on `redemptions`
- [ ] `npm run migration:run:relational` idempotent (running twice doesn't break)

### Definition of done
- [ ] Migration files committed to `src/database/migrations/`
- [ ] Schema validated against entity definitions
- [ ] `npm run test:e2e` can connect to DB and run

---

## B-09 — Seeds: Beer House Pilot Data

**SP:** 2 | **Layer:** BE | **Status:** Todo
**Depends on:** B-08
**Blocks:** local development, first demo

### Description
Create seed data for the Beer House pilot: one business, one owner account, 4 rewards, and one superadmin account.

### Files to create
```
backend/src/database/seeds/relational/
├── business/
│   ├── business-seed.module.ts
│   └── business-seed.service.ts
├── reward/
│   ├── reward-seed.module.ts
│   └── reward-seed.service.ts
```

### Implementation notes

**Superadmin account** (add to existing user seed):
```ts
{
  email: 'superadmin@loyalty.app',
  password: 'ChangeMe123!',  // hashed via bcrypt
  role: RoleEnum.superadmin,
  firstName: 'Super',
  lastName: 'Admin',
}
```

**Business Owner account:**
```ts
{
  email: 'owner@beerhouse.am',
  password: 'BeerHouse2024!',
  role: RoleEnum.owner,
  firstName: 'Gevorg',
  lastName: 'Mkrtchyan',
}
```

**Business:**
```ts
{
  name: 'Beer House',
  ownerId: '<owner user id>',
  earnRateMode: 'per_amd_spent',
  earnRateValue: 100,
  botToken: 'PLACEHOLDER_SET_IN_ENV',
  telegramGroupChatId: 'PLACEHOLDER_SET_IN_ENV',
}
```

**Rewards:**
| Name | Points | Description |
|---|---|---|
| Free Pint | 500 | Choose any flagship brew from our draft list. |
| Half Off Burger | 800 | Get 50% off any signature burger on the menu. |
| Appetizer Platter | 1200 | A massive selection of our top-rated starters. |
| Beer Flight | 1500 | Sampler of 4 seasonal rotating brews. |

### Acceptance criteria
- [ ] `npm run seed:run:relational` completes without errors
- [ ] All 4 rewards exist and are active
- [ ] Superadmin and owner accounts exist and can log in
- [ ] Running seeds twice doesn't create duplicates (use `findOrCreate` pattern)

### Definition of done
- [ ] Seed files committed
- [ ] `npm run seed:run:relational` documented in backend README
