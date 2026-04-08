# Authentication & Authorization Flows

Defines how each of the three roles authenticates and what they are permitted to access.

---

## Roles & Access Summary

| Role | Interface | Auth method | JWT claims |
|---|---|---|---|
| **Customer** | Telegram Mini App | Telegram `initData` HMAC | `id`, `role: { id, name }`, `sessionId` + `businessId`, `cardId`, `telegramId` (added in B-01) |
| **Cashier** | Telegram Bot (group) | Telegram Bot inline actions | No JWT — actions are authorized via bot token + chat membership |
| **Business Owner** | Admin web panel | Email + password | `id`, `role: { id, name }`, `sessionId` + `businessId` (added in B-02) |
| **Super Admin** | Separate React admin panel | Email + password | `id`, `role: { id, name }`, `sessionId` |

> **Current boilerplate JWT payload** (before loyalty modules are built):
> ```json
> { "id": 1, "role": { "id": 2, "name": "user" }, "sessionId": "uuid", "iat": 0, "exp": 0 }
> ```
> Fields `businessId`, `cardId`, `telegramId` are added to the payload in Epic 1 (B-01, B-02).

---

## 1. Customer — Telegram Mini App Auth

### First-time flow
```
Customer scans business QR code
  → Telegram opens Mini App
  → App calls window.Telegram.WebApp.requestContact()
  → Customer taps "Share Phone Number" (one tap)
  → Telegram provides: { first_name, last_name, phone_number, id (telegramId) }
  → Mini App sends initData to backend:
      POST /api/v1/auth/telegram
      Body: { initData: "<raw initData string from Telegram.WebApp.initData>" }
  → Backend validates HMAC signature using BOT_TOKEN
  → Backend checks if user exists by telegramId
    → If new: creates User + LoyaltyCard (points: 0), sends welcome Telegram message
    → If existing: loads existing card
  → Backend returns: { token, refreshToken, tokenExpires }
  → Mini App stores token in memory (not localStorage — Mini App context)
  → All subsequent API calls include: Authorization: Bearer <token>
```

### Re-open flow
```
Customer reopens Mini App
  → initData is always available from Telegram.WebApp.initData
  → App re-authenticates silently with POST /api/v1/auth/telegram
  → No contact prompt on re-open (phone already stored)
  → New token issued
```

### JWT payload (customer) — target shape after B-01
```json
{
  "id": 1,
  "role": { "id": 3, "name": "customer" },
  "sessionId": "uuid",
  "businessId": "uuid-business-id",
  "cardId": "uuid-card-id",
  "telegramId": 123456789,
  "iat": 1700000000,
  "exp": 1700054400
}
```

### Token expiry
- Access token: 15 minutes (set via `AUTH_JWT_TOKEN_EXPIRES_IN` env var)
- Refresh token: 30 days (set via `AUTH_REFRESH_TOKEN_EXPIRES_IN` env var)
- On expiry: call `POST /api/v1/auth/refresh` with refreshToken as the Bearer token

---

## 2. Business Owner — Admin Web Panel Auth

### Login flow
```
Owner opens admin panel (separate web app)
  → Enters email + password
  → POST /api/v1/auth/email/login
      Body: { email: "owner@beerhouse.am", password: "••••••••" }
  → Backend validates credentials, checks role === 'owner'
  → Returns: { token, refreshToken, tokenExpires, user: { id, name, email, businessId } }
  → Token stored in httpOnly cookie (set by backend) OR localStorage (decided at implementation)
  → Admin panel reads businessId from JWT to scope all requests
```

### JWT payload (owner) — target shape after B-02
```json
{
  "id": 1,
  "role": { "id": 2, "name": "owner" },
  "sessionId": "uuid",
  "businessId": "uuid-business-id",
  "iat": 1700000000,
  "exp": 1700054400
}
```

---

## 3. Super Admin — Admin React Panel Auth

### Login flow
```
Super admin opens super admin panel (separate React app, different URL)
  → Enters email + password
  → POST /api/v1/auth/email/login
      Body: { email: "superadmin@loyalty.app", password: "••••••••" }
  → Backend checks role === 'superadmin'
  → Returns token with superadmin role
  → All super-admin endpoints require role: superadmin guard
```

### JWT payload (superadmin)
```json
{
  "id": 1,
  "role": { "id": 4, "name": "superadmin" },
  "sessionId": "uuid",
  "iat": 1700000000,
  "exp": 1700054400
}
```

### Superadmin account creation
- Seeded via backend seed script for initial setup
- No self-registration flow

---

## 4. Cashier — Telegram Bot (No JWT)

The cashier does not log in to a web app. All cashier actions happen through the business's dedicated Telegram Bot inside the business group.

### Authorization model
- Cashier is a member of the business's Telegram group
- The bot only processes commands from members of that specific group (validated by `chat.id` matching `business.telegramGroupChatId`)
- No JWT needed — Telegram guarantees the sender's identity via `from.id`
- Cashier accounts are created by the owner in the admin panel (name + Telegram username/ID stored in DB)
- Only registered cashier Telegram IDs can trigger earn/confirm actions

### Security constraints
- Bot ignores all messages from chats other than the registered `telegramGroupChatId`
- Bot ignores inline button callbacks from users not in the registered cashier list
- All bot actions are logged as Transactions with `cashierId` = the Telegram user ID of the approver

---

## 5. Business Bot Setup (per business)

Each business has its own dedicated Telegram Bot. Setup process:

1. Super admin creates the bot manually via @BotFather → receives `BOT_TOKEN`
2. Super admin adds the bot to the business's Telegram group
3. Super admin opens the loyalty super admin panel
4. Creates business account with:
   - Business name
   - Owner email (owner receives login credentials by email)
   - `botToken` (from BotFather)
   - `telegramGroupChatId` (the group chat ID where the bot is added)
5. Backend registers the bot webhook: `POST https://api.telegram.org/bot{token}/setWebhook`
6. All bot messages from that group now route to the loyalty backend webhook handler

---

## 6. Role-Based Access Control Matrix

| Endpoint group | Customer | Cashier (Bot) | Owner | Super Admin |
|---|---|---|---|---|
| `GET /loyalty-cards/me` | ✅ own card only | ❌ | ❌ | ❌ |
| `GET /rewards` | ✅ | ❌ | ✅ | ❌ |
| `POST/PATCH/DELETE /rewards` | ❌ | ❌ | ✅ own business | ❌ |
| `POST /redemptions` | ✅ own card | ❌ | ❌ | ❌ |
| `GET /redemptions/:code` | ❌ | ✅ via bot | ❌ | ❌ |
| `PATCH /redemptions/:code/confirm` | ❌ | ✅ via bot | ❌ | ❌ |
| `POST /transactions/earn` | ❌ | ✅ via bot | ❌ | ❌ |
| `GET /transactions` | ✅ own only | ❌ | ✅ all in business | ❌ |
| `GET /analytics/*` | ❌ | ❌ | ✅ own business | ✅ all |
| `PATCH /businesses/me/settings` | ❌ | ❌ | ✅ | ❌ |
| `POST /users` (create owner) | ❌ | ❌ | ✅ cashier only | ✅ |
| `GET /businesses` (all) | ❌ | ❌ | ❌ | ✅ |
