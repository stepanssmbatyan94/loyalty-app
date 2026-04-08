# loyalty-app backend

NestJS 11 + TypeScript backend. **PostgreSQL only** (TypeORM) via Hexagonal Architecture (Ports & Adapters).

> This is the Beer House Loyalty App — a Telegram Mini App loyalty points platform. Customers earn/redeem points via Telegram. Cashiers operate through a Telegram Bot per business. Business owners use a web admin panel. See `docs/overview.md` for the full picture.

## Commands

```bash
npm run start:dev              # hot-reload dev server on :3000
npm run build                  # production build
npm run lint                   # ESLint + Prettier check
npm run test                   # unit test suite
npm run test:e2e               # end-to-end tests (requires Docker)

# Database
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run:relational
npm run seed:run:relational

# Code generation (Hexagonal Architecture scaffolding)
npm run generate:resource:relational -- --name Category
npm run generate:resource:document   -- --name Category
npm run generate:resource:all-db     -- --name Category
```

## Docs — read relevant sections before writing code

### Architecture & conventions
@docs/architecture.md — Hexagonal Architecture, module structure, repository recommendations
@docs/conventions.md — step-by-step checklist for adding features and new modules, naming table, forbidden patterns

### Database
@docs/database.md — TypeORM migrations, seeding, indexes, performance (PostgreSQL only — ignore Mongoose sections)

### Auth & security
@docs/auth.md — JWT flow, token refresh, multi-device sessions

### Serialization
@docs/serialization.md — `@Exclude`, `@Expose`, `@SerializeOptions` groups — required reading when touching domain entities or controllers

### i18n
@docs/translations.md — `nestjs-i18n` usage, adding new languages, `I18nContext.current().t()` pattern

### File uploading
@docs/file-uploading.md — local / S3 / S3-presigned drivers, when to use each

---

## Loyalty App — Planning Docs

**Read these before implementing any endpoint, module, or bot handler.**

### API contract
`../docs/planning/api-contract.md` — Every REST endpoint with exact request/response shapes, error codes, and auth requirements. Always check this before writing a controller or DTO.

### Auth flows & RBAC
`../docs/planning/auth-flow.md` — How each role authenticates, JWT payload per role, full RBAC permission matrix. This project uses **two auth strategies**:
- **Telegram initData HMAC** for customers (`POST /auth/telegram`)
- **Email + password JWT** for owners and super admins (`POST /auth/email/login`)

JWT payload: `{ sub, role, businessId, cardId?, telegramId? }`

### Telegram bot flows
`../docs/planning/telegram-bot-flows.md` — Full cashier earn flow and redemption validation flow with step-by-step message sequences. Required reading before touching anything in `src/telegram/`.

### Epics & tickets
`../docs/planning/epics.md` — All 10 epics, 60+ tickets with story points, layers (FE/BE/BOT), and dependencies. Check this to understand which endpoints are blocked on which and what the expected scope is.

### User stories
`../docs/planning/user-stories.md` — The 17 acceptance-criteria-backed user stories that drive the backend endpoints. Useful for understanding the "why" behind a feature.

### Loyalty domain rules
`.claude/rules/loyalty-domain.md` — Domain entity field specs, business rules (earn rate, redemption expiry, point invariants), module ownership. **Loaded automatically when editing `src/*/domain/**` files.**

## Scoped rules (auto-loaded by layer)

More focused rules are loaded automatically based on which files you edit:

| What you're editing | Rule file loaded |
|---|---|
| `src/*/domain/**` | `.claude/rules/domain-layer.md` + `.claude/rules/loyalty-domain.md` |
| `src/*.service.ts` | `.claude/rules/service-layer.md` |
| `src/*/infrastructure/**` | `.claude/rules/infrastructure-layer.md` |
| `test/**` or `**/*.spec.ts` | `.claude/rules/testing.md` |

## Architectural enforcement

`.claude/hooks/validate_architecture.js` intercepts every Write/Edit on TypeScript files in `src/` and blocks forbidden import patterns before they are written to disk.

Exit code 2 = violation blocked. Fix the import, then retry.

## Settings

Always use `ConfigService` via NestJS dependency injection. Never import config values at the module level or call `config()` outside of a factory function. See `src/config/` for typed config schemas.

## Project skill

`.claude/skills/nestjs-boilerplate/SKILL.md` — detailed patterns, examples, and the full forbidden-patterns table for clean NestJS/TypeScript code in this codebase.
