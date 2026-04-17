# Epic 3.1 — Home / My Card: Gap Fixes

Tracks the remaining gaps found after Epic 3 was delivered. All three gaps are in the frontend. Backend is fully unblocked for each.

---

## F-09b — Wire RecentActivity to Real Transactions API

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** B-06 (Done — `GET /api/v1/transactions` is live)
**Blocks:** nothing

### Description
`LoyaltyCardHome` currently renders `RecentActivity` with a hardcoded `MOCK_TRANSACTIONS` constant. Now that B-06 is done the real endpoint exists. Replace the mock with a React Query hook that fetches the 2 most recent transactions for the authenticated customer's card.

### Files to create/modify
- `frontend/src/features/loyalty-cards/api/get-recent-transactions.ts` — query options + hook
- `frontend/src/features/loyalty-cards/components/loyalty-card-home.tsx` — replace `MOCK_TRANSACTIONS` with hook data

### Implementation notes

**API hook:**
```ts
// src/features/loyalty-cards/api/get-recent-transactions.ts
import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { ActivityTransaction } from '../types';

type RecentTransactionsResponse = { data: ActivityTransaction[] };

export const getRecentTransactions = (): Promise<RecentTransactionsResponse> =>
  api.get('/api/v1/transactions', { params: { limit: 2 } });

export const getRecentTransactionsQueryOptions = () =>
  queryOptions({
    queryKey: ['transactions', 'recent'],
    queryFn: getRecentTransactions,
  });

type UseRecentTransactionsOptions = {
  queryConfig?: QueryConfig<typeof getRecentTransactions>;
};

export const useRecentTransactions = ({ queryConfig }: UseRecentTransactionsOptions = {}) =>
  useQuery({ ...getRecentTransactionsQueryOptions(), ...queryConfig });
```

**Wire-up in `LoyaltyCardHome`:**
```tsx
// Remove MOCK_TRANSACTIONS constant entirely
const { data: txResponse } = useRecentTransactions();
const recentTransactions = txResponse?.data ?? [];

// Pass to RecentActivity:
<RecentActivity transactions={recentTransactions} />
```

**API response shape** (from `api-contract.md`):
```json
{
  "data": [
    { "id": "uuid", "type": "earn", "points": 120, "label": "Beer House", "note": null, "createdAt": "..." }
  ]
}
```
The `ActivityTransaction` type already matches this shape — no changes needed there.

### Acceptance criteria
- [ ] RecentActivity on Home page shows real transaction data from the API
- [ ] Shows at most 2 transactions (newest first)
- [ ] Empty state ("No activity yet") shown for new customers with 0 transactions
- [ ] MOCK_TRANSACTIONS constant is fully removed from `loyalty-card-home.tsx`
- [ ] Loading state: RecentActivity renders empty/skeleton while hook fetches

### Definition of done
- [ ] `yarn check-types` passes
- [ ] `yarn build` passes
- [ ] No `MOCK_TRANSACTIONS` references remain in the codebase

---

## F-05b — Display `memberSince` on LoyaltyCardHero

**SP:** 1 | **Layer:** FE | **Status:** Todo
**Depends on:** F-05 (Done — `LoyaltyCardHero` already receives `memberSince` prop)
**Blocks:** nothing

### Description
`LoyaltyCardHero` accepts a `memberSince: string` prop but discards it (`memberSince: _`). The design shows a small "Member since Oct 2023" label at the bottom of the card. Wire it up.

### Files to modify
- `frontend/src/features/loyalty-cards/components/loyalty-card-hero.tsx`
- `frontend/src/messages/en.json` — add `memberSince` key to `loyaltyCards` namespace
- `frontend/src/messages/ru.json` — same

### Implementation notes

**In `LoyaltyCardHero`**, after the progress section, add:
```tsx
<p className="mt-4 font-label text-[11px] uppercase tracking-widest text-white/60">
  {t('memberSince')} {new Date(memberSince).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
</p>
```

Change the destructuring from `memberSince: _` to `memberSince` so it's used.

**i18n keys:**
```json
// en.json
"memberSince": "Member since"

// ru.json
"memberSince": "Участник с"
```

### Acceptance criteria
- [ ] "Member since [Month Year]" text visible at the bottom of the loyalty card
- [ ] Formatted as "Oct 2023" (short month + year, locale-aware)
- [ ] No hardcoded strings — uses `useTranslations('loyaltyCards')`
- [ ] Both `en.json` and `ru.json` updated

### Definition of done
- [ ] `yarn check-types` passes
- [ ] `memberSince` prop is no longer discarded with `_`

---

## F-09c — Use Server-Computed `progressPercent` and `ptsRemaining`

**SP:** 1 | **Layer:** FE | **Status:** Todo
**Depends on:** B-10 (Done — API returns `progressPercent` and `nextReward.ptsRemaining`)
**Blocks:** nothing

### Description
The `LoyaltyCardData` type includes `progressPercent` and `nextReward.ptsRemaining` from the API, but these are ignored. `ProgressToReward` recomputes them client-side from `currentPoints / nextReward.pointsCost`. Using the server value makes the frontend consistent with backend business logic (e.g. if earn rate changes mid-session).

### Files to modify
- `frontend/src/features/loyalty-cards/components/loyalty-card-home.tsx` — pass `progressPercent` and `ptsRemaining` through
- `frontend/src/features/loyalty-cards/components/loyalty-card-hero.tsx` — accept + forward `progressPercent`
- `frontend/src/features/loyalty-cards/components/progress-to-reward.tsx` — accept pre-computed values instead of recalculating

### Implementation notes

**`LoyaltyCardHome`** — pass full nextReward (including ptsRemaining) and progressPercent:
```tsx
<LoyaltyCardHero
  points={card.points}
  nextReward={card.nextReward}   // now includes ptsRemaining
  progressPercent={card.progressPercent}
  memberSince={card.memberSince}
/>
```

**`LoyaltyCardHero`** — forward `progressPercent` to `ProgressToReward`:
```tsx
interface LoyaltyCardHeroProps {
  points: number;
  nextReward: { name: string; pointsCost: number; ptsRemaining: number } | null;
  progressPercent: number;
  memberSince: string;
}

// In JSX:
<ProgressToReward
  ptsRemaining={nextReward.ptsRemaining}
  progressPercent={progressPercent}
  nextRewardName={nextReward.name}
/>
```

**`ProgressToReward`** — accept pre-computed values instead of deriving from raw points:
```tsx
interface ProgressToRewardProps {
  ptsRemaining: number;
  progressPercent: number;
  nextRewardName: string;
}
// Remove internal calculation of progressPercent and ptsRemaining
```

### Acceptance criteria
- [ ] `ProgressToReward` uses `ptsRemaining` and `progressPercent` from props, not recomputed
- [ ] `LoyaltyCardHero` forwards both values from parent
- [ ] `LoyaltyCardHome` passes full `nextReward` including `ptsRemaining`
- [ ] `yarn check-types` passes — no `any`, no unused variables

### Definition of done
- [ ] `yarn check-types` passes
- [ ] `yarn build` passes
- [ ] No client-side recalculation of progress values in `ProgressToReward`
