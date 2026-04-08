# Loyalty App — Domain Concepts

This document defines the business domain for the loyalty app. Read it before creating new features or naming things. Consistent terminology prevents confusion across the codebase, the UI, and the API.

---

## What this app is

A Telegram Mini App-based digital loyalty card system for small businesses (cafes, restaurants, barbershops, gyms). Customers earn points by scanning QR codes after purchases. Points are redeemed for rewards. No app download required — the entire customer experience runs inside Telegram.

---

## User roles

| Role | How they access the app | What they do |
|---|---|---|
| **Customer** | Telegram Mini App | Views their loyalty card, checks point balance, redeems rewards |
| **Cashier** | Web tool (cashier-facing) | Scans customer QR codes, adds points after purchases |
| **Business Owner** | Admin panel | Creates/edits rewards, views analytics, manages cashiers |

---

## Core domain entities

### LoyaltyCard
A customer's membership record at a specific business. A customer can have cards at multiple businesses.

| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID |
| `customerId` | string | Links to the customer's Telegram user |
| `businessId` | string | Which business issued the card |
| `points` | number | Current point balance (never negative) |
| `totalPointsEarned` | number | Lifetime total, for analytics |
| `createdAt` | Date | |
| `qrCode` | string | Customer presents this QR to the cashier |

### Transaction
A record of points being added or redeemed. Immutable once created.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `cardId` | string | Which loyalty card |
| `type` | `'earn'` \| `'redeem'` | |
| `points` | number | Always positive; type indicates direction |
| `cashierId` | string | Who processed the transaction |
| `note` | string? | Optional note from the cashier |
| `createdAt` | Date | |

### Reward
A prize that customers can redeem points for. Created by the Business Owner.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `businessId` | string | |
| `name` | string | e.g. "Free Coffee" |
| `description` | string? | |
| `pointsCost` | number | How many points to redeem |
| `isActive` | boolean | Inactive rewards can't be redeemed |
| `stock` | number? | `null` = unlimited |

### Business
A merchant registered on the platform.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `name` | string | Display name, e.g. "Brew & Grind Coffee" |
| `ownerId` | string | Links to the Business Owner user |
| `logoUrl` | string? | |
| `pointsPerVisit` | number | Default points earned per QR scan |

### PointBalance
Derived from LoyaltyCard — the customer's current points at a specific business. Not a separate entity; accessed via `card.points`.

---

## Business rules (enforce in UI and service calls)

1. **Points are non-negative.** A customer's `card.points` can never go below 0. The UI must prevent redemption if `pointsCost > card.points`.

2. **Earn = cashier scans QR + enters amount.** The cashier initiates all earn transactions. Customers cannot self-award points.

3. **Redeem = customer initiates.** Only the customer (or the app on their behalf) can redeem rewards. Cashiers cannot redeem on behalf of a customer without explicit customer action.

4. **Reward availability.** Before showing a "Redeem" button, verify:
   - `reward.isActive === true`
   - `reward.stock === null || reward.stock > 0`
   - `card.points >= reward.pointsCost`

5. **Transaction immutability.** Once a transaction is created, it cannot be edited or deleted. Show a "reverse transaction" flow (creates a new opposite transaction) if a mistake is made.

---

## UI terminology — use these exact words

| Concept | Use | Do not use |
|---|---|---|
| Points a customer has | **points** | credits, coins, tokens, stamps |
| Gaining points | **earn points** | get points, collect points, add credits |
| Giving points (cashier action) | **add points** | issue points, credit points |
| Using points | **redeem** | spend, use, exchange, cash in |
| The QR code on a customer's card | **loyalty card QR** | barcode, coupon |
| The prize redeemed | **reward** | prize, gift, benefit |
| A single earn/redeem event | **transaction** | operation, entry, record |
| Customer's total current points | **point balance** | wallet, account balance |
| Business-facing admin | **admin panel** | dashboard, backend |

---

## Feature → domain mapping

| `src/features/` directory | Owns domain concepts |
|---|---|
| `loyalty-cards/` | LoyaltyCard, PointBalance, customer QR display |
| `point-transactions/` | Transaction history, earn flow (cashier), redeem flow (customer) |
| `rewards/` | Reward catalog, redemption, reward management (owner) |
| `businesses/` | Business profile, settings, owner management |
| `users/` | User accounts (customer, cashier, owner), role management |
| `auth/` | Login, registration, Telegram auth, session |
| `analytics/` | Transaction summaries, business metrics (owner only) |

---

## i18n namespace conventions

Use these namespaces in `messages/en.json` and `messages/ru.json`:

| Namespace | Contents |
|---|---|
| `loyaltyCards` | Card display, QR, point balance |
| `pointTransactions` | Transaction history, earn/redeem flows |
| `rewards` | Reward catalog, redemption UI |
| `businesses` | Business profile, settings |
| `cashier` | Cashier-specific UI (add points workflow) |
| `admin` | Owner admin panel labels |
| `auth` | Login, register, logout |
| `common` | Shared: save, cancel, delete, loading, error, confirm |

---

## What the MVP covers (v1.0)

- Customer: view loyalty card + QR, see point balance, view transaction history, browse rewards, redeem a reward
- Cashier: scan customer QR, add points to a card
- Business Owner: create/edit rewards, view basic analytics, manage cashiers

Not in MVP: reward expiry, multiple reward tiers, push notifications, referral programs.
