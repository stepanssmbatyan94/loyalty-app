# Design Reference — How to Use the Screen Prototypes

Every customer-facing screen has a fully built HTML prototype in `../../docs/design/`. These are the single source of truth for layout, spacing, colors, and component structure. Always read them before writing any UI code.

---

## Design folder → feature mapping

| Design folder | Screens / components inside |
|---|---|
| `docs/design/Home:My Card/` | `LoyaltyCardHero`, `ProgressToReward`, `BentoHighlights`, `RecentActivity`, Home page (`src/app/(app)/page.tsx`) |
| `docs/design/Rewards Catalog/` | `PointsBalanceHero`, `RewardCard`, `RewardsList`, Rewards page (`src/app/(app)/rewards/page.tsx`) |
| `docs/design/Redemption/` | `RedemptionScreen`, `CountdownTimer`, Redemption page (`src/app/(app)/redemption/[id]/page.tsx`) |
| `docs/design/Transaction History/` | `TransactionItem`, `TransactionFilterChips`, History page (`src/app/(app)/history/page.tsx`) |

---

## Step-by-step workflow for each component

### Step 1 — View `screen.png`
Open the PNG to understand the full-page layout before reading any code. Note:
- Overall visual hierarchy
- Which elements are prominent vs secondary
- Color usage (primary blue, green for earn, red for redeem)

### Step 2 — Read `DESIGN.md`
Read the design intent document to understand:
- Component purpose and UX rationale
- Interaction states (hover, active, disabled, loading)
- Any notes about accessibility or motion

### Step 3 — Read `code.html`
This is the most important file. It contains the complete working prototype with:
- **Exact Tailwind class names** — use these, not raw hex values
- **Layout structure** — flex/grid hierarchy, padding, gap values
- **Conditional classes** — how locked vs unlocked states differ, earn vs redeem colors
- **Material Symbols icon names** — exact icon strings like `sports_bar`, `redeem`, `stars`
- **Design token names** — `text-primary`, `bg-tertiary-container`, `text-error`, etc.

Find the relevant section using line references from the ticket (e.g. "from design lines 125–138").

---

## Translation rules: HTML → React

| HTML pattern | React equivalent |
|---|---|
| `class="..."` | `className="..."` |
| Hardcoded text (`Beer House`, `2,450 pts`) | `{t('key')}` or `{value.toLocaleString()}` |
| `style="font-variation-settings: 'FILL' 1"` | `style={{ fontVariationSettings: "'FILL' 1" }}` |
| Conditional classes via JS ternary | `cn('base', condition && 'extra')` using `@/utils/cn` |
| Static `<img src="...">` placeholders | Accept `imageUrl: string \| null` prop; render conditionally |
| Hardcoded color hex (`#005f9e`) | Use design token class (`bg-primary`, `text-primary`) |
| `onclick="..."` inline JS | Event handler prop (`onClick`, `onChange`) |

---

## Design token quick reference

These token names appear in `code.html` and are defined in `tailwind.config.ts`:

| Token | Usage |
|---|---|
| `primary` | Blue — point balance, active buttons, primary actions |
| `tertiary-container` | Green — earn transactions, progress bar fill |
| `error` | Red — redeem transactions, locked state, expired timer |
| `on-background` | Main text color |
| `on-surface-variant` | Secondary/muted text |
| `surface-container-lowest` | Card backgrounds (white-ish) |
| `surface-container-low` | Slightly elevated surface |
| `surface-container-high` | Chip backgrounds, inactive states |
| `outline-variant` | Subtle borders |
| `glass-card` | CSS class — premium gradient card with light sheen effect |
| `premium-gradient` | CSS class — solid blue gradient for buttons/heroes |

**Font families** (from design):
- `font-headline` — bold display text (points, card titles)
- `font-body` — readable paragraph text
- `font-label` — UI labels, chips, tags (small, semibold)

---

## Common mistakes to avoid

| Mistake | Correct approach |
|---|---|
| Using raw `bg-[#1278c3]` instead of `bg-primary` | Always use the token name — it's in `tailwind.config.ts` |
| Copying the full HTML structure into one component | Split into focused sub-components per the ticket spec |
| Ignoring hover/disabled states from the HTML | The HTML prototype includes all interactive states — implement them |
| Hardcoding `"Beer House"` or any business name | Always use i18n or accept as prop |
| Using `<img>` without fallback | Handle `imageUrl: null` with a placeholder div |
