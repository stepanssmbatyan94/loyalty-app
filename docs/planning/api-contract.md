# API Contract

Base URL: `/api/v1`
Auth header: `Authorization: Bearer <jwt_token>`
Error format: `{ "status": 422, "errors": { "fieldName": "i18nErrorKey" } }`

All timestamps are ISO 8601 strings. All IDs are UUIDs unless noted.

> **Implementation status legend used in this file:**
> - ✅ **Exists** — endpoint is live in the boilerplate backend
> - 🔧 **To build** — not yet implemented; shape is the agreed spec

---

## Auth

### POST /api/v1/auth/telegram — 🔧 To build (Epic 1, B-01)
Customer authenticates via Telegram Mini App `initData`.

**Request**
```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```

**Response 201**
```json
{
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenExpires": 1700054400000,
  "user": {
    "id": 1,
    "firstName": "Armen",
    "lastName": "Petrosyan",
    "role": { "id": 3, "name": "customer" },
    "telegramId": 123456789,
    "phone": "+37491234567"
  },
  "card": {
    "id": "uuid",
    "businessId": "uuid",
    "points": 0,
    "totalPointsEarned": 0,
    "isNew": true
  }
}
```

**Errors**
- `400` — `{ errors: { initData: "invalidOrExpired" } }`

---

### POST /api/v1/auth/email/login — ✅ Exists (boilerplate)
Owner or Super Admin logs in.

**Request**
```json
{
  "email": "owner@beerhouse.am",
  "password": "SecurePass123"
}
```

**Response 200**
```json
{
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenExpires": 1700054400000,
  "user": {
    "id": 1,
    "email": "owner@beerhouse.am",
    "firstName": "Gevorg",
    "lastName": "Smith",
    "photo": null,
    "role": { "id": 2, "name": "owner" },
    "status": { "id": 1, "name": "Active" },
    "createdAt": "2023-10-01T00:00:00.000Z",
    "updatedAt": "2023-10-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

> **Note — fields added when loyalty modules are built (B-02):**
> `user.businessId` will be included once the `Business` module and user–business relationship are implemented.
> The frontend should read `businessId` from the **JWT payload** (decoded client-side) rather than from the login response body — this avoids a breaking change when the field is added.

**Errors**
- `422` — `{ errors: { email: "notFound" } }`
- `422` — `{ errors: { password: "incorrectPassword" } }`

---

### POST /api/v1/auth/refresh — ✅ Exists (boilerplate)
Refresh an expired access token. Send `refreshToken` as the Bearer token.

**Request header:** `Authorization: Bearer <refreshToken>`

**Response 200**
```json
{
  "token": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenExpires": 1700054400000
}
```

---

### POST /api/v1/auth/logout — ✅ Exists (boilerplate)
Invalidate the current session.

**Response 204** — no body

---

## Loyalty Cards

### GET /api/v1/loyalty-cards/me
Returns the authenticated customer's card for the current business (from JWT `businessId`).

**Auth:** Customer JWT required

**Response 200**
```json
{
  "id": "uuid",
  "businessId": "uuid",
  "customerId": "uuid",
  "points": 2450,
  "totalPointsEarned": 3200,
  "qrCodeUrl": "https://...",
  "nextReward": {
    "id": "uuid",
    "name": "Free Pint",
    "pointsCost": 2500,
    "ptsRemaining": 50
  },
  "progressPercent": 85,
  "memberSince": "2023-10-12T00:00:00.000Z"
}
```

**Notes:**
- `nextReward` is the cheapest active reward the customer hasn't yet reached. `null` if customer has enough for all rewards.
- `progressPercent` = `(points / nextReward.pointsCost) * 100`, capped at 100.

---

### GET /api/v1/scan/:cardId/:scanToken
Called when cashier scans the customer's QR code. Validates token, triggers bot message to business group. Not called directly by the Mini App.

**Auth:** None (secured by scanToken HMAC)

**Response 200**
```json
{ "status": "scan_accepted", "customerName": "Armen Petrosyan" }
```

**Errors**
- `410` — `{ errors: { scanToken: "expired" } }`
- `409` — `{ errors: { scanToken: "alreadyUsed" } }`

---

## Rewards

### GET /api/v1/rewards
Returns all active rewards for the business with redeem eligibility.

**Auth:** Customer JWT required

**Query params:** none for MVP

**Response 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Free Pint",
      "description": "Choose any flagship brew from our draft list.",
      "pointsCost": 500,
      "imageUrl": "https://...",
      "isActive": true,
      "canRedeem": true,
      "ptsNeeded": 0
    },
    {
      "id": "uuid",
      "name": "Appetizer Platter",
      "description": "A massive selection of our top-rated starters.",
      "pointsCost": 1200,
      "imageUrl": "https://...",
      "isActive": true,
      "canRedeem": false,
      "ptsNeeded": 280
    }
  ]
}
```

**Notes:**
- Sorted by `pointsCost` ascending
- `canRedeem = card.points >= reward.pointsCost`
- `ptsNeeded = max(0, reward.pointsCost - card.points)`
- Inactive rewards (`isActive: false`) are excluded

---

### POST /api/v1/rewards
Create a new reward. Owner only.

**Auth:** Owner JWT required

**Request**
```json
{
  "name": "Free Pint",
  "description": "Choose any flagship brew.",
  "pointsCost": 500,
  "imageUrl": "https://...",
  "isActive": true,
  "stock": null
}
```

**Response 201**
```json
{
  "id": "uuid",
  "name": "Free Pint",
  "description": "Choose any flagship brew.",
  "pointsCost": 500,
  "imageUrl": "https://...",
  "isActive": true,
  "stock": null,
  "createdAt": "2023-10-12T00:00:00.000Z"
}
```

---

### PATCH /api/v1/rewards/:id
Update a reward. Owner only. All fields optional.

**Auth:** Owner JWT required

**Request**
```json
{
  "name": "Free Pint",
  "pointsCost": 600,
  "isActive": false
}
```

**Response 200** — updated reward object (same shape as POST response)

**Errors**
- `404` — `{ errors: { reward: "notFound" } }`
- `403` — if reward belongs to different business

---

### DELETE /api/v1/rewards/:id
Soft-delete a reward (sets `deletedAt`). Owner only.

**Auth:** Owner JWT required

**Response 204** — no body

---

## Redemptions

### POST /api/v1/redemptions
Customer initiates a reward redemption. Points are pre-deducted immediately.

**Auth:** Customer JWT required

**Request**
```json
{
  "rewardId": "uuid"
}
```

**Response 201**
```json
{
  "id": "uuid",
  "code": "459201",
  "qrData": "https://api.yourdomain.com/api/v1/redemptions/validate/459201",
  "rewardName": "Free Pint",
  "pointsCost": 500,
  "expiresAt": "2023-10-12T14:35:00.000Z",
  "status": "pending"
}
```

**Errors**
- `422` — `{ errors: { points: "insufficient" } }` — customer doesn't have enough points
- `422` — `{ errors: { reward: "notActive" } }` — reward is inactive
- `422` — `{ errors: { reward: "outOfStock" } }` — stock exhausted

---

### GET /api/v1/redemptions/validate/:code
Called by the Telegram Bot when cashier scans QR or types code. Returns redemption details.

**Auth:** Internal bot-to-backend call (using bot service token, not user JWT)

**Response 200**
```json
{
  "code": "459201",
  "status": "valid",
  "rewardName": "Free Pint",
  "customerName": "Armen Petrosyan",
  "pointsCost": 500,
  "expiresAt": "2023-10-12T14:35:00.000Z",
  "secondsRemaining": 142
}
```

**Errors**
- `410` — `{ status: "expired", message": "Code expired. Points auto-refunded." }`
- `409` — `{ status: "already_used" }`
- `404` — code not found

---

### PATCH /api/v1/redemptions/:code/confirm
Cashier confirms redemption via Telegram Bot. Marks code as used.

**Auth:** Internal bot-to-backend call

**Request**
```json
{
  "cashierTelegramId": 987654321
}
```

**Response 200**
```json
{
  "success": true,
  "transactionId": "uuid",
  "customerName": "Armen Petrosyan",
  "rewardName": "Free Pint",
  "pointsDeducted": 500,
  "newBalance": 1950
}
```

---

### PATCH /api/v1/redemptions/:code/cancel
Cashier rejects or customer cancels. Points are refunded.

**Auth:** Customer JWT OR internal bot call

**Response 200**
```json
{
  "success": true,
  "pointsRefunded": 500,
  "newBalance": 2950
}
```

---

## Transactions

### GET /api/v1/transactions
Returns paginated transaction history for the authenticated customer.

**Auth:** Customer JWT required

**Query params**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 50) |
| `type` | `earn` \| `redeem` | — | Filter by transaction type |
| `from` | ISO date | 30 days ago | Start date filter |
| `to` | ISO date | now | End date filter |

**Response 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "earn",
      "points": 120,
      "label": "Beer House",
      "note": null,
      "createdAt": "2023-10-24T17:45:00.000Z"
    },
    {
      "id": "uuid",
      "type": "redeem",
      "points": 500,
      "label": "Free Pint",
      "note": null,
      "createdAt": "2023-10-20T19:15:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "hasNextPage": true
  }
}
```

---

### POST /api/v1/transactions/earn
Called internally by the Telegram Bot after cashier approves. Not called by the Mini App.

**Auth:** Internal bot-to-backend call

**Request**
```json
{
  "cardId": "uuid",
  "purchaseAmountAmd": 3500,
  "cashierTelegramId": 987654321,
  "scanToken": "abc123"
}
```

**Response 201**
```json
{
  "transactionId": "uuid",
  "pointsAdded": 35,
  "newBalance": 2485,
  "customerName": "Armen Petrosyan"
}
```

**Notes:**
- `pointsAdded = floor(purchaseAmountAmd / business.earnRateValue)` where `earnRateValue` is AMD per point (e.g. 100)
- `scanToken` is invalidated after this call

---

## Analytics

### GET /api/v1/analytics/dashboard
Dashboard KPIs for the business owner.

**Auth:** Owner JWT required

**Response 200**
```json
{
  "totalCustomers": 142,
  "transactionsToday": 23,
  "totalPointsIssuedAllTime": 71500,
  "activeRewards": 4
}
```

---

### GET /api/v1/analytics/top-customers
Top customers ranked by lifetime points earned.

**Auth:** Owner JWT required

**Query params**
| Param | Type | Default |
|---|---|---|
| `page` | number | 1 |
| `limit` | number | 20 |

**Response 200**
```json
{
  "data": [
    {
      "rank": 1,
      "customerId": "uuid",
      "firstName": "Armen",
      "lastName": "Petrosyan",
      "phone": "+37491234567",
      "totalPointsEarned": 8450,
      "currentBalance": 2450
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "hasNextPage": true
  }
}
```

---

## Businesses

### GET /api/v1/businesses/me
Returns the authenticated owner's business profile.

**Auth:** Owner JWT required

**Response 200**
```json
{
  "id": "uuid",
  "name": "Beer House",
  "logoUrl": "https://...",
  "earnRateMode": "per_amd_spent",
  "earnRateValue": 100,
  "telegramGroupChatId": "-1001234567890",
  "createdAt": "2023-10-01T00:00:00.000Z"
}
```

---

### PATCH /api/v1/businesses/me/settings
Update earn rate or other business settings. Owner only.

**Auth:** Owner JWT required

**Request**
```json
{
  "earnRateMode": "per_amd_spent",
  "earnRateValue": 100
}
```

**Response 200** — updated business object

---

## Users (Cashier Management)

### GET /api/v1/users
List users by role within the owner's business.

**Auth:** Owner JWT required

**Query params:** `?role=cashier`

**Response 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "Varduhi",
      "lastName": "Hakobyan",
      "email": "v.hakobyan@beerhouse.am",
      "telegramUsername": "varduhi_h",
      "telegramUserId": 111222333,
      "status": "active",
      "createdAt": "2023-10-05T00:00:00.000Z"
    }
  ]
}
```

---

### POST /api/v1/users
Owner creates a cashier account.

**Auth:** Owner JWT required

**Request**
```json
{
  "firstName": "Varduhi",
  "lastName": "Hakobyan",
  "email": "v.hakobyan@beerhouse.am",
  "telegramUserId": 111222333,
  "role": "cashier"
}
```

**Response 201** — created user object

**Notes:**
- `telegramUserId` is the cashier's Telegram numeric ID (needed for bot auth)
- Backend sends invite email with temporary password

---

### PATCH /api/v1/users/:id/status
Activate or deactivate a cashier account.

**Auth:** Owner JWT required

**Request**
```json
{ "status": "inactive" }
```

**Response 200** — updated user object

---

## Super Admin

### GET /api/v1/admin/businesses
List all businesses on the platform.

**Auth:** Super Admin JWT required

**Response 200**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Beer House",
      "ownerEmail": "owner@beerhouse.am",
      "totalCustomers": 142,
      "createdAt": "2023-10-01T00:00:00.000Z",
      "status": "active"
    }
  ]
}
```

---

### POST /api/v1/admin/businesses
Super admin creates a new business + owner account.

**Auth:** Super Admin JWT required

**Request**
```json
{
  "businessName": "Beer House",
  "ownerEmail": "owner@beerhouse.am",
  "ownerFirstName": "Gevorg",
  "ownerLastName": "Mkrtchyan",
  "botToken": "123456:ABC-DEF...",
  "telegramGroupChatId": "-1001234567890"
}
```

**Response 201**
```json
{
  "businessId": "uuid",
  "ownerId": "uuid",
  "ownerEmail": "owner@beerhouse.am",
  "message": "Owner credentials sent to owner@beerhouse.am"
}
```

**Notes:**
- Backend registers the bot webhook automatically upon creation
- Owner receives a welcome email with login URL + temporary password

---

## Telegram Webhook

### POST /api/v1/telegram/webhook/:businessId
Receives all incoming Telegram updates for a specific business bot. Called by Telegram servers directly (not by the frontend).

**Auth:** Telegram webhook secret header (set during `setWebhook`)

**Body:** Telegram `Update` object (standard Telegram Bot API format)

**Response 200** — always returns 200 to Telegram to acknowledge receipt

---

## Common Error Responses

| HTTP Status | When |
|---|---|
| `400 Bad Request` | Malformed request body or missing required fields |
| `401 Unauthorized` | Missing or invalid JWT token |
| `403 Forbidden` | Valid token but insufficient role/permissions |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Duplicate resource or state conflict |
| `410 Gone` | Resource expired (e.g. redemption code) |
| `422 Unprocessable Entity` | Validation error — always includes `{ status: 422, errors: { field: "i18nKey" } }` |
| `500 Internal Server Error` | Unexpected server error |
