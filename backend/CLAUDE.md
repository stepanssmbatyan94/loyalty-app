# loyalty-app backend

NestJS 11 + TypeScript backend. PostgreSQL (TypeORM) + MongoDB (Mongoose) via Hexagonal Architecture (Ports & Adapters).

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
@docs/database.md — TypeORM migrations, seeding, Mongoose schemas, indexes, performance

### Auth & security
@docs/auth.md — JWT flow, token refresh, multi-device sessions, social providers (Apple/Facebook/Google)

### Serialization
@docs/serialization.md — `@Exclude`, `@Expose`, `@SerializeOptions` groups — required reading when touching domain entities or controllers

### i18n
@docs/translations.md — `nestjs-i18n` usage, adding new languages, `I18nContext.current().t()` pattern

### File uploading
@docs/file-uploading.md — local / S3 / S3-presigned drivers, when to use each

## Scoped rules (auto-loaded by layer)

More focused rules are loaded automatically based on which files you edit:

| What you're editing | Rule file loaded |
|---|---|
| `src/*/domain/**` | `.claude/rules/domain-layer.md` |
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
