# Beer House Loyalty App — Planning Index

Beer House is a Telegram Mini App-based digital loyalty card system for a premium hospitality business. Customers earn points after purchases by scanning a QR code at the cashier, and redeem them for rewards — all without downloading an app. The system has four roles: **Customer** (Telegram Mini App), **Cashier** (Telegram Bot in staff group), **Business Owner** (web admin panel), and **Super Admin** (separate React panel for managing businesses).

---

## Documents

| File | Contents |
|---|---|
| [README.md](./README.md) | This file — index, SP totals, sprint order, decisions log |
| [user-stories.md](./user-stories.md) | All 17 PRD user stories with acceptance criteria, epic mapping, MVP flag |
| [epics.md](./epics.md) | All 10 epics, 60 tickets, story points, FE/BE split, status column |
| [api-contract.md](./api-contract.md) | Full API spec — endpoints, request/response shapes, error codes |
| [auth-flow.md](./auth-flow.md) | Auth flows per role, JWT payloads, RBAC permission matrix |
| [telegram-bot-flows.md](./telegram-bot-flows.md) | Cashier bot interaction diagrams — earn flow, redemption flow, notifications |
| [../draf_prd.md](../draf_prd.md) | Original Product Requirements Document (v1.0 Draft) |

---

## Key Decisions Made

| Topic | Decision |
|---|---|
| Earn rate | 1 pt per 100 AMD spent; configurable by owner |
| Cashier tool | Telegram Bot per business (not a web app) |
| Cashier earn flow | Customer scans QR → bot notifies group → cashier enters AMD amount → cashier taps Approve |
| Redemption validation | Cashier types 6-digit code in Telegram group (or scans QR) → bot shows Confirm button |
| Expired redemption | Auto-refund points; customer sees "Points returned" on screen |
| Customer registration | Auto from Telegram contact share (one tap — no manual form) |
| Owner auth | Email + password on web admin panel |
| Cashier auth | Telegram identity (no separate login; validated by group membership + registered telegramUserId) |
| Super Admin panel | Separate React app (Vite, not Next.js) |
| Bot architecture | One bot per business (separate BOT_TOKEN per business) |
| Invite Friends card | Static placeholder on Home screen ("Coming Soon") — referral is out of MVP |
| Redemption code expiry | 5 minutes (confirmed by design) |
| JWT payload | `userId + role + businessId + cardId` |
| API base URL | `/api/v1/...` |

---

## Story Point Summary

| # | Epic | FE | BE/BOT | Admin | Total | Status |
|---|------|----|----|-------|-------|--------|
| 1 | Foundation & Project Setup | 11 | 8 | — | 19 | — |
| 2 | Core Domain (Backend) | 0 | 36 | — | 36 | — |
| 3 | Home / My Card | 17 | 3 | — | 20 | — |
| 4 | Rewards Catalog | 12 | 3 | — | 15 | — |
| 5 | Redemption Flow | 12 | 18 | — | 30 | — |
| 6 | Transaction History | 9 | 3 | — | 12 | — |
| 7 | Telegram Bot (Cashier Tool) | 3 | 33 | — | 36 | — |
| 8 | Business Owner Admin Panel | 23 | 15 | — | 38 | — |
| 9 | Telegram Notifications | 2 | 8 | — | 10 | — |
| 10 | Super Admin Panel | — | 5 | 16 | 21 | — |
| | **Total** | **89** | **132** | **16** | **237** | |

---

## Recommended Sprint Order

### Sprint 1 — Foundation + Core Domain (55 SP)
**Epics 1 + 2.** Pure setup and domain modelling. No FE/BE sync needed.
- FE: Tailwind tokens, TopAppBar, BottomNavBar, Telegram initData auth
- BE: Auth endpoints, all 5 domain modules, DB migrations, seeds

### Sprint 2–3 — Customer Screens (77 SP)
**Epics 3, 4, 5, 6.** All four screens are fully designed. FE and BE can run in parallel.
- FE starts with components (no API dependency)
- BE delivers endpoints; FE wires up after
- Epic 9 (Notifications) can be shipped alongside Epic 5 (Redemption)

### Sprint 4 — Telegram Bot Cashier Tool (36 SP)
**Epic 7.** Bot-heavy backend work + customer QR display on FE.
- Requires: Epic 2 (domain) + Epic 1 (auth) complete

### Sprint 5 — Owner Admin Panel (38 SP)
**Epic 8.** Blocked on wireframe/screen design for cashier and admin pages.
- ⚠️ Do not start FE tickets until designs exist

### Sprint 6 — Super Admin Panel (21 SP)
**Epic 10.** Separate React app. Can be built in parallel with Sprint 5 if resources allow.

---

## Open Questions (Resolved)

| # | Question | Resolution |
|---|----------|------------|
| 1 | Earn rate for pilot | 1 pt per 100 AMD spent; owner configurable |
| 2 | Cashier access method | Telegram Bot per business |
| 3 | Redemption code expiry | 5 minutes (confirmed by design) |
| 4 | Customer loses Telegram account | Not addressed in MVP; manual restore by owner |
| 5 | GDPR / privacy policy | Not in MVP scope |
| 6 | Broadcast messaging | Out of MVP; planned for v1.1 |

## Open Questions (Still Open)

| # | Question | Owner |
|---|----------|-------|
| 1 | Should the customer QR refresh on every app open, or only daily? | Engineering |
| 2 | What email service is used to send owner/cashier credentials? (SendGrid, SES, etc.) | DevOps |
| 3 | Where is the admin web panel hosted? Same domain as API or separate? | DevOps |
