# Epic 4 — Rewards Catalog

Design reference: `docs/design/Rewards Catalog/code.html` and `screen.png`.
F-10 through F-12 can be built with mock data in parallel with B-11.

---

## F-10 — PointsBalanceHero Component ✅

**SP:** 2 | **Layer:** FE | **Status:** Done
**Depends on:** F-01
**Blocks:** F-13

### Description
Hero section at the top of the Rewards Catalog page. Shows the customer's current spendable points balance against a premium blue gradient, with a decorative icon and blur effect.

### Files to create
- `frontend/src/features/rewards/components/points-balance-hero.tsx`
- `frontend/src/features/rewards/components/points-balance-hero.stories.tsx`

### Implementation notes

**Props:**
```tsx
interface PointsBalanceHeroProps {
  points: number;
}
```

**Layout (from design `Rewards Catalog/code.html` lines 116–129):**
```tsx
<section className="mb-10 relative overflow-hidden rounded-xl premium-gradient p-8 text-white shadow-lg">
  <div className="relative z-10 flex flex-col gap-1">
    <span className="font-label text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
      {t('availableBalance')}
    </span>
    <div className="flex items-baseline gap-2">
      <span className="font-headline text-5xl font-extrabold tracking-tight">
        {points.toLocaleString()}
      </span>
      <span className="font-body text-lg opacity-90">PTS</span>
    </div>
  </div>
  {/* Decorative blur circle */}
  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
  {/* Decorative icon */}
  <div className="absolute top-4 right-6">
    <span className="material-symbols-outlined text-4xl opacity-20"
          style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
  </div>
</section>
```

The `premium-gradient` class uses the same gradient as `glass-card` but without the `::before` pseudo-element:
```css
.premium-gradient { background: linear-gradient(135deg, #005f9e 0%, #1278c3 100%); }
```
Add to global styles (already present in Rewards Catalog HTML).

**i18n keys** (`rewards` namespace): `availableBalance`, `pts`

### Acceptance criteria
- [ ] Balance formatted with locale separator (920 → "920", 2450 → "2,450")
- [ ] Gradient matches design
- [ ] Decorative blur and icon rendered (opacity 10% on blur, 20% on icon)
- [ ] "Available Balance" label above the number

### Definition of done
- [ ] Storybook story with 0 pts, 500 pts, 2450 pts
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-11 — RewardCard Component ✅

**SP:** 5 | **Layer:** FE | **Status:** Done
**Depends on:** F-01
**Blocks:** F-12

### Description
Individual reward card showing image, name, description, and points cost. Two states: **unlocked** (active Redeem button) and **locked** (greyed out, disabled button with "Need X more pts"). This is the most complex component in the catalog.

### Files to create
- `frontend/src/features/rewards/components/reward-card.tsx`
- `frontend/src/features/rewards/components/reward-card.stories.tsx`

### Implementation notes

**Props:**
```tsx
interface RewardCardProps {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  imageUrl: string | null;
  canRedeem: boolean;
  ptsNeeded: number;         // 0 when canRedeem is true
  onRedeem: (id: string) => void;
  isLoading?: boolean;       // true while POST /redemptions is in flight
}
```

**Unlocked card (from design lines 140–158):**
```tsx
<div className="bg-surface-container-lowest rounded-lg p-5 flex flex-col gap-4 shadow-sm border border-outline-variant/10">
  <div className="flex gap-4">
    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
      <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
    </div>
    <div className="flex flex-col justify-between">
      <h3 className="font-headline text-lg font-bold">{name}</h3>
      <p className="font-body text-sm text-on-surface-variant">{description}</p>
      <div className="font-label text-xs font-bold text-primary flex items-center gap-1">
        <span className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
        {pointsCost.toLocaleString()} PTS
      </div>
    </div>
  </div>
  <button
    onClick={() => onRedeem(id)}
    disabled={isLoading}
    className="w-full py-3 premium-gradient text-white font-headline font-bold rounded-md active:scale-95 transition-transform disabled:opacity-70">
    {isLoading ? t('processing') : t('redeem')}
  </button>
</div>
```

**Locked card (from design lines 182–204):**
```tsx
<div className="bg-surface-container-low rounded-lg p-5 flex flex-col gap-4 opacity-75 grayscale-[0.5]">
  {/* Image with lock overlay */}
  <div className="w-20 h-20 rounded-lg overflow-hidden relative">
    <img ... className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
      <span className="material-symbols-outlined text-white">lock</span>
    </div>
  </div>
  {/* Disabled button */}
  <button disabled className="w-full py-3 bg-surface-container-highest text-on-surface-variant font-headline font-bold rounded-md cursor-not-allowed">
    {t('needMorePts', { count: ptsNeeded })}
  </button>
</div>
```

**i18n keys** (`rewards` namespace):
- `redeem`, `processing`, `pts`, `needMorePts` (with `count` interpolation: "Need {count} more pts")

### Acceptance criteria
- [ ] Unlocked: active gradient button with "Redeem" text
- [ ] Locked: `grayscale-[0.5] opacity-75`, lock overlay on image, disabled button
- [ ] `isLoading` state disables button and changes text to "Processing..."
- [ ] `onRedeem` fires with correct `id` when unlocked button clicked
- [ ] Locked button is visually and functionally disabled (no click event)
- [ ] Points cost formatted with comma separator

### Definition of done
- [ ] Storybook stories: unlocked, locked, loading state
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-12 — RewardsList Component ✅

**SP:** 3 | **Layer:** FE | **Status:** Done
**Depends on:** F-11
**Blocks:** F-13

### Description
Renders the full catalog of reward cards. Sorts by ascending points cost with redeemable rewards first. Handles empty state.

### Files to create
- `frontend/src/features/rewards/components/rewards-list.tsx`

### Implementation notes

**Props:**
```tsx
interface RewardsListProps {
  rewards: Array<{
    id: string;
    name: string;
    description: string;
    pointsCost: number;
    imageUrl: string | null;
    canRedeem: boolean;
    ptsNeeded: number;
  }>;
  onRedeem: (rewardId: string) => void;
  redeemingId: string | null;   // which reward's Redeem button is loading
}
```

**Sorting logic (in component):**
```ts
const sorted = [...rewards].sort((a, b) => {
  // Redeemable first, then by cost ascending
  if (a.canRedeem !== b.canRedeem) return a.canRedeem ? -1 : 1;
  return a.pointsCost - b.pointsCost;
});
```

**Grid layout (from design line 138):**
```tsx
<div className="grid grid-cols-1 gap-6">
  {sorted.map(r => (
    <RewardCard key={r.id} {...r}
      isLoading={redeemingId === r.id}
      onRedeem={onRedeem} />
  ))}
</div>
```

**Empty state:**
```tsx
{rewards.length === 0 && (
  <div className="text-center py-16 text-on-surface-variant">
    <span className="material-symbols-outlined text-4xl opacity-40">redeem</span>
    <p className="mt-4 font-body">{t('noRewardsYet')}</p>
  </div>
)}
```

**i18n keys:** `noRewardsYet`

### Acceptance criteria
- [ ] Redeemable rewards appear before locked ones
- [ ] Within each group, sorted by `pointsCost` ascending
- [ ] Only one reward card shows loading state at a time (`redeemingId`)
- [ ] Empty state renders when rewards array is empty
- [ ] No dividers between cards (gap spacing only, per design system "No-Line" rule)

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## B-11 — GET /api/v1/rewards (Customer Catalog) ✅

**SP:** 3 | **Layer:** BE | **Status:** Done (already implemented as getCatalog in rewards.controller.ts)
**Depends on:** B-05, B-04
**Blocks:** F-13

### Description
Returns all active rewards for the business with per-customer eligibility computed. The customer's current balance is used to determine `canRedeem` and `ptsNeeded` for each reward.

### Files to modify
- `backend/src/rewards/rewards.controller.ts` — add `GET /rewards` customer route
- `backend/src/rewards/rewards.service.ts` — add `findWithEligibility()` method
- `backend/src/rewards/dto/reward-response.dto.ts` — response DTO with eligibility fields

### Implementation notes

**Response DTO:**
```ts
class RewardResponseDto {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  imageUrl: string | null;
  isActive: boolean;
  canRedeem: boolean;     // computed
  ptsNeeded: number;      // computed: max(0, pointsCost - card.points)
}
```

**Service method:**
```ts
async findWithEligibility(businessId: string, customerId: string) {
  const [rewards, card] = await Promise.all([
    this.rewardsRepository.findActiveByBusinessId(businessId),
    this.loyaltyCardsRepository.findByCustomerAndBusiness(customerId, businessId),
  ]);
  const balance = card?.points ?? 0;
  return rewards.map(r => ({
    ...r,
    canRedeem: balance >= r.pointsCost,
    ptsNeeded: Math.max(0, r.pointsCost - balance),
  }));
}
```

**Controller:**
```ts
@Get()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.customer)
@HttpCode(HttpStatus.OK)
findAll(@Request() req) {
  return this.rewardsService.findWithEligibility(req.user.businessId, req.user.sub);
}
```

### Acceptance criteria
- [ ] Only `isActive: true` rewards returned
- [ ] `canRedeem: true` when `card.points >= reward.pointsCost`
- [ ] `ptsNeeded: 0` when `canRedeem: true`
- [ ] Sorted by `pointsCost` ascending (DB level: `ORDER BY points_cost ASC`)
- [ ] Returns empty array (not 404) when no rewards exist
- [ ] Non-customer role returns 403

### Definition of done
- [ ] Unit test: customer with enough pts, customer without enough pts, no rewards
- [ ] `npm run lint` passes

---

## F-13 — Wire Rewards Catalog Page to API ✅

**SP:** 2 | **Layer:** FE | **Status:** Done
**Depends on:** F-10, F-11, F-12, B-11, F-04
**Blocks:** nothing (final step for this epic)

### Description
Compose the Rewards Catalog page with real API data. Implement the `useRewards` hook, skeleton loading, and wire the Redeem button to navigate to the Redemption screen (implemented in Epic 5).

### Files to create/modify
- `frontend/src/features/rewards/api/get-rewards.ts` — query hook
- `frontend/src/app/(app)/rewards/page.tsx` — page composition

### Implementation notes

**API hook:**
```ts
// src/features/rewards/api/get-rewards.ts
export const getRewardsQueryOptions = () =>
  queryOptions({
    queryKey: ['rewards'],
    queryFn: () => api.get<{ data: Reward[] }>('/rewards'),
    select: (res) => res.data,
  });

export const useRewards = () => useQuery(getRewardsQueryOptions());
```

**Page:**
```tsx
// src/app/(app)/rewards/page.tsx
'use client';
export default function RewardsPage() {
  const { data: rewards, isLoading } = useRewards();
  const { data: card } = useLoyaltyCard();
  const router = useRouter();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    try {
      const redemption = await api.post('/redemptions', { rewardId });
      router.push(`/redemption/${redemption.id}`);
    } catch (e) {
      // show error toast
    } finally {
      setRedeemingId(null);
    }
  };

  if (isLoading) return <RewardsSkeleton />;
  return (
    <>
      <TopAppBar variant="catalog" />
      <main className="max-w-md mx-auto px-6 pt-24 pb-32">
        <PointsBalanceHero points={card?.points ?? 0} />
        <RewardsListHeader />
        <RewardsList rewards={rewards ?? []} onRedeem={handleRedeem} redeemingId={redeemingId} />
      </main>
      <BottomNavBar />
    </>
  );
}
```

**Skeleton:** Two `RewardCard`-shaped pulse blocks.

**"Rewards Catalog" header** (from design line 131):
```tsx
<div className="flex items-center justify-between mb-6">
  <h2 className="font-headline text-2xl font-bold">{t('rewardsCatalog')}</h2>
  <span className="material-symbols-outlined text-primary">filter_list</span>
</div>
```
Filter icon is static for MVP.

**i18n keys:** `rewardsCatalog`

### Acceptance criteria
- [ ] Page loads with real rewards from API
- [ ] Balance in hero reflects real card balance
- [ ] Loading skeleton shown during fetch
- [ ] Redeem button triggers POST `/redemptions` and navigates to redemption screen
- [ ] API error shows friendly error state
- [ ] Bottom navigation shows "Rewards" tab as active

### Definition of done
- [ ] `yarn build` passes
- [ ] `yarn check-types` passes
