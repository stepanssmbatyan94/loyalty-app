# Epics & Backlog

All epics and subtasks for Beer House Loyalty App MVP (v1.0).

**Layer:** `FE` = Next.js frontend | `BE` = NestJS backend | `BOT` = Telegram Bot service | `ADMIN` = Separate React super admin app
**Status:** `Todo` | `In Progress` | `Done`

Story point scale: 1 = trivial, 2 = small, 3 = medium, 5 = large, 8 = very large

**Key decisions baked in:**
- Earn rate: 1 pt per 100 AMD spent (configurable by owner)
- Cashier tool: Telegram Bot per business (not a web app)
- Customer QR scan triggers bot message → cashier approves via inline keyboard
- Redemption validation: cashier types 6-digit code in Telegram group
- Expired redemption: auto-refund points
- Customer registration: auto from Telegram contact share (one tap)
- Business Owner auth: email + password on web admin panel
- Super Admin panel: separate React app (no Next.js)
- Invite Friends card: static placeholder ("Coming Soon")
- **Multi-tenant:** One bot per business; owner self-configures bot token via admin panel (not super admin)
- **Webhook-based bots:** All business bots use `POST /api/v1/telegram/:businessId/webhook`; `BotRegistry` holds one grammy `Bot` instance per business
- **i18n storage:** Translations in `business_translation` + `reward_translation` DB tables; locale fallback chain: customer lang → business defaultLocale → base field
- **Translatable fields:** business name, welcome message, points label, reward name + description
- **Provisioning flow:** Super admin creates shell → owner completes bot/language/translation setup

---

## Epic 1 — Foundation & Project Setup

> Setup shared infrastructure: design tokens, shared UI components, Telegram Mini App initialization, and authentication architecture. All other epics are blocked until this is done.

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| F-01 | Tailwind design tokens — all custom colors, font families, border radius from design system | FE | 2 | Done | Copy token values from `docs/design/Home:My Card/code.html` tailwind config block |
| F-02 | `TopAppBar` shared component — logo variant, notification icon, user avatar | FE | 2 | Done | `bg-white/80 backdrop-blur-xl sticky top-0 z-50`; 3 variants: Home, Catalog, Redemption |
| F-03 | `BottomNavBar` shared component — 3 tabs (Home, Rewards, History), active pill state | FE | 2 | Done | Active: `bg-blue-50 rounded-full px-5 py-2`; inactive: `text-slate-400` |
| F-04 | Telegram Mini App initialization — extract `initData`, call `POST /auth/telegram`, store JWT | FE | 5 | Done | Use `@twa-dev/sdk`; call `requestContact()` on first open; store token in memory |
| B-01 | `POST /api/v1/auth/telegram` — validate initData HMAC, issue JWT (`userId + role + businessId + cardId`) | BE | 5 | Done | See `docs/planning/auth-flow.md` for JWT payload spec |
| B-02 | `POST /api/v1/auth/email/login` + refresh + logout — for Owner and Super Admin | BE | 3 | Done | Already mostly in NestJS boilerplate; add role guard for owner/superadmin |

**Epic 1 Total: FE 11 SP | BE 8 SP | Total 19 SP**

---

## Epic 2 — Core Domain (Backend)

> Define and persist the four core domain entities using Hexagonal Architecture. Pure backend epic. Unblocks all API integrations.

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| B-03 | `Business` module — domain, repo, service, controller | BE | 5 | Done | Fields: id, name, ownerId, logoUrl, earnRateMode, earnRateValue, botToken (encrypted), botUsername, webhookSecret, telegramGroupChatId, supportedLocales, defaultLocale, isActive |
| B-03b | `BusinessTranslation` module — domain, repo, service | BE | 3 | Todo | Translates: name, welcomeMessage, pointsLabel. Unique on (businessId, locale, field). Locale fallback in service. |
| B-04 | `LoyaltyCard` module — domain, repo, service, controller | BE | 8 | Todo | Fields: id, customerId, businessId, points, totalPointsEarned, createdAt. QR generated as signed URL. |
| B-05 | `Reward` module — domain, repo, service, controller | BE | 5 | Todo | Fields: id, businessId, name, description, pointsCost, isActive, imageUrl, stock (nullable). Soft-delete. |
| B-05b | `RewardTranslation` module — domain, repo, service | BE | 3 | Todo | Translates: name, description. Unique on (rewardId, locale, field). Same fallback pattern as BusinessTranslation. |
| B-06 | `Transaction` module — domain, repo, service, controller | BE | 8 | Todo | Fields: id, cardId, type (earn/redeem), points, cashierTelegramId?, rewardId?, note, createdAt. Immutable. |
| B-07 | `Redemption` module — domain, repo, service, controller | BE | 5 | Todo | Fields: id, cardId, rewardId, code (6-digit), qrData, status (pending/confirmed/expired/cancelled), expiresAt. Auto-refund on expiry via cron job. |
| B-08 | DB migrations — create all 5 core tables | BE | 3 | Todo | Tables: businesses, loyalty_cards, rewards, transactions, redemptions. Add FK indexes. |
| B-08b | DB migrations — business_translation + reward_translation tables | BE | 2 | Todo | Unique constraint on (businessId/rewardId, locale, field). FK indexes. |
| B-09 | Seeds — Beer House business + 4 sample rewards + superadmin account | BE | 2 | Todo | Free Pint (500pts), Half Off Burger (800pts), Appetizer Platter (1200pts), Beer Flight (1500pts). Include EN/RU/HY translations. |

**Epic 2 Total: FE 0 SP | BE 44 SP | Total 44 SP**

---

## Epic 3 — Home / My Card

> The customer's home screen. Shows the digital loyalty card, points balance, progress to next reward, highlight tiles, and recent activity.
> **Design:** `docs/design/Home:My Card/`

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| F-05 | `LoyaltyCardHero` component — gradient glass card, total points, "Premium Member" badge | FE | 5 | Todo | `glass-card` CSS class, `display-lg` 7xl points, `tertiary-fixed` progress bar fill |
| F-06 | `ProgressToReward` component — progress bar, "X pts away" chip, motivational text | FE | 3 | Todo | `progressPercent` and `nextReward.name` from API response |
| F-07 | `BentoHighlights` grid — Daily Check-in tile, Happy Hour tile, Invite Friends tile (static) | FE | 3 | Todo | Invite Friends: non-functional, shows "Coming Soon" dialog on tap |
| F-08 | `RecentActivity` section — last 2 transactions + "See all" link | FE | 3 | Todo | Reuses `TransactionItem` (Epic 6); "See all" switches to History tab |
| B-10 | `GET /api/v1/loyalty-cards/me` — returns card, balance, nextReward, progressPercent | BE | 3 | Todo | Joins with rewards to find next reachable reward; see `api-contract.md` |
| F-09 | Wire Home page to API — `useLoyaltyCard()` hook, skeleton loader, error boundary, 0-pts empty state | FE | 3 | Todo | Empty state text: "Welcome! Start earning points at Beer House." |

**Epic 3 Total: FE 17 SP | BE 3 SP | Total 20 SP**

---

## Epic 4 — Rewards Catalog

> Lists all active rewards. Affordable rewards have an active Redeem button; locked ones show progress toward them.
> **Design:** `docs/design/Rewards Catalog/`

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| F-10 | `PointsBalanceHero` — available balance with premium-gradient + decorative radial blur | FE | 2 | Todo | Shows `card.points` (spendable), not `totalPointsEarned` |
| F-11 | `RewardCard` component — image, name, description, pts cost, locked/unlocked states | FE | 5 | Todo | Locked: `opacity-75 grayscale-[0.5]`, lock icon overlay, disabled button "Need X more pts" |
| F-12 | `RewardsList` — renders catalog ordered by pts ascending, redeemable first | FE | 3 | Todo | Empty state: "No rewards available yet." |
| B-11 | `GET /api/v1/rewards` — with `canRedeem: boolean` and `ptsNeeded: number` computed per customer | BE | 3 | Todo | Uses `cardId` from JWT to compute eligibility |
| F-13 | Wire Rewards Catalog page to API | FE | 2 | Todo | `useRewards()` hook; skeleton loading state per card |

**Epic 4 Total: FE 12 SP | BE 3 SP | Total 15 SP**

---

## Epic 5 — Redemption Flow

> Customer initiates redemption from the catalog. Points pre-deducted, 6-digit code + QR generated with 5-min expiry. Auto-refunds if expired.
> **Design:** `docs/design/Redemption/`

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| B-12 | `POST /api/v1/redemptions` — validate balance, pre-deduct points, generate 6-digit code + QR, set 5-min TTL | BE | 8 | Todo | Points deducted immediately; reversed if code expires or is cancelled |
| B-13 | Cron job — expire pending redemptions older than 5 min, auto-refund points | BE | 3 | Todo | Run every 30s; update status to 'expired', add points back to card |
| B-14 | `GET /api/v1/redemptions/validate/:code` — bot calls this; returns reward name, customer, status | BE | 2 | Todo | Statuses: valid / expired / already_used / not_found |
| B-15 | `PATCH /api/v1/redemptions/:code/confirm` — bot confirms; marks used, creates Transaction, triggers notification | BE | 3 | Todo | Internal bot call; `cashierTelegramId` in body for audit |
| B-16 | `PATCH /api/v1/redemptions/:code/cancel` — cashier rejects or customer cancels; refunds points | BE | 2 | Todo | Creates a reversal Transaction record |
| F-14 | `RedemptionScreen` — reward badge, QR code display, 6-digit code, instructions text | FE | 5 | Todo | QR generated client-side from `qrData` URL using `qrcode.react` or similar |
| F-15 | `CountdownTimer` component — real-time MM:SS, warning red at <60s, "Expired" state | FE | 3 | Todo | Uses `useInterval`; on expiry show expired UI + "Points returned" message |
| F-16 | Redeem action from catalog → POST to API → navigate to RedemptionScreen | FE | 2 | Todo | Optimistic disable of button; error toast on API failure |
| F-17 | "Done" button → invalidate loyaltyCard + rewards cache → navigate to Home | FE | 2 | Todo | Confirm dialog if timer still running: "Code not confirmed yet — return to Home?" |

**Epic 5 Total: FE 12 SP | BE 18 SP | Total 30 SP**

---

## Epic 6 — Transaction History

> Full chronological list of customer earn/redeem events with filter chip.
> **Design:** `docs/design/Transaction History/`

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| B-17 | `GET /api/v1/transactions` — paginated, filter by type and date range, last 30 days default | BE | 3 | Todo | See `api-contract.md` for query params and response shape |
| F-18 | `TransactionItem` component — icon (earn=green/redeem=red), label, date+time, ±pts, type tag | FE | 3 | Todo | Earn: `tertiary-container` green icon; Redeem: `error` red icon |
| F-19 | `TransactionHistoryPage` — balance header, filter chips (All Time / This Month / This Week), list | FE | 3 | Todo | Filter chip updates query params |
| F-20 | Wire History page to API with `useInfiniteQuery` | FE | 3 | Todo | Load more on scroll; empty state: "No transactions yet." |

**Epic 6 Total: FE 9 SP | BE 3 SP | Total 12 SP**

---

## Epic 7 — Telegram Bot (Cashier Tool)

> The cashier's entire workflow runs through the business's dedicated Telegram Bot inside the staff group. No separate web UI for cashiers.
> See `docs/planning/telegram-bot-flows.md` for full interaction diagrams.

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| B-18 | `BotRegistry` service + webhook controller `POST /api/v1/telegram/:businessId/webhook` | BE | 8 | Todo | Replaces single-bot long-polling. Loads all active businesses on startup; creates grammy `Bot` per business in webhook mode; validates `X-Telegram-Bot-Api-Secret-Token` header. |
| B-18b | `/start` handler — look up business by botUsername, show supportedLocales keyboard | BOT | 3 | Todo | Fetches business from DB by `ctx.me.username`; builds dynamic language keyboard from `business.supportedLocales`. |
| B-18c | `lang:*` callback — find/create user, save language, send translated welcome from DB | BOT | 2 | Todo | Fetches welcomeMessage + pointsLabel from `business_translation`; falls back to `defaultLocale`. |
| B-19 | Bot: handle customer QR scan event — send "Enter amount" message to group | BE | 5 | Todo | Triggered by `GET /scan/:cardId/:scanToken`; fetches customer name + balance |
| B-20 | Bot: handle cashier amount reply — calculate pts, send confirm/cancel inline keyboard | BE | 5 | Todo | `pts = floor(amountAmd / earnRateValue)`; validates sender is registered cashier |
| B-21 | Bot: handle "Approve" callback — calls `POST /transactions/earn` internally | BE | 3 | Todo | Edits original message to success state |
| B-22 | Bot: handle 6-digit code input — calls `GET /redemptions/validate/:code`, sends confirm/reject keyboard | BE | 5 | Todo | Detects 6-digit numeric message as redemption code |
| B-23 | Bot: handle "Confirm Redemption" callback — calls `PATCH /redemptions/:code/confirm` | BE | 3 | Todo | Edits message to confirmed state |
| B-24 | Bot: `/balance` command — look up customer by phone/name | BE | 2 | Todo | Cashier: `/balance +37491234567` |
| B-25 | Bot: `/history` command — show last 10 transactions in this business | BE | 2 | Todo | US-11: cashier recent log |
| B-26 | Scan token generation — create short-lived HMAC token embedded in customer QR URL | BE | 3 | Todo | 5-min expiry, single-use; stored in Redis or DB |
| F-21 | Customer QR display — render QR code image on Home screen loyalty card | FE | 3 | Todo | QR encodes the scan URL with cardId + fresh scanToken; refresh token on each app open |

**Epic 7 Total: FE 3 SP | BOT/BE 38 SP | Total 41 SP**

---

## Epic 8 — Business Owner Admin Panel

> Web panel (Next.js frontend) for the owner to manage rewards, earn rate, view analytics, manage cashiers.
> **⚠️ No screen design yet — wireframes required before starting FE tickets.**

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| B-27 | `POST/PATCH/DELETE /api/v1/rewards` — owner CRUD | BE | 3 | Todo | Owner role only; soft-delete on DELETE |
| B-27b | `PATCH /api/v1/businesses/me/bot-settings` — save token, auto-register webhook | BE | 5 | Todo | Validates token via Telegram `getMe`; generates webhookSecret; calls `setWebhook`; registers in BotRegistry; sets `isActive: true` |
| B-27c | `GET/PATCH /api/v1/businesses/me/languages` — manage supportedLocales + defaultLocale | BE | 2 | Todo | `defaultLocale` must be in `supportedLocales` |
| B-27d | `GET/PUT /api/v1/businesses/me/translations` — upsert BusinessTranslation rows | BE | 3 | Todo | Fields: name, welcomeMessage, pointsLabel |
| B-27e | `GET/PUT /api/v1/rewards/:id/translations` — upsert RewardTranslation rows | BE | 2 | Todo | Fields: name, description |
| B-28 | `PATCH /api/v1/businesses/me/settings` — earn rate config | BE | 2 | Todo | `earnRateMode: 'per_amd_spent'`, `earnRateValue: 100` |
| B-29 | `GET /api/v1/analytics/dashboard` — total customers, txns today, total pts issued | BE | 5 | Todo | Aggregated queries with short cache TTL |
| B-30 | `GET /api/v1/analytics/top-customers` — paginated, sorted by totalPointsEarned DESC | BE | 2 | Todo | Returns rank, name, phone, totals |
| B-31 | `POST/PATCH /api/v1/users` — owner creates/deactivates cashier accounts | BE | 3 | Todo | Cashier includes telegramUserId for bot auth; sends invite email |
| F-22 | Owner: reward management UI — list, create, edit, toggle active, soft delete | FE | 8 | Todo | Image upload via `/api/v1/files/upload`; inline active toggle; reward translation fields inline in create/edit form |
| F-23 | Owner: earn rate settings UI — mode selector + value input | FE | 2 | Todo | Two modes: fixed per visit / per AMD spent |
| F-24 | Owner: dashboard metrics page — 3 KPI cards | FE | 5 | Todo | KPIs: total customers, transactions today, pts issued all-time |
| F-25 | Owner: top customers list — ranked table | FE | 3 | Todo | Paginated, 20/page |
| F-26 | Owner: cashier management UI — list, create, deactivate | FE | 5 | Todo | Shows name, telegram handle, status; create form: name + email + telegramUserId |
| F-28 | Owner: Bot Settings UI — token input, bot username, group chat ID, webhook status indicator | FE | 5 | Todo | Shows "Webhook active ✅" or "Not configured ⚠️"; save triggers `PATCH /businesses/me/bot-settings` |
| F-29 | Owner: Language Management UI — add/remove supported locales, set default | FE | 3 | Todo | Chip list of active locales; locale picker to add new ones; default locale selector |
| F-30 | Owner: Translation Editor UI — per locale, per field, with missing-translation highlight | FE | 8 | Todo | Tab per locale; fields: business name, welcome message, points label; missing translations shown in red |

**Epic 8 Total: FE 39 SP | BE 27 SP | Total 66 SP**

---

## Epic 9 — Telegram Notifications (Outbound to Customers)

> Business bot sends push notifications to individual customers after key events.
> Depends on: Epic 2 (domain), Epic 7 (bot infrastructure)

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| B-32 | Send welcome message on first LoyaltyCard creation | BOT | 2 | Todo | "Welcome to Beer House Loyalty 🍺 You start with 0 points." |
| B-33 | Send notification after earn transaction confirmed | BOT | 2 | Todo | "+{pts} points at Beer House! Balance: {balance} pts" |
| B-34 | Send notification after redemption confirmed by cashier | BOT | 2 | Todo | "✅ {rewardName} redeemed. Remaining balance: {balance} pts" |
| B-35 | Send notification when redemption code expires (auto-refund) | BOT | 2 | Todo | "⏱ Code expired. {pts} pts returned. Balance: {balance} pts" |
| F-27 | Customer: "Enable notifications" prompt on first Mini App open | FE | 2 | Todo | Prompt user to start a conversation with the business bot to receive notifications |

**Epic 9 Total: FE 2 SP | BOT/BE 8 SP | Total 10 SP**

---

## Epic 10 — Super Admin Panel (Separate React App)

> Standalone React application (no Next.js) for the super admin to create and manage business accounts. Separate project from the customer Mini App.

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| ADMIN-01 | React app scaffold — Vite + React + TypeScript + Tailwind + React Query | ADMIN | 3 | Todo | Separate repo or `admin/` folder in monorepo |
| ADMIN-02 | Super admin login page — email + password | ADMIN | 2 | Todo | Uses `POST /api/v1/auth/email/login` with superadmin role check |
| ADMIN-03 | Businesses list page — table of all businesses with status | ADMIN | 3 | Todo | `GET /api/v1/admin/businesses` |
| ADMIN-04 | Create business form — business name, owner email, owner name only | ADMIN | 3 | Todo | `POST /api/v1/admin/businesses`; bot token/webhook set by owner after first login; backend creates shell Business (isActive: false) + sends invite email |
| ADMIN-05 | Business detail page — view/edit business info, owner details | ADMIN | 3 | Todo | Activate/deactivate business |
| B-36 | `GET/POST /api/v1/admin/businesses` — super admin business management | BE | 5 | Todo | Creates Business + Owner user + sends credentials email + registers bot webhook |

**Epic 10 Total: ADMIN 14 SP | BE 5 SP | Total 19 SP**

---

## Epic 11 — Multi-Tenant Translation Infrastructure

> Foundation layer for all multi-language features. Provides the generic translation lookup service, locale resolution, API middleware, and frontend locale passing. Unblocks Epic 8 translation editor and correct locale-aware API responses.
> **Depends on:** Epic 2 (BusinessTranslation + RewardTranslation modules)

| ID | Title | Layer | SP | Status | Notes |
|----|-------|-------|----|--------|-------|
| B-37 | Translation service — `getTranslation(entityType, entityId, locale, field, fallbackLocale)` | BE | 3 | Todo | Generic helper reused by Business and Reward lookups. Implements locale fallback chain. |
| B-38 | Bot locale resolution — `resolveLocale(customerLang, supportedLocales, defaultLocale)` | BOT | 2 | Todo | Customer lang → in supportedLocales? use it. Not found? use defaultLocale. Used in all bot message sends. |
| B-39 | API locale middleware — reads `Accept-Language` header, attaches resolved locale to request context | BE | 3 | Todo | All controllers use this to return translated name/description inline. No separate translation calls from frontend. |
| F-31 | Frontend locale passing — send `Accept-Language: <user.language>` on all Mini App API requests | FE | 2 | Todo | Set in `api-client.ts` interceptor using `user.language` from auth store. |

**Epic 11 Total: FE 2 SP | BE/BOT 8 SP | Total 10 SP**

---

## Grand Total

| # | Epic | FE | BE/BOT | ADMIN | Total |
|---|------|----|----|-------|-------|
| 1 | Foundation & Setup | 11 | 8 | — | 19 |
| 2 | Core Domain + Translations | 0 | 44 | — | 44 |
| 3 | Home / My Card | 17 | 3 | — | 20 |
| 4 | Rewards Catalog | 12 | 3 | — | 15 |
| 5 | Redemption Flow | 12 | 18 | — | 30 |
| 6 | Transaction History | 9 | 3 | — | 12 |
| 7 | Telegram Bot (Cashier) | 3 | 38 | — | 41 |
| 8 | Owner Admin Panel | 39 | 27 | — | 66 |
| 9 | Notifications | 2 | 8 | — | 10 |
| 10 | Super Admin Panel | — | 5 | 14 | 19 |
| 11 | Translation Infrastructure | 2 | 8 | — | 10 |
| | **Total** | **107** | **165** | **14** | **286** |
