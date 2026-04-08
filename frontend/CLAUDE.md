# loyalty-app frontend

Next.js 14 (App Router) + TypeScript + React Query + Redux Toolkit. Telegram Mini App for a loyalty points system — Customers, Cashiers, Business Owners.

## Commands

```bash
yarn dev                 # Next.js dev server on :3000
yarn build               # production build
yarn check-types         # TypeScript type-check (no emit)
yarn lint                # ESLint
yarn storybook           # Storybook on :6006
yarn generate            # plop.js scaffolding — scaffold a new feature
```

## Docs — read relevant sections before writing code

### Architecture & standards
@docs/project-structure.md — feature-based layout, unidirectional import rules
@docs/project-standards.md — ESLint, Prettier, TypeScript, kebab-case file naming, `@/*` imports

### API, state & data
@docs/api-layer.md — single API client, queryOptions + hook pattern
@docs/state-management.md — component / server / form / URL state categories, Context gotchas

### Components & styling
@docs/components-and-styling.md — Radix UI, `cva` variants, Storybook, composition rules

### Quality & reliability
@docs/error-handling.md — API error interceptor, error boundaries, Sentry
@docs/security.md — JWT/cookie auth, XSS prevention, RBAC/PBAC
@docs/performance.md — code splitting, data prefetching, state optimizations

### Domain concepts (loyalty app specific)
@docs/loyalty-domain.md — roles, entities, business rules, UI terminology, i18n namespaces

## Global rules — apply everywhere, no exceptions

**1. All user-visible text must go through i18n.**
Never hardcode strings in components. Every label, button text, error message, placeholder, and heading must use `next-intl`:
- Server component: `const t = await getTranslations('namespace');`
- Client component: `const t = useTranslations('namespace');`
- Add new keys to **both** `messages/en.json` and `messages/ru.json`.

**2. One component per file. Keep components small.**
Each `.tsx` file exports exactly one component. If a component grows large enough that you can identify a distinct piece of UI, extract it into its own file. A good sign a component is too large: it needs internal `function renderXxx()` helpers, or it renders more than one distinct "section" of UI.

## Scoped rules (auto-loaded by layer)

More focused rules are loaded automatically based on which files you edit:

| What you're editing | Rule file loaded |
|---|---|
| `src/features/**` | `.claude/rules/feature-layer.md` |
| `src/app/**` | `.claude/rules/app-layer.md` |
| `src/components/**` | `.claude/rules/components-layer.md` |

## Architectural enforcement

`.claude/hooks/validate_architecture.cjs` intercepts every Write/Edit on TypeScript/TSX files in `src/` and blocks forbidden import patterns before they are written to disk.

Exit code 2 = violation blocked. Fix the import, then retry.

## State management — decision table

| State kind | Tool | Example |
|---|---|---|
| Server data (API responses) | React Query (`useQuery` / `useMutation`) | users, loyalty cards, transactions |
| Complex shared client state + API caching | Redux Toolkit (RTK Query) | gypsum products (legacy) |
| Lightweight ephemeral global state | Zustand `create()` | notifications |
| Local UI state | `useState` / `useReducer` | modal open/closed, accordion |
| Form state | `react-hook-form` + Zod schema | every form, without exception |
| **Never** | `useState` for form fields | — |

## Project skill

`.claude/skills/next-loyalty-app/SKILL.md` — detailed patterns, canonical code examples, and the full forbidden-patterns table for this codebase.
