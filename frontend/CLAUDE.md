# loyalty-app frontend

Next.js 14 (App Router) + TypeScript + React Query + Redux Toolkit. Telegram Mini App for a loyalty points system — Customers, Cashiers, Business Owners.

> This is the Beer House Loyalty App. The customer interface is a Telegram Mini App. The business owner admin panel lives under the `(owner)` route group in the same Next.js app. See `../docs/overview.md` for the full system picture.

## Commands

```bash
yarn dev                 # Next.js dev server on :3000
yarn build               # production build
yarn check-types         # TypeScript type-check (no emit)
yarn lint                # ESLint
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

---

## Loyalty App — Planning Docs

**Read these before implementing any feature, hook, or component that touches real data.**

### API contract
`../docs/planning/api-contract.md` — Every REST endpoint with exact request/response JSON shapes. Check this before writing any API hook (`useQuery` / `useMutation`). Do not invent field names — use exactly what the contract specifies.

### Auth flows
`../docs/planning/auth-flow.md` — How the Telegram Mini App authenticates (`POST /auth/telegram`), how the owner panel logs in (`POST /auth/email/login`), JWT payload fields per role. The customer JWT includes `cardId` and `businessId` — these are never sent in request bodies.

### Telegram bot flows
`../docs/planning/telegram-bot-flows.md` — Context for understanding what happens after a customer shows their QR code. The Mini App triggers the scan; everything after that is handled by the bot. Useful when working on the QR display component or redemption screen.

### Epics & tickets
`../docs/planning/epics.md` — All ticket IDs (F-01 through F-27), story points, dependencies, and status. Check this to understand what a ticket depends on and what it blocks before starting.

### User stories
`../docs/planning/user-stories.md` — The 17 user stories with acceptance criteria. Use these to verify that a component or page satisfies the right conditions before marking it done.

### Screen designs
`../docs/design/` — Four HTML prototype files (one per screen). These are the definitive visual reference. When a ticket references "from design line N", read the HTML file directly.

| Folder | Screen |
|---|---|
| `Home:My Card/code.html` | Home screen — loyalty card hero, progress bar, bento tiles |
| `Rewards Catalog/code.html` | Rewards catalog — balance hero, locked/unlocked reward cards |
| `Redemption/code.html` | Redemption — QR code, 6-digit code, countdown timer |
| `Transaction History/code.html` | Transaction history — earn/redeem items, filter chips |

## Global rules — apply everywhere, no exceptions

**1. Always read the design files before implementing any UI.**
Every customer-facing screen has a prototype in `../docs/design/`. Before writing a single component or page, read all three files for the relevant screen:

| Screen | Design folder |
|---|---|
| Home / My Card | `../docs/design/Home:My Card/` |
| Rewards Catalog | `../docs/design/Rewards Catalog/` |
| Redemption | `../docs/design/Redemption/` |
| Transaction History | `../docs/design/Transaction History/` |

For each screen, read in this order:
1. **`screen.png`** — view the visual target first to understand the overall layout
2. **`DESIGN.md`** — read the design intent, component descriptions, and UX notes
3. **`code.html`** — extract Tailwind classes, layout structure, colors, and spacing from the HTML prototype

Then translate the HTML prototype into React components following the project's feature-based structure (`src/features/{feature}/components/`), the Tailwind design token names (not raw hex values), and the component patterns in `.claude/rules/feature-layer.md`. Do not copy the HTML verbatim — adapt it to TypeScript, i18n, and the project's component conventions.

**2. All user-visible text must go through i18n.**
Never hardcode strings in components. Every label, button text, error message, placeholder, and heading must use `next-intl`:
- Server component: `const t = await getTranslations('namespace');`
- Client component: `const t = useTranslations('namespace');`
- Add new keys to **both** `messages/en.json` and `messages/ru.json`.

**3. One component per file. Keep components small.**
Each `.tsx` file exports exactly one component. If a component grows large enough that you can identify a distinct piece of UI, extract it into its own file. A good sign a component is too large: it needs internal `function renderXxx()` helpers, or it renders more than one distinct "section" of UI.

## Scoped rules (auto-loaded by layer)

More focused rules are loaded automatically based on which files you edit:

| What you're editing | Rule file loaded |
|---|---|
| `src/features/**` | `.claude/rules/feature-layer.md` + `.claude/rules/design-reference.md` |
| `src/app/**` | `.claude/rules/app-layer.md` + `.claude/rules/design-reference.md` |
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
