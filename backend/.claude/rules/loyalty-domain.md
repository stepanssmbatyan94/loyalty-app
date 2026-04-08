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
  name: string;
  ownerId: string;
  logoUrl: string | null;
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';  // default: per_amd_spent
  earnRateValue: number;     // default: 100 (1 pt per 100 AMD)
  botToken: string;          // Telegram Bot API token — NEVER expose in API responses
  telegramGroupChatId: string;  // Staff group where cashier bot operates
  botUsername: string;       // e.g. "beer_house_bot" (without @)
  isActive: boolean;
  createdAt: Date;
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
| `businesses/` | Business entity, earn rate config, bot config |
| `loyalty-cards/` | LoyaltyCard entity, `GET /loyalty-cards/me`, scan token generation |
| `rewards/` | Reward entity, customer catalog, owner CRUD |
| `transactions/` | Transaction entity, earn endpoint (called by bot) |
| `redemptions/` | Redemption entity, POST/validate/confirm/cancel/cron |
| `users/` | User entity (customer, cashier, owner, super_admin), cashier management |
| `telegram/` | Bot webhook handler, all grammy bot logic, BotRegistry, notifications |
| `analytics/` | Dashboard KPIs, top customers — read-only aggregations |
| `admin/` | Super admin endpoints for business provisioning |
| `auth/` | Telegram initData HMAC strategy + email/password JWT strategy |

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
| `user.password` | `@Exclude({ toPlainOnly: true })` |
| `user.email` | `@Expose({ groups: ['owner', 'admin'] })` only |
| `card.totalPointsEarned` | Public — used for analytics leaderboard |

---

## Forbidden patterns in this domain

| Forbidden | Why |
|---|---|
| Accepting `cardId` or `businessId` from request body in customer endpoints | Extract from JWT only — prevents IDOR |
| Exposing `business.botToken` in any API response | Security — treat as secret |
| Hard-deleting Rewards | Historical transactions reference them; use soft-delete |
| Setting `card.points < 0` | Business invariant — always validate before deduction |
| Creating a Transaction without a corresponding LoyaltyCard update | Must be atomic — wrap in a DB transaction |
