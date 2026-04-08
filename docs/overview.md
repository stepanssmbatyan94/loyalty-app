# Beer House Loyalty App — Project Overview

> A Telegram Mini App-based digital loyalty card system for hospitality businesses. Replaces paper stamp cards with a lightweight experience that lives entirely inside Telegram — no download required.

---

## What It Is

Beer House Loyalty App is a multi-tenant loyalty points platform built around **Telegram** as the delivery channel. Customers earn points after each purchase and redeem them for rewards, all without leaving Telegram. Cashiers manage the earn/redeem workflow through a dedicated **Telegram Bot** in the staff group. Business owners manage rewards and view analytics via a **web admin panel**.

The pilot business is **Beer House**, a premium bar/restaurant in Armenia. The MVP targets 50 registered customers and 200 transactions in the first 30 days.

---

## The Problem It Solves

| Pain point | Solution |
|---|---|
| Paper stamp cards lost or forgotten | Digital card always in Telegram |
| No customer data from visits | Every scan ties a purchase to a named Telegram account |
| Cashiers need a separate device/app | Cashier workflow runs in the existing staff Telegram group |
| Owner has no visibility into loyalty program performance | Analytics dashboard with real-time KPIs |
| Customers unaware of their balance between visits | Instant Telegram notification after every earn/redeem |

---

## User Roles

The system has **four roles**, each with a dedicated interface:

| Role | Interface | Primary Responsibility |
|---|---|---|
| **Customer** | Telegram Mini App | View loyalty card & balance, browse rewards, redeem |
| **Cashier** | Telegram Bot (staff group) | Add points after purchases, validate redemption codes |
| **Business Owner** | Web admin panel (Next.js) | Manage rewards, configure earn rate, view analytics, manage cashiers |
| **Super Admin** | Separate React app (Vite) | Provision new businesses, manage bot configuration |

---

## Core User Flows

### 1. First-Time Customer Registration
```
Customer scans QR code at venue
  → Telegram opens Mini App
  → App requests contact (one tap — name + phone)
  → Backend creates LoyaltyCard with 0 points
  → Customer sees their card + welcome message
  → Bot sends "Welcome to Beer House Loyalty 🍺"
```

### 2. Earning Points (Returning Customer)
```
Customer pays for purchase
  → Customer opens Mini App → taps their QR code
  → Backend sends scan event to business's Telegram group
  → Cashier sees: "Aram Petrosyan — 920 pts. Enter amount (AMD):"
  → Cashier types: 3500
  → Bot shows: "+35 pts — Approve / Cancel"
  → Cashier taps Approve
  → Points added to card
  → Customer receives DM: "+35 points at Beer House! Balance: 955 pts"
```

### 3. Redeeming a Reward
```
Customer opens Mini App → Rewards tab
  → Taps "Redeem" on an unlocked reward
  → App shows QR code + 6-digit code + 5-minute countdown
  → Cashier types the 6-digit code in Telegram group
  → Bot shows: "Free Coffee — Aram Petrosyan — Confirm / Reject"
  → Cashier taps Confirm
  → Points deducted from card
  → Customer receives DM: "✅ Free Coffee redeemed. Balance: 820 pts"
  → Customer taps "Done" → returns to Home screen
```

### 4. Code Expiry (Auto-Refund)
```
Customer generates redemption code but cashier doesn't confirm within 5 minutes
  → Cron job (runs every 30s) detects expired pending redemptions
  → Points automatically refunded to card
  → Customer receives DM: "⏱ Code expired. 135 pts returned."
  → Mini App shows "Expired" state + "Points returned to your balance"
```

---

## System Architecture

The platform consists of **four deployable applications** backed by a single NestJS API:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Telegram Platform                        │
│                                                                 │
│  ┌──────────────────────┐     ┌────────────────────────────┐   │
│  │  Customer Mini App   │     │     Business Bot           │   │
│  │  (Next.js 14)        │     │  (grammy, per-business)    │   │
│  │  Port 3000           │     │  Webhook: /telegram/       │   │
│  │                      │     │           webhook/:bizId   │   │
│  │  4 screens:          │     │                            │   │
│  │  • Home / My Card    │     │  Cashier commands:         │   │
│  │  • Rewards Catalog   │     │  • QR scan notification    │   │
│  │  • Redemption        │     │  • Enter AMD amount        │   │
│  │  • Transaction Hist  │     │  • Approve / Cancel earn   │   │
│  └──────────────────────┘     │  • Enter 6-digit code      │   │
│                               │  • Confirm redemption      │   │
│                               │  • /balance, /history      │   │
│                               └────────────────────────────┘   │
└───────────────────┬─────────────────────────┬───────────────────┘
                    │  HTTPS                  │  Webhook
                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   NestJS API  (Port 4000)                       │
│                   REST  /api/v1/...                             │
│                   Hexagonal Architecture (Ports & Adapters)     │
│                                                                 │
│   Domain modules: Business · LoyaltyCard · Reward              │
│                   Transaction · Redemption · User               │
│                                                                 │
│   Auth: Telegram initData HMAC (customers/cashiers)            │
│         JWT email+password (owners/superadmin)                  │
└───────────────────┬─────────────────────────┬───────────────────┘
                    │ TypeORM                  │ Events
                    ▼                         ▼
           ┌─────────────┐          ┌──────────────────┐
           │ PostgreSQL  │          │  EventEmitter2   │
           │             │          │  (notifications) │
           └─────────────┘          └──────────────────┘

┌──────────────────┐    ┌────────────────────────────────────────┐
│ Owner Admin      │    │ Super Admin Panel                      │
│ (Next.js, /owner)│    │ (Vite + React, Port 3001)              │
│ • Manage rewards │    │ • Provision businesses                 │
│ • Earn rate      │    │ • Register bot webhooks                │
│ • Analytics      │    │ • Manage owner accounts                │
│ • Manage cashiers│    └────────────────────────────────────────┘
└──────────────────┘
```

---

## Tech Stack

### Customer Mini App — `frontend/`
| Concern | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (custom design tokens) |
| Server state | TanStack React Query v5 |
| Client state | Zustand (notifications), Redux Toolkit (legacy) |
| Forms | React Hook Form + Zod |
| Telegram | `@twa-dev/sdk` |
| i18n | next-intl (EN + RU required) |
| Components | Radix UI + custom (Storybook) |
| Auth | Telegram `initData` HMAC → JWT |

### Backend API — `backend/`
| Concern | Technology |
|---|---|
| Framework | NestJS 11 |
| Language | TypeScript |
| Architecture | Hexagonal (Ports & Adapters) |
| Database | PostgreSQL + TypeORM |
| Auth | Passport.js — JWT + Telegram initData strategies |
| Telegram Bot | grammy (TypeScript-first) |
| Validation | class-validator + class-transformer |
| Email | Nodemailer (mail module) |
| Scheduling | `@nestjs/schedule` (cron jobs) |
| Events | `@nestjs/event-emitter` (EventEmitter2) |

### Super Admin Panel — `admin/`
| Concern | Technology |
|---|---|
| Framework | Vite + React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS (same design tokens) |
| Server state | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Routing | React Router v6 |

---

## Repository Structure

```
loyalty-app/
├── frontend/              ← Next.js 14 customer Mini App + owner admin panel
│   ├── src/
│   │   ├── app/
│   │   │   ├── (app)/     ← Protected routes (customers)
│   │   │   │   ├── page.tsx           — Home / My Card
│   │   │   │   ├── rewards/page.tsx   — Rewards Catalog
│   │   │   │   ├── history/page.tsx   — Transaction History
│   │   │   │   └── redemption/[id]/   — Redemption Screen
│   │   │   ├── (owner)/   ← Protected routes (business owners)
│   │   │   └── auth/      ← Public auth routes
│   │   ├── features/      ← Feature modules (self-contained)
│   │   │   ├── loyalty-cards/   — Card display, QR, balance
│   │   │   ├── rewards/         — Catalog, redemption, management
│   │   │   ├── point-transactions/ — History, earn/redeem items
│   │   │   ├── businesses/      — Business settings
│   │   │   ├── analytics/       — Dashboard KPIs, top customers
│   │   │   ├── users/           — Cashier management
│   │   │   ├── notifications/   — Enable notifications prompt
│   │   │   └── auth/            — Auth flows
│   │   └── components/    ← Shared UI primitives (no domain knowledge)
│   └── messages/          ← i18n translation files
│       ├── en.json
│       └── ru.json
│
├── backend/               ← NestJS API
│   └── src/
│       ├── auth/          — JWT + Telegram initData strategies
│       ├── businesses/    — Business domain module
│       ├── loyalty-cards/ — LoyaltyCard domain module
│       ├── rewards/       — Reward domain module
│       ├── transactions/  — Transaction domain module
│       ├── redemptions/   — Redemption domain module
│       ├── users/         — User/cashier management
│       ├── telegram/      — Bot webhook handler + notification service
│       ├── analytics/     — Dashboard + top customers endpoints
│       ├── admin/         — Super admin endpoints
│       └── mail/          — Email sending service
│
├── admin/                 ← Vite + React super admin panel
│
└── docs/
    ├── overview.md        ← This file
    ├── draf_prd.md        ← Original Product Requirements Document
    ├── design/            ← Screen designs (HTML + PNG per screen)
    │   ├── Home:My Card/
    │   ├── Rewards Catalog/
    │   ├── Redemption/
    │   └── Transaction History/
    └── planning/          ← Full backlog and architecture docs
        ├── README.md              — SP totals, sprint plan, decisions log
        ├── epics.md               — All 10 epics, 60+ tickets
        ├── user-stories.md        — All 17 PRD user stories
        ├── api-contract.md        — Full API spec
        ├── auth-flow.md           — Auth flows + JWT payloads + RBAC
        ├── telegram-bot-flows.md  — Bot interaction diagrams
        └── tickets/               — Detailed implementation specs per epic
            ├── epic-1-foundation.md
            ├── epic-2-core-domain.md
            ├── epic-3-home-my-card.md
            ├── epic-4-rewards-catalog.md
            ├── epic-5-redemption.md
            ├── epic-6-transaction-history.md
            ├── epic-7-telegram-bot.md
            ├── epic-8-owner-admin.md
            ├── epic-9-notifications.md
            └── epic-10-super-admin.md
```

---

## Domain Model

Five core entities drive all business logic:

```
Business ──────────────────────┐
  │ 1                          │
  │ has many                   │
  ▼ N                          │
LoyaltyCard ◄──── Customer     │ all scoped to businessId
  │ 1                          │
  │ has many                   │
  ▼ N                          │
Transaction                    │
  (earn | redeem)              │
                               │
Reward ────────────────────────┘
  │ 1
  │ referenced by
  ▼ N
Redemption
  (pending → confirmed | expired | cancelled)
```

**Key business rules:**
- A customer can have one LoyaltyCard per business
- `card.points` can never go below 0
- Transactions are **immutable** — no edits or deletes, only reversals
- Redemptions pre-deduct points immediately; auto-refund on 5-min expiry
- Earn rate is configurable per business: `1 pt per N AMD` or `fixed pts per visit`

---

## Authentication Model

| Role | Auth Method | JWT payload |
|---|---|---|
| Customer | Telegram `initData` HMAC | `{ sub, role: 'customer', businessId, cardId, telegramId }` |
| Cashier | Telegram group membership + registered `telegramUserId` | `{ sub, role: 'cashier', businessId }` |
| Business Owner | Email + password | `{ sub, role: 'owner', businessId }` |
| Super Admin | Email + password | `{ sub, role: 'superadmin' }` |

All protected API routes use `AuthGuard('jwt')` + `RolesGuard` + `@Roles(...)` decorator.

Full auth flow diagrams: [`docs/planning/auth-flow.md`](planning/auth-flow.md)

---

## Earn Rate Configuration

Business owners can choose one of two earn modes:

| Mode | How it works | Default |
|---|---|---|
| `per_amd_spent` | `pts = floor(amd / earnRateValue)` | 1 pt per 100 AMD |
| `fixed_per_visit` | `pts = earnRateValue` (flat per scan) | — |

The earn rate is stored on the `Business` entity and applied at transaction creation time.

---

## Design System

All four customer screens have HTML prototype files in `docs/design/`. The design uses a custom Material Design 3-inspired system with these key tokens:

- **Primary**: `#1278c3` (blue — point balance, primary actions)
- **Tertiary container**: green (earn transactions, progress bar)
- **Error**: red (redeem transactions, locked states)
- **Glass card**: gradient `#005f9e → #1278c3` at 135° with `::before` light sheen
- **Typography**: `font-headline` (bold display), `font-body` (readable), `font-label` (UI labels)

Tailwind design tokens are defined in `frontend/tailwind.config.ts` (extracted from design HTML).

---

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
yarn dev           # Dev server on :3000
yarn build         # Production build
yarn check-types   # TypeScript check
yarn storybook     # Component explorer on :6006
```

### Backend (NestJS)
```bash
cd backend
npm run start:dev  # Dev server on :4000 (with watch)
npm run build      # Production build
npm run lint       # ESLint
npm run test       # Unit tests
```

### Super Admin (Vite)
```bash
cd admin
npm run dev        # Dev server on :3001
npm run build      # Production build
npm run typecheck  # TypeScript check
```

---

## Planning Documents

| Document | Purpose |
|---|---|
| [`docs/draf_prd.md`](draf_prd.md) | Original PRD — 17 user stories, goals, success metrics |
| [`docs/planning/epics.md`](planning/epics.md) | Full backlog — 10 epics, 60+ tickets with SPs |
| [`docs/planning/user-stories.md`](planning/user-stories.md) | All user stories with acceptance criteria |
| [`docs/planning/api-contract.md`](planning/api-contract.md) | Complete REST API specification |
| [`docs/planning/auth-flow.md`](planning/auth-flow.md) | Auth flows, JWT payloads, RBAC matrix |
| [`docs/planning/telegram-bot-flows.md`](planning/telegram-bot-flows.md) | Bot interaction sequence diagrams |
| [`docs/planning/tickets/`](planning/tickets/) | Detailed implementation specs per epic |

**Total scope:** 237 story points across 10 epics (89 FE · 132 BE/BOT · 16 Admin)
