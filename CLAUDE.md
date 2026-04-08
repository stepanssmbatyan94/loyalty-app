# loyalty-app

**Beer House Loyalty App** — Telegram Mini App-based digital loyalty card platform for hospitality businesses.

Customers earn and redeem points through Telegram. Cashiers manage transactions via a Telegram Bot in the staff group. Business owners manage the program via a web admin panel. A super admin provisions new businesses via a separate React app.

---

## Repository Structure

```
loyalty-app/
├── frontend/    ← Next.js 14 customer Mini App + owner admin panel
├── backend/     ← NestJS 11 API (PostgreSQL, Hexagonal Architecture)
├── admin/       ← Vite + React super admin panel (separate app)
└── docs/        ← All planning, design, and architecture documentation
```

Each sub-project has its own `CLAUDE.md` with stack-specific rules. **Read the sub-project CLAUDE.md before working in that folder.**

---

## Key Documents

| Document | When to read |
|---|---|
| [`docs/overview.md`](docs/overview.md) | System architecture, user roles, core flows, tech stack |
| [`docs/planning/api-contract.md`](docs/planning/api-contract.md) | Before writing any endpoint or API hook |
| [`docs/planning/auth-flow.md`](docs/planning/auth-flow.md) | Before touching auth, guards, or JWT handling |
| [`docs/planning/telegram-bot-flows.md`](docs/planning/telegram-bot-flows.md) | Before working on bot handlers or QR/scan features |
| [`docs/planning/epics.md`](docs/planning/epics.md) | Ticket IDs, story points, dependencies, full backlog |
| [`docs/planning/user-stories.md`](docs/planning/user-stories.md) | Acceptance criteria for all 17 user stories |
| [`docs/draf_prd.md`](docs/draf_prd.md) | Original PRD — goals, scope, success metrics |
| [`docs/design/`](docs/design/) | HTML prototypes for all 4 designed screens |

---

## Core Concepts (read before writing anything)

### Roles
| Role | Interface | Auth |
|---|---|---|
| Customer | Telegram Mini App | Telegram `initData` HMAC → JWT |
| Cashier | Telegram Bot (staff group) | Telegram identity (no separate login) |
| Business Owner | Web admin panel (`/owner`) | Email + password JWT |
| Super Admin | Separate React app (`admin/`) | Email + password JWT |

### 5 Domain Entities
`Business` → `LoyaltyCard` ← `Transaction` (earn/redeem)
`Business` → `Reward` ← `Redemption` (pending → confirmed/expired/cancelled)

### Critical business rules
- `card.points` **never goes negative** — validate before every deduction
- Transactions are **immutable** — never updated or deleted
- Redemption points are pre-deducted on POST and **auto-refunded** on 5-min expiry
- Earn rate: `pts = floor(amd / earnRateValue)` (default: 1 pt per 100 AMD)
- `business.botToken` is **never exposed** in any API response

---

## Sub-project CLAUDEs

- [`frontend/CLAUDE.md`](frontend/CLAUDE.md) — Next.js rules, i18n requirements, React Query patterns, design token references
- [`backend/CLAUDE.md`](backend/CLAUDE.md) — NestJS Hexagonal Architecture rules, domain layer constraints, service/repo patterns
