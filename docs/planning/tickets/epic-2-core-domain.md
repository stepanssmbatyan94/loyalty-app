# Epic 2 — Core Domain (Backend)

Pure backend epic. All tickets follow the Hexagonal Architecture pattern from `backend/docs/conventions.md`. Reference implementation: `backend/src/users/`.

**Deliverability rule:** Every ticket that creates a DB entity includes its TypeORM migration as the final step. A ticket is only "Done" when the table exists in the DB and the feature is testable end-to-end.

**Sub-task notation:** `B-04.1`, `B-04.2` etc. are sub-tasks of story `B-04`. Sub-tasks run in order; the story is Done when all sub-tasks are Done.

---

## B-03 — Business Module ✅

**SP:** 5 | **Layer:** BE | **Status:** Done
**Depends on:** B-02 (roles enum)
**Blocks:** B-03b, B-03.M, B-04, B-09, B-10, B-11, B-27b, B-27c, B-27d, B-28, B-29, B-30

### Description
Business domain entity + full Hexagonal Architecture module. Multi-tenant: each business owns its own bot token, supported locales, and webhook secret.

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

### Domain entity
```ts
export class Business {
  id: string;                              // UUID
  name: string;
  ownerId: number;                         // FK → users.id
  logoUrl: string | null;
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';
  earnRateValue: number;                   // default 100
  botToken: string | null;                 // @Exclude — never in API responses
  botUsername: string | null;              // indexed, unique
  webhookSecret: string | null;            // @Exclude — never in API responses
  telegramGroupChatId: string | null;
  supportedLocales: string[];              // text[] default ['en']
  defaultLocale: string;                   // default 'en'
  isActive: boolean;                       // false until bot configured
  createdAt: Date;
}
```

### Acceptance criteria
- [x] `GET /businesses/me` returns business without `botToken` or `webhookSecret`
- [x] Non-owner gets 403
- [x] Domain entity has no TypeORM imports
- [x] `isActive` defaults to `false`

### Definition of done
- [x] `npm run build` passes
- [ ] Migration run — see **B-03.M**

---

## B-03b — BusinessTranslation Module ✅

**SP:** 3 | **Layer:** BE | **Status:** Done
**Depends on:** B-03
**Blocks:** B-37 (translation service), B-18c (bot welcome from DB), B-27d

### Description
Per-locale translations for `name`, `welcomeMessage`, `pointsLabel` stored in `business_translation` table. Composite unique constraint on `(businessId, locale, field)`. Locale fallback chain built into `BusinessesService.getTranslatedField()`.

### Files created
```
backend/src/businesses/
├── domain/business-translation.ts
├── dto/upsert-business-translation.dto.ts
├── infrastructure/persistence/business-translation.repository.ts
└── infrastructure/persistence/relational/
    ├── entities/business-translation.entity.ts
    ├── mappers/business-translation.mapper.ts
    └── repositories/business-translations.repository.ts
```
`RelationalBusinessPersistenceModule` updated to register both entities + both repos.

### Service methods added to `BusinessesService`
- `upsertTranslation(data)` → `BusinessTranslation`
- `getTranslations(businessId)` → `BusinessTranslation[]`
- `getTranslatedField(businessId, locale, field, defaultLocale)` → `string | null`

### Definition of done
- [x] `npm run build` passes
- [ ] Migration run — see **B-03.M**

---

## B-03.M — Migrations: business + business_translation ✅

**SP:** 1 | **Layer:** BE | **Status:** Done
**Depends on:** B-03, B-03b
**Blocks:** Everything that reads/writes `business` or `business_translation` tables

### Description
Generate and run the TypeORM migrations for the two tables created in B-03 and B-03b. After this ticket, `GET /businesses/me` is fully testable end-to-end.

### Commands
```bash
cd backend
npm run migration:generate -- src/database/migrations/CreateBusinessTable
npm run migration:generate -- src/database/migrations/CreateBusinessTranslationTable
npm run migration:run:relational
```

### Acceptance criteria
- [x] `business` table exists with all columns including `supported_locales text[]`
- [x] `business_translation` table exists with unique constraint on `(business_id, locale, field)`
- [x] `GET /api/v1/businesses/me` returns 200 with a seeded owner account
- [x] Running migrations twice is idempotent

### Definition of done
- [x] Migration files committed to `src/database/migrations/`
- [x] `npm run migration:run` succeeds on clean DB

---

## B-04 — LoyaltyCard Module (Story) ✅

**SP:** 8 total | **Layer:** BE | **Status:** Done
**Depends on:** B-03.M
**Blocks:** B-10, B-11, B-12, B-17, B-19

A customer's membership card at a specific business. Tracks spendable `points` and lifetime `totalPointsEarned`. `points` can never go below 0 — enforced in the service layer.

---

### B-04.1 — LoyaltyCard: domain + persistence + migration ✅

**SP:** 3 | **Status:** Done
**Deliverable:** `loyalty_cards` table exists in DB, build passes

#### Files to create
```
backend/src/loyalty-cards/
├── domain/loyalty-card.ts
├── dto/create-loyalty-card.dto.ts
├── infrastructure/persistence/loyalty-card.repository.ts
└── infrastructure/persistence/relational/
    ├── entities/loyalty-card.entity.ts
    ├── mappers/loyalty-card.mapper.ts
    ├── repositories/loyalty-cards.repository.ts
    └── relational-persistence.module.ts
├── loyalty-cards.module.ts
```

#### Domain entity
```ts
export class LoyaltyCard {
  id: string;             // UUID
  customerId: number;     // FK → users.id
  businessId: string;     // FK → business.id
  points: number;         // spendable balance — never < 0
  totalPointsEarned: number; // lifetime total — only increases
  createdAt: Date;
  updatedAt: Date;
}
```

#### TypeORM constraints
- Unique on `(customerId, businessId)` — one card per customer per business
- Index on `customerId`, `businessId`

#### Repository methods
- `create(data)` → `LoyaltyCard`
- `findById(id)` → `LoyaltyCard | null`
- `findByCustomerAndBusiness(customerId, businessId)` → `LoyaltyCard | null`
- `save(card)` → `LoyaltyCard` — persists in-memory changes (used after addPoints/deductPoints)

#### Migration
```bash
npm run migration:generate -- src/database/migrations/CreateLoyaltyCardsTable
npm run migration:run:relational
```

#### Definition of done
- [x] `loyalty_cards` table in DB with unique constraint
- [x] `npm run build` passes

---

### B-04.2 — LoyaltyCard: service methods ✅

**SP:** 3 | **Status:** Done
**Depends on:** B-04.1
**Deliverable:** Unit tests pass for `findOrCreate`, `addPoints`, `deductPoints`

#### Service to create: `loyalty-cards.service.ts`
```ts
async findOrCreateForCustomer(customerId: number, businessId: string): Promise<LoyaltyCard>
async addPoints(cardId: string, points: number): Promise<LoyaltyCard>
  // increments both `points` and `totalPointsEarned`
async deductPoints(cardId: string, points: number): Promise<LoyaltyCard>
  // decrements `points` only; throws 422 { points: 'insufficient' } if card.points < points
findByCustomerAndBusiness(customerId: number, businessId: string): Promise<LoyaltyCard | null>
```

#### Business rule
```ts
if (card.points < points) {
  throw new UnprocessableEntityException({ status: 422, errors: { points: 'insufficient' } });
}
```

#### Definition of done
- [ ] Unit tests in `loyalty-cards.service.spec.ts`: addPoints, deductPoints (insufficient), findOrCreate (existing + new)
- [ ] `npm run test` passes

---

### B-04.3 — LoyaltyCard: `GET /loyalty-cards/me` controller ✅

**SP:** 2 | **Status:** Done
**Depends on:** B-04.2, B-01 (Telegram JWT with cardId)
**Deliverable:** Customer can call `GET /loyalty-cards/me` and receive their card + points balance

#### Controller
```ts
@Get('me')
@Roles(RoleEnum.customer)
async getMyCard(@Request() req): Promise<LoyaltyCard> {
  return this.loyaltyCardsService.findOrCreateForCustomer(req.user.id, req.user.businessId);
}
```

#### Definition of done
- [x] `GET /loyalty-cards/me` returns 200 with card data
- [x] Customer with 0 points gets a card created automatically (findOrCreate)
- [x] Non-customer gets 403

---

## B-05 — Reward Module ✅

**SP:** 5 | **Layer:** BE | **Status:** Done
**Depends on:** B-03.M
**Blocks:** B-05b, B-11, B-12, B-27

### Description
Rewards are prizes customers can redeem. Owner CRUD with soft-delete. Customer catalog with `canRedeem` computed per card balance.

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

### Domain entity
```ts
export class Reward {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  pointsCost: number;         // @Min(1)
  imageUrl: string | null;
  isActive: boolean;
  stock: number | null;       // null = unlimited
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;     // soft-delete
}
```

### Service methods
- `findActiveWithEligibility(businessId, customerPoints)` → `Array<Reward & { canRedeem, ptsNeeded }>`
- `create(businessId, dto)` → `Reward`
- `update(id, businessId, dto)` → `Reward` — validates ownership
- `softDelete(id, businessId)` → `void`

### Controller routes
- `GET /api/v1/rewards` — customer catalog (role: customer)
- `POST /api/v1/rewards` — create (role: owner)
- `PATCH /api/v1/rewards/:id` — update (role: owner)
- `DELETE /api/v1/rewards/:id` — soft-delete (role: owner)

### Migration
```bash
npm run migration:generate -- src/database/migrations/CreateRewardsTable
npm run migration:run:relational
```

### Acceptance criteria
- [x] `GET /rewards` excludes inactive + soft-deleted
- [x] `canRedeem` correct per customer balance
- [x] Owner cannot modify another business's reward (403)
- [x] `pointsCost` validated as positive integer

### Definition of done
- [ ] Unit tests in `rewards.service.spec.ts`
- [x] `rewards` table in DB with soft-delete column
- [x] `npm run build` passes

---

## B-05b — RewardTranslation Module ✅

**SP:** 3 | **Layer:** BE | **Status:** Done
**Depends on:** B-05
**Blocks:** B-37 (translation service), B-27e (reward translation editor)

### Description
Per-locale translations for `name` and `description` on Reward. Same pattern as B-03b (BusinessTranslation). Lives inside `rewards/` module — no separate NestJS module.

### Files to create
```
backend/src/rewards/
├── domain/reward-translation.ts
├── dto/upsert-reward-translation.dto.ts
├── infrastructure/persistence/reward-translation.repository.ts
└── infrastructure/persistence/relational/
    ├── entities/reward-translation.entity.ts
    ├── mappers/reward-translation.mapper.ts
    └── repositories/reward-translations.repository.ts
```
`RelationalRewardPersistenceModule` updated to register both entities + both repos.

### Domain entity
```ts
export class RewardTranslation {
  id: string;
  rewardId: string;
  locale: string;
  field: 'name' | 'description';
  value: string;
}
```

### Service methods added to `RewardsService`
- `upsertTranslation(data)` → `RewardTranslation`
- `getTranslations(rewardId)` → `RewardTranslation[]`
- `getTranslatedField(rewardId, locale, field, defaultLocale)` → `string | null`

### Migration
```bash
npm run migration:generate -- src/database/migrations/CreateRewardTranslationTable
npm run migration:run:relational
```

### Definition of done
- [x] `reward_translation` table in DB with unique constraint on `(reward_id, locale, field)`
- [x] `npm run build` passes

---

## B-06 — Transaction Module (Story) ✅

**SP:** 8 total | **Layer:** BE | **Status:** Done
**Depends on:** B-04.1
**Blocks:** B-17, B-21, B-23

Immutable audit log of every earn/redeem event. Never updated or deleted. Mistakes corrected by a reversal transaction of the opposite type.

---

### B-06.1 — Transaction: domain + persistence + migration ✅

**SP:** 3 | **Status:** Done
**Deliverable:** `transactions` table exists in DB, build passes

#### Domain entity
```ts
export class Transaction {
  id: string;
  cardId: string;
  businessId: string;
  type: 'earn' | 'redeem';
  points: number;             // always positive
  label: string;              // "Beer House" for earn, reward name for redeem
  cashierTelegramId: number | null;
  rewardId: string | null;
  note: string | null;
  createdAt: Date;            // no updatedAt/deletedAt — immutable
}
```

#### Repository methods
- `create(data)` → `Transaction`
- `findManyByCardId(cardId, pagination, filters)` → `Transaction[]`
- `findRecentByBusinessId(businessId, limit)` → `Transaction[]`

**No `update` or `delete` methods on the port** — immutability enforced at the port level.

#### Migration
```bash
npm run migration:generate -- src/database/migrations/CreateTransactionsTable
npm run migration:run:relational
```

#### Definition of done
- [x] `transactions` table in DB with indexes on `card_id`, `business_id`, `created_at`, `type`
- [x] `npm run build` passes

---

### B-06.2 — Transaction: `create` service + `GET /transactions` controller ✅

**SP:** 3 | **Status:** Done
**Depends on:** B-06.1, B-04.2
**Deliverable:** `GET /transactions` returns paginated history for the authenticated customer

#### Service methods
- `create(dto)` → `Transaction` — internal use only (no public POST endpoint)
- `findManyByCardId(cardId, paginationOptions)` → `Transaction[]`

#### Controller
- `GET /api/v1/transactions` — customer's own card history (role: customer, paginated, last 30 days default)

#### Definition of done
- [x] `GET /transactions` returns paginated results with `data` + `hasNextPage`
- [x] Customer can only see their own card's transactions
- [ ] Unit tests: create, findMany

---

### B-06.3 — Transaction: query filters + cashier log ✅

**SP:** 2 | **Status:** Done
**Depends on:** B-06.2
**Deliverable:** Type and date range filters work; `findRecentByBusinessId` available for bot

#### Features
- `?type=earn|redeem` filter
- `?from=&to=` date range (default: last 30 days)
- `findRecentByBusinessId(businessId, limit)` — used by B-25 (`/history` bot command)

#### Definition of done
- [x] Filter by type returns only matching transactions
- [x] Date range filter works
- [ ] Unit tests: filter combinations

---

## B-07 — Redemption Module (Story) ✅

**SP:** 5 total | **Layer:** BE | **Status:** Done
**Depends on:** B-04.2, B-05
**Blocks:** B-12, B-13, B-14, B-15, B-16

Reward redemption lifecycle: pending → confirmed | expired | cancelled. Points pre-deducted on creation, auto-refunded on expiry.

---

### B-07.1 — Redemption: domain + persistence + migration + `create` ✅

**SP:** 3 | **Status:** Done
**Deliverable:** `redemptions` table exists; `POST /redemptions` creates a code and pre-deducts points

#### Domain entity
```ts
export class Redemption {
  id: string;
  cardId: string;
  rewardId: string;
  businessId: string;
  code: string;               // 6-digit e.g. "459201" — unique
  qrData: string;             // URL for QR display
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  pointsCost: number;         // snapshot of reward.pointsCost at creation
  expiresAt: Date;            // createdAt + 5 min
  confirmedAt: Date | null;
  cashierTelegramId: number | null;
  createdAt: Date;
}
```

#### `create` logic
1. Load card — throw 422 `{ points: 'insufficient' }` if `card.points < reward.pointsCost`
2. `loyaltyCardsService.deductPoints(cardId, pointsCost)`
3. Generate `code = crypto.randomInt(100000, 999999).toString()`
4. Set `expiresAt = now + 5 minutes`
5. Persist and return

#### Migration
```bash
npm run migration:generate -- src/database/migrations/CreateRedemptionsTable
npm run migration:run:relational
```

#### Definition of done
- [x] `redemptions` table with unique index on `code`
- [x] `POST /redemptions` returns 201 with code + qrData
- [x] Points pre-deducted immediately on create
- [x] `npm run build` passes

---

### B-07.2 — Redemption: confirm, cancel, expire + cron ✅

**SP:** 2 | **Status:** Done
**Depends on:** B-07.1, B-06.2 (Transaction create for audit log)
**Deliverable:** Full lifecycle works; auto-refund on 5-min expiry

#### Service methods
- `confirm(code, cashierTelegramId)` → `Redemption` — throws 410 if expired, 409 if already confirmed
- `cancel(code)` → `Redemption` — refunds points
- `expire(id)` → `void` — sets expired, refunds points, creates reversal Transaction

#### Cron job (`redemptions.cron.ts`)
```ts
@Cron(CronExpression.EVERY_30_SECONDS)
async expirePendingRedemptions() { ... }
```
Register `@nestjs/schedule` in AppModule.

#### Definition of done
- [x] `PATCH /redemptions/:code/confirm` → 200
- [x] `PATCH /redemptions/:code/cancel` → 200, points refunded
- [x] Cron auto-expires and refunds after 5 min (cron integrated into service)
- [ ] Unit tests: confirm (happy + expired + already confirmed), cancel, expire

---

## B-09 — Seeds: Beer House Pilot Data ✅

**SP:** 2 | **Layer:** BE | **Status:** Done
**Depends on:** B-03.M, B-04.1, B-05 (all tables must exist)
**Blocks:** local development, first demo

### Description
Seed data: superadmin account, owner account, Beer House business, 4 rewards.

### Files to create
```
backend/src/database/seeds/relational/
├── business/
│   ├── business-seed.module.ts
│   └── business-seed.service.ts
└── reward/
    ├── reward-seed.module.ts
    └── reward-seed.service.ts
```

### Seed data

**Accounts** (add to existing user seed):
```ts
{ email: 'superadmin@loyalty.app', password: 'ChangeMe123!', role: RoleEnum.superadmin }
{ email: 'owner@beerhouse.am', password: 'BeerHouse2024!', role: RoleEnum.owner }
```

**Business:**
```ts
{ name: 'Beer House', ownerId: <owner.id>, earnRateMode: 'per_amd_spent', earnRateValue: 100 }
```

**Rewards:**
| Name | Points |
|---|---|
| Free Pint | 500 |
| Half Off Burger | 800 |
| Appetizer Platter | 1200 |
| Beer Flight | 1500 |

### Acceptance criteria
- [x] `npm run seed:run:relational` completes without errors
- [x] Running twice doesn't create duplicates (findOrCreate pattern)
- [ ] Owner can log in and `GET /businesses/me` returns Beer House

### Definition of done
- [x] Seed files committed
- [ ] Manual test: owner login + GET /businesses/me works
