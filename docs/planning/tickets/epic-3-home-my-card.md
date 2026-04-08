# Epic 3 — Home / My Card

The customer's main screen. Design reference: `docs/design/Home:My Card/code.html` and `screen.png`.
Start FE components (F-05–F-08) in parallel with B-10 — they can be built with mock data first.

---

## F-05 — LoyaltyCardHero Component

**SP:** 5 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-09

### Description
The hero section of the Home screen — a premium gradient blue card that displays the customer's total points balance, "Premium Member" badge, and the progress bar toward the next reward. This is the most visually prominent component in the app.

### Files to create
- `frontend/src/features/loyalty-cards/components/loyalty-card-hero.tsx`
- `frontend/src/features/loyalty-cards/components/loyalty-card-hero.stories.tsx`

### Implementation notes

**Props interface:**
```tsx
interface LoyaltyCardHeroProps {
  points: number;
  nextReward: {
    name: string;
    pointsCost: number;
    ptsRemaining: number;
  } | null;
  progressPercent: number;  // 0–100
  memberSince: string;      // ISO date string
}
```

**Outer container (from design `code.html` line 121):**
```tsx
<div className="glass-card rounded-xl p-8 shadow-2xl shadow-primary/20 flex flex-col items-center justify-center text-on-primary-container relative">
```

**"Premium Member" badge (top-left, line 122):**
```tsx
<div className="absolute top-6 left-8 flex items-center gap-2 opacity-80">
  <span className="material-symbols-outlined text-sm">auto_awesome</span>
  <span className="font-label text-[10px] uppercase tracking-[0.2em] font-bold">
    {t('premiumMember')}
  </span>
</div>
```

**Points display (line 126):**
```tsx
<span className="font-headline font-extrabold text-7xl tracking-tighter">
  {points.toLocaleString()}
</span>
<span className="font-label text-sm uppercase tracking-widest opacity-80 mt-1">
  {t('totalPoints')}
</span>
```

**Progress bar (line 131–139):**
```tsx
<div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
  <div className="h-full bg-tertiary-fixed rounded-full transition-all duration-500"
       style={{ width: `${Math.min(progressPercent, 100)}%` }} />
</div>
```

**Motivational text:**
```tsx
<p>...{ptsRemaining} {t('morePointsFor')} <strong>{nextReward.name}</strong></p>
```

When `nextReward` is null (customer has enough for everything): show "You've unlocked all rewards! 🎉"

**i18n keys** (add to `loyaltyCards` namespace in both `en.json` and `ru.json`):
- `premiumMember`, `totalPoints`, `nextReward`, `morePointsFor`, `allRewardsUnlocked`, `ptsAway`

Mark `'use client'` — uses `useTranslations`.

### Acceptance criteria
- [ ] Gradient background matches design (`#005f9e` → `#1278c3` at 135°)
- [ ] `glass-card::before` pseudo-element creates the light sheen effect
- [ ] Points formatted with locale separator (2,450 not 2450)
- [ ] Progress bar width matches `progressPercent` prop
- [ ] Progress bar is green (`bg-tertiary-fixed`)
- [ ] `nextReward: null` shows "all rewards unlocked" message
- [ ] "X pts away" chip shown in top-right of progress section
- [ ] Component renders in Storybook with mock data

### Definition of done
- [ ] Storybook story with at least 3 states: 0 pts, mid-progress, all unlocked
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings — all text via `useTranslations('loyaltyCards')`

---

## F-06 — ProgressToReward Component

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-09

### Description
Standalone sub-component showing the progress bar, "X pts away" chip, and motivational text. Extracted from F-05 for reusability and testability. Lives inside the loyalty card hero area.

### Files to create
- `frontend/src/features/loyalty-cards/components/progress-to-reward.tsx`

### Implementation notes

```tsx
interface ProgressToRewardProps {
  currentPoints: number;
  nextReward: { name: string; pointsCost: number } | null;
}
```

Compute `ptsRemaining` and `progressPercent` inside this component — don't require the parent to pre-calculate.

```tsx
const progressPercent = nextReward
  ? Math.min((currentPoints / nextReward.pointsCost) * 100, 100)
  : 100;
const ptsRemaining = nextReward
  ? Math.max(nextReward.pointsCost - currentPoints, 0)
  : 0;
```

**"X pts away" chip:**
```tsx
<span className="font-label text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
  {ptsRemaining} {t('ptsAway')}
</span>
```

### Acceptance criteria
- [ ] Progress bar reaches 100% when `currentPoints >= nextReward.pointsCost`
- [ ] Shows 0% when `currentPoints = 0`
- [ ] Correct pts remaining shown in chip
- [ ] No visible bar when `nextReward` is null

### Definition of done
- [ ] `yarn check-types` passes
- [ ] Used by `LoyaltyCardHero` (F-05)

---

## F-07 — BentoHighlights Grid

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-09

### Description
2-column bento grid below the loyalty card. Contains 3 tiles: Daily Check-in (static for MVP), Happy Hour (static), and Invite Friends (static placeholder — referral is out of MVP scope).

### Files to create
- `frontend/src/features/loyalty-cards/components/bento-highlights.tsx`

### Implementation notes

**Grid layout (from design line 149):**
```tsx
<section className="grid grid-cols-2 gap-4">
  <DailyCheckInTile />
  <HappyHourTile />
  <InviteFriendsTile />  {/* col-span-2 */}
</section>
```

**Tile base style:**
```
bg-surface-container-low p-5 rounded-lg flex flex-col justify-between aspect-square
```

**Daily Check-in tile:**
- Icon: `event_repeat` (primary color)
- Title: "Daily Check-in"
- Subtitle: "+10 pts today"
- Static for MVP — no interaction yet

**Happy Hour tile:**
- Icon: `celebration` (secondary color, FILL 1)
- Title: "Happy Hour"
- Subtitle: "2x Points now"
- Static for MVP

**Invite Friends tile (`col-span-2`, from design line 174):**
```tsx
<div className="col-span-2 bg-surface-container-highest p-6 rounded-lg flex items-center gap-6">
  <div className="flex-1">
    <h3>{t('inviteFriends')}</h3>
    <p>{t('inviteFriendsDesc')}</p>
    <button onClick={() => setShowComingSoon(true)}>
      {t('shareInviteLink')} →
    </button>
  </div>
  {/* QR code placeholder image */}
</div>
```
Tapping "Share Invite Link" opens a simple dialog/toast: "Coming soon in the next update!"

**i18n keys** (add to `loyaltyCards` namespace):
- `dailyCheckIn`, `dailyCheckInSubtitle`, `happyHour`, `happyHourSubtitle`
- `inviteFriends`, `inviteFriendsDesc`, `shareInviteLink`, `comingSoon`

### Acceptance criteria
- [ ] 2-column grid renders all 3 tiles
- [ ] Invite Friends spans full width
- [ ] Tapping Invite Friends shows "Coming soon" feedback (not broken/crashes)
- [ ] Icons render correctly (Material Symbols)
- [ ] Tiles have hover scale effect on icon (`group-hover:scale-110`)

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-08 — RecentActivity Section

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-09

### Description
Shows the last 2 transactions on the Home screen with a "See all" link that navigates to the History tab. Reuses the `TransactionItem` component from Epic 6 (F-18), but since Epic 6 may not be done yet, implement a local version here and refactor to use the shared one later.

### Files to create
- `frontend/src/features/loyalty-cards/components/recent-activity.tsx`
- `frontend/src/features/loyalty-cards/components/activity-item.tsx` — temp until F-18 is done

### Implementation notes

**Props:**
```tsx
interface RecentActivityProps {
  transactions: Array<{
    id: string;
    type: 'earn' | 'redeem';
    label: string;
    points: number;
    createdAt: string;
  }>;
  onSeeAll: () => void;
}
```

**Section header (from design line 189):**
```tsx
<div className="mt-10 mb-6 flex justify-between items-center">
  <h2 className="font-headline font-bold text-xl tracking-tight">{t('recentActivity')}</h2>
  <button className="text-primary font-label text-xs font-bold uppercase tracking-widest"
          onClick={onSeeAll}>
    {t('seeAll')}
  </button>
</div>
```

**Activity item (from design line 195):**
```tsx
<div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-lg shadow-sm">
  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center',
    type === 'earn' ? 'bg-tertiary/10' : 'bg-error/10')}>
    <span className={cn('material-symbols-outlined',
      type === 'earn' ? 'text-tertiary' : 'text-error')}>
      {type === 'earn' ? 'add_circle' : 'remove_circle'}
    </span>
  </div>
  <div className="flex-1">
    <p className="font-bold text-sm">{label}</p>
    <p className="text-xs text-on-surface-variant">{formattedDate}</p>
  </div>
  <div className="text-right">
    <p className={cn('font-headline font-extrabold',
      type === 'earn' ? 'text-tertiary' : 'text-error')}>
      {type === 'earn' ? '+' : '-'}{points}
    </p>
    <p className="text-[10px] font-label uppercase text-on-surface-variant">pts</p>
  </div>
</div>
```

Date formatting: use `Intl.DateTimeFormat` — "Today, 2:45 PM" or "Yesterday, 8:12 PM" or full date.

**i18n keys:** `recentActivity`, `seeAll`, `today`, `yesterday`, `pts`

### Acceptance criteria
- [ ] Shows max 2 most recent transactions
- [ ] Earn transactions: green icon (`text-tertiary`), `+` prefix
- [ ] Redeem transactions: red icon (`text-error`), `-` prefix
- [ ] "See all" button calls `onSeeAll` prop
- [ ] Empty state: shows "No activity yet" when array is empty
- [ ] Date formatted as relative ("Today, 2:45 PM")

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## B-10 — GET /api/v1/loyalty-cards/me

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-04, B-05
**Blocks:** F-09

### Description
The primary API endpoint for the Home screen. Returns the customer's card, current balance, next reward info, and progress percentage in a single response.

### Files to modify
- `backend/src/loyalty-cards/loyalty-cards.controller.ts` — add `GET /me` route
- `backend/src/loyalty-cards/loyalty-cards.service.ts` — add `getCardWithProgress()` method
- `backend/src/loyalty-cards/dto/loyalty-card-me-response.dto.ts` — create response DTO

### Implementation notes

**Response DTO shape** (see `docs/planning/api-contract.md`):
```ts
class NextRewardDto {
  id: string;
  name: string;
  pointsCost: number;
  ptsRemaining: number;
}

class LoyaltyCardMeResponseDto {
  id: string;
  businessId: string;
  customerId: string;
  points: number;
  totalPointsEarned: number;
  qrCodeUrl: string;
  nextReward: NextRewardDto | null;
  progressPercent: number;
  memberSince: Date;
}
```

**Service method `getCardWithProgress()`:**
```ts
async getCardWithProgress(customerId: string, businessId: string) {
  const card = await this.loyaltyCardsRepository.findByCustomerAndBusiness(customerId, businessId);
  if (!card) throw new UnprocessableEntityException({ status: 422, errors: { card: 'notFound' } });

  // Find cheapest active reward customer hasn't yet reached
  const rewards = await this.rewardsService.findActiveForBusiness(businessId);
  const nextReward = rewards
    .filter(r => r.pointsCost > card.points)
    .sort((a, b) => a.pointsCost - b.pointsCost)[0] ?? null;

  const progressPercent = nextReward
    ? Math.min(Math.round((card.points / nextReward.pointsCost) * 100), 100)
    : 100;

  return { ...card, nextReward, progressPercent };
}
```

**`qrCodeUrl` generation:**
```ts
const token = this.scanTokenService.generate(card.id);
return `${this.configService.get('app.apiUrl')}/scan/${card.id}/${token}`;
```

**Controller:**
```ts
@Get('me')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.customer)
@SerializeOptions({ groups: ['customer'] })
@HttpCode(HttpStatus.OK)
getMe(@Request() req) {
  return this.loyaltyCardsService.getCardWithProgress(req.user.sub, req.user.businessId);
}
```

### Acceptance criteria
- [ ] Returns 200 with full response shape for authenticated customer
- [ ] `nextReward` is null when customer has enough pts for all rewards
- [ ] `progressPercent` is 100 when `nextReward` is null
- [ ] `qrCodeUrl` is a valid URL containing cardId and scanToken
- [ ] Non-customer role returns 403
- [ ] Customer with no card returns 422 (shouldn't happen in practice — card created on registration)

### Definition of done
- [ ] Unit test covers: card found with next reward, card found with no next reward, card not found
- [ ] `npm run lint` passes

---

## F-09 — Wire Home Page to API

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-04, F-05, F-06, F-07, F-08, B-10
**Blocks:** nothing (final step for this epic)

### Description
Connect the Home page to the real API. Implement the `useLoyaltyCard` React Query hook, compose all components, add skeleton loading state, error boundary, and empty state for new customers.

### Files to create/modify
- `frontend/src/features/loyalty-cards/api/get-loyalty-card.ts` — query options + hook
- `frontend/src/app/(app)/page.tsx` — Home page composition
- `frontend/src/features/loyalty-cards/components/loyalty-card-skeleton.tsx` — loading state

### Implementation notes

**API hook (follow canonical pattern from `.claude/rules/feature-layer.md`):**
```ts
// src/features/loyalty-cards/api/get-loyalty-card.ts
export const getLoyaltyCardQueryOptions = () =>
  queryOptions({
    queryKey: ['loyalty-card'],
    queryFn: () => api.get<LoyaltyCardMeResponse>('/loyalty-cards/me'),
  });

export const useLoyaltyCard = (options?: QueryConfig<...>) =>
  useQuery({ ...getLoyaltyCardQueryOptions(), ...options });
```

**Home page composition:**
```tsx
// src/app/(app)/page.tsx
export default function HomePage() {
  return (
    <main className="flex-1 w-full max-w-md mx-auto px-6 pt-24 pb-32">
      <Suspense fallback={<LoyaltyCardSkeleton />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

function HomeContent() {
  const { data, isError } = useLoyaltyCard();
  if (isError) return <ErrorState />;
  return (
    <>
      <LoyaltyCardHero ... />
      <ViewRewardsButton />
      <BentoHighlights />
      <RecentActivity transactions={data.recentTransactions} />
    </>
  );
}
```

**Skeleton:** Use `bg-surface-container-low animate-pulse rounded-xl` blocks matching the layout.

**Empty state (0 points):** `LoyaltyCardHero` handles this natively — shows 0 balance and the first reward as the target.

**"VIEW MY REWARDS" CTA button** (from design line 143):
```tsx
<button className="w-full mt-6 bg-secondary-container hover:bg-secondary-fixed transition-all text-on-secondary-container font-headline font-bold py-5 rounded-lg flex items-center justify-center gap-3">
  <span className="material-symbols-outlined">confirmation_number</span>
  {t('viewMyRewards')}
</button>
```
Navigates to `/rewards` tab on click.

### Acceptance criteria
- [ ] Skeleton shown while API call is in progress
- [ ] All 4 sections render correctly with real data
- [ ] "VIEW MY REWARDS" navigates to Rewards tab
- [ ] Network error shows friendly error state (not a crash)
- [ ] Data refreshes when user returns to tab (React Query stale time)
- [ ] New customer with 0 points: hero shows 0, progress bar shows 0%, motivational text shows first reward

### Definition of done
- [ ] `yarn build` passes
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings
