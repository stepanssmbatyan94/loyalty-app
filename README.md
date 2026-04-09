# Beer House Loyalty App

A Telegram Mini App-based digital loyalty card platform. Customers earn and redeem points through Telegram. Cashiers manage transactions via a Telegram Bot. Business owners manage the program via a web admin panel.

---

## Repository layout

```
loyalty-app/
├── frontend/   — Next.js 14 (App Router) customer Mini App + owner admin panel
├── backend/    — NestJS 11 API (PostgreSQL, Hexagonal Architecture)
├── admin/      — Vite + React super admin panel (separate app, not started yet)
└── docs/       — All planning, design, and architecture documentation
```

---

## Quick start

### 1. Backend

```bash
cd backend

# Copy env and fill in secrets
cp env-example-relational .env

# Start PostgreSQL + Adminer + MailDev
docker compose up -d postgres adminer maildev

# Install dependencies
npm install

# Run migrations + seed pilot data
npm run migration:run:relational
npm run seed:run:relational

# Start dev server (hot reload) on :3000
npm run start:dev
```

Backend is available at **http://localhost:3000/api**  
Swagger docs at **http://localhost:3000/api/docs**  
Adminer (DB UI) at **http://localhost:8082**

### 2. Frontend

```bash
cd frontend

# Install dependencies
yarn

# Start dev server on :3001 (if backend already occupies :3000)
yarn dev
```

Customer Mini App at **http://localhost:3001**

> In Telegram production the Mini App opens inside the Telegram client. For local dev you can browse it directly in the browser.

---

## Project routes

### Customer Mini App (frontend)

| URL | Screen | Status |
|-----|--------|--------|
| `/` | Home — loyalty card hero, points, bento grid, recent activity | UI scaffold done |
| `/rewards` | Rewards catalog — balance hero, locked/unlocked reward cards | UI scaffold done |
| `/history` | Transaction history — earn/redeem list, filter chips | UI scaffold done |
| `/redemption/[id]` | Redemption — QR code, 6-digit code, countdown timer | Planned (F-14) |

### Owner admin panel (frontend, same Next.js app)

| URL | Screen | Status |
|-----|--------|--------|
| `/owner` | Dashboard metrics | Planned (F-29) |
| `/owner/rewards` | Reward CRUD | Planned (F-27) |
| `/owner/cashiers` | Cashier management | Planned (F-26) |
| `/owner/settings` | Earn rate config | Planned (F-28) |

### Backend REST API

All routes are prefixed `/api/v1/`. Full contract: [`docs/planning/api-contract.md`](docs/planning/api-contract.md)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/telegram` | Customer login via Telegram initData |
| `POST` | `/auth/email/login` | Owner / super admin login |
| `POST` | `/auth/refresh` | Refresh JWT |
| `GET` | `/loyalty-cards/me` | Customer's card + points |
| `GET` | `/rewards` | Rewards catalog with `canRedeem` flag |
| `POST` | `/redemptions` | Start redemption (deducts points) |
| `GET` | `/transactions` | Transaction history (paginated) |
| `GET` | `/analytics/dashboard` | Owner dashboard KPIs |

---

## Key docs

| Document | What's in it |
|----------|--------------|
| [`docs/overview.md`](docs/overview.md) | System architecture, user roles, core flows |
| [`docs/planning/api-contract.md`](docs/planning/api-contract.md) | Every REST endpoint with request/response shapes |
| [`docs/planning/auth-flow.md`](docs/planning/auth-flow.md) | Auth strategies, JWT payload per role |
| [`docs/planning/epics.md`](docs/planning/epics.md) | Full backlog — all epics and ticket IDs |
| [`docs/planning/user-stories.md`](docs/planning/user-stories.md) | 17 user stories with acceptance criteria |
| [`docs/design/`](docs/design/) | HTML prototypes for all 4 customer screens |
| [`docs/draf_prd.md`](docs/draf_prd.md) | Original PRD — goals, scope, success metrics |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Customer app | Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query |
| State | Zustand (global), React Hook Form + Zod (forms) |
| UI system | Material Design 3 tokens, Radix UI, custom `glass-card` component |
| i18n | next-intl — `en` and `ru` supported |
| Backend | NestJS 11, TypeScript, Hexagonal Architecture (Ports & Adapters) |
| Database | PostgreSQL 17 via TypeORM |
| Auth | Telegram initData HMAC (customers) · Email + JWT (owners, admins) |
| Bot | Grammy.js Telegram Bot (cashier earn flow, notifications) |
| Dev infra | Docker Compose, Adminer, MailDev |

---

## User roles

| Role | How they access the app | Auth method |
|------|------------------------|-------------|
| **Customer** | Telegram Mini App | Telegram `initData` HMAC → JWT |
| **Cashier** | Telegram Bot (staff group) | Telegram identity |
| **Business Owner** | Web admin panel (`/owner`) | Email + password JWT |
| **Super Admin** | Separate React app (`admin/`) | Email + password JWT |

---

## Development workflow

### Backend commands

```bash
npm run start:dev              # hot-reload dev server
npm run test                   # unit tests
npm run test:e2e               # E2E tests (requires Docker)
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run:relational
npm run seed:run:relational
npm run generate:resource:relational -- --name Category  # scaffold new module
```

### Frontend commands

```bash
yarn dev          # dev server
yarn build        # production build
yarn check-types  # TypeScript type-check
yarn lint         # ESLint
yarn storybook    # component explorer on :6006
yarn generate     # plop scaffold — new feature
```

---

## Implementation status

| Epic | Description | Status |
|------|-------------|--------|
| **Epic 1** | Foundation & Project Setup | In progress |
| **Epic 2** | Core Domain — Backend | Not started |
| **Epic 3** | Home / My Card | Not started |
| **Epic 4** | Rewards Catalog | Not started |
| **Epic 5** | Redemption Flow | Not started |
| **Epic 6** | Transaction History | Not started |
| **Epic 7** | Telegram Bot | Not started |
| **Epic 8** | Business Owner Admin | Not started |
| **Epic 9** | Notifications | Not started |
| **Epic 10** | Super Admin | Not started |

Detailed ticket breakdown with story points and dependencies: [`docs/planning/tickets/`](docs/planning/tickets/)
