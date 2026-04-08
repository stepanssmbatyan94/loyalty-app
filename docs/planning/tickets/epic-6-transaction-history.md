# Epic 6 — Transaction History

Design reference: `docs/design/Transaction History/code.html` and `screen.png`.
All 4 tickets are relatively straightforward. F-18 and F-19 can be started with mock data in parallel with B-17.

---

## B-17 — GET /api/v1/transactions

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-06
**Blocks:** F-20

### Description
Paginated transaction history endpoint for the authenticated customer. Supports filtering by type and date range. Default returns last 30 days.

### Files to modify
- `backend/src/transactions/transactions.controller.ts` — add `GET /transactions` route
- `backend/src/transactions/transactions.service.ts` — add `findManyByCard()`
- `backend/src/transactions/dto/query-transaction.dto.ts` — query params DTO

### Implementation notes

**Query DTO:**
```ts
export class QueryTransactionDto {
  @IsOptional() @IsEnum(['earn', 'redeem'])
  type?: 'earn' | 'redeem';

  @IsOptional() @Type(() => Date) @IsDate()
  from?: Date;                  // default: 30 days ago

  @IsOptional() @Type(() => Date) @IsDate()
  to?: Date;                    // default: now

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number = 20;
}
```

**Service method:**
```ts
async findManyByCard(cardId: string, query: QueryTransactionDto) {
  const from = query.from ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ?? new Date();
  const { page = 1, limit = 20, type } = query;

  return this.transactionsRepository.findManyWithPagination({
    cardId, type, from, to,
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

**Repository method returns `{ data: Transaction[], total: number }`.**

**Response shape:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "earn",
      "points": 120,
      "label": "Beer House",
      "note": null,
      "createdAt": "2023-10-24T17:45:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "hasNextPage": true
  }
}
```

**Controller:**
```ts
@Get()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.customer)
@HttpCode(HttpStatus.OK)
findAll(@Query() query: QueryTransactionDto, @Request() req) {
  // Get cardId from JWT or look it up by customerId + businessId
  return this.transactionsService.findManyByCard(req.user.cardId, query);
}
```

**Sort order:** Always `createdAt DESC` (newest first).

### Acceptance criteria
- [ ] Returns paginated list sorted by `createdAt DESC`
- [ ] Default date range is last 30 days
- [ ] `type` filter works correctly
- [ ] `meta.hasNextPage` is true when more records exist
- [ ] Customer can only see their own card's transactions (403 for others)
- [ ] Empty data array returned (not 404) when no transactions match filters

### Definition of done
- [ ] Unit tests: no filters, type filter, date filter, pagination
- [ ] `npm run lint` passes

---

## F-18 — TransactionItem Component

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-19, also used by F-08 (RecentActivity)

### Description
Individual row in the transaction history list. Shows an icon (green for earn, red for redeem), the transaction label, date/time, and the points change with sign.

### Files to create
- `frontend/src/features/point-transactions/components/transaction-item.tsx`
- `frontend/src/features/point-transactions/components/transaction-item.stories.tsx`
- `frontend/src/features/point-transactions/index.ts`

### Implementation notes

**Props:**
```tsx
interface TransactionItemProps {
  type: 'earn' | 'redeem';
  label: string;
  points: number;
  createdAt: string;     // ISO date string
}
```

**Layout (from design `Transaction History/code.html` lines 125–138):**
```tsx
<div className="bg-surface-container-lowest p-6 rounded-lg flex items-center justify-between transition-all hover:bg-white border border-transparent hover:border-outline-variant/10">
  {/* Icon */}
  <div className="flex items-center gap-5">
    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center',
      type === 'earn' ? 'bg-tertiary-container/10 text-tertiary-container'
                     : 'bg-error-container/10 text-error')}>
      <span className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}>
        {type === 'earn' ? 'sports_bar' : 'redeem'}
      </span>
    </div>
    {/* Label + date */}
    <div>
      <h3 className="font-headline font-bold text-on-background">{label}</h3>
      <p className="font-label text-xs text-on-surface-variant mt-0.5">{formattedDate}</p>
    </div>
  </div>
  {/* Points */}
  <div className="text-right">
    <span className={cn('font-headline text-lg font-extrabold',
      type === 'earn' ? 'text-tertiary-container' : 'text-error')}>
      {type === 'earn' ? '+' : '-'}{points}
    </span>
    <p className="font-label text-[10px] uppercase tracking-tighter text-on-surface-variant/60 font-bold">
      {type === 'earn' ? t('earned') : t('redeemed')}
    </p>
  </div>
</div>
```

**Date formatting:**
```ts
function formatTransactionDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) + ` • ${timeStr}`;
}
```

**i18n keys** (`pointTransactions` namespace): `earned`, `redeemed`, `today`, `yesterday`

Note: Use i18n for labels, but date formatting logic can live in a util file (`src/features/point-transactions/utils/format-date.ts`).

### Acceptance criteria
- [ ] Earn: green icon (`text-tertiary-container`), "+" prefix, "Earned" type label
- [ ] Redeem: red icon (`text-error`), "-" prefix, "Redeemed" type label
- [ ] Date shows relative "Today, HH:MM" or "Yesterday, HH:MM"
- [ ] Older dates show full date string
- [ ] Hover effect: white background + border outline
- [ ] No divider lines between items (spacing only)

### Definition of done
- [ ] Storybook: earn story, redeem story, today vs older date
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-19 — TransactionHistoryPage

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-18, F-01
**Blocks:** F-20

### Description
The full Transaction History page layout with balance header, filter chips (All Time / This Month / This Week), and the transaction list.

### Files to create
- `frontend/src/app/(app)/history/page.tsx`
- `frontend/src/features/point-transactions/components/transaction-filter-chips.tsx`

### Implementation notes

**Filter chips (from design line 119):**
```tsx
type FilterPeriod = 'all' | 'month' | 'week';

interface TransactionFilterChipsProps {
  active: FilterPeriod;
  onChange: (period: FilterPeriod) => void;
}
```

Chip style (inactive): `px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-label text-xs font-semibold`
Chip style (active): `bg-primary-fixed text-on-primary-fixed` (per design system filter chip spec)

**Filter → date range mapping:**
```ts
const getDateRange = (period: FilterPeriod) => {
  const to = new Date();
  const from = new Date();
  if (period === 'week') from.setDate(from.getDate() - 7);
  if (period === 'month') from.setMonth(from.getMonth() - 1);
  if (period === 'all') return { from: undefined, to: undefined };
  return { from, to };
};
```

**Balance header (from design lines 106–112):**
```tsx
<section className="mb-10">
  <div className="flex flex-col items-start">
    <span className="font-label text-xs font-semibold uppercase tracking-widest text-on-surface-variant/70 mb-2">
      {t('loyaltyBalance')}
    </span>
    <div className="flex items-baseline gap-2">
      <span className="font-headline text-5xl font-extrabold text-primary">
        {points.toLocaleString()}
      </span>
      <span className="font-headline text-lg font-bold text-secondary">PTS</span>
    </div>
  </div>
</section>
```

**Footer (from design line 190):**
```tsx
<div className="mt-12 text-center p-8 bg-gradient-to-b from-transparent to-surface-container-low/50 rounded-b-xl">
  <p className="font-body text-sm text-on-surface-variant/60">{t('showingLast30Days')}</p>
</div>
```

**i18n keys** (`pointTransactions` namespace): `loyaltyBalance`, `history`, `allTime`, `thisMonth`, `thisWeek`, `showingLast30Days`

### Acceptance criteria
- [ ] Balance header shows real card points in primary blue
- [ ] Filter chips visible with correct active state
- [ ] Switching filter updates the transaction list
- [ ] "History" section heading visible
- [ ] Footer note shown at bottom
- [ ] "History" tab is active in BottomNavBar

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-20 — Wire History Page to API

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-19, B-17, F-04
**Blocks:** nothing (final step for this epic)

### Description
Connect the Transaction History page to the real API using `useInfiniteQuery` for infinite scroll pagination.

### Files to create/modify
- `frontend/src/features/point-transactions/api/get-transactions.ts` — infinite query hook
- `frontend/src/app/(app)/history/page.tsx` — wire components to data

### Implementation notes

**Infinite query hook:**
```ts
export const useTransactions = (filters: TransactionFilters) =>
  useInfiniteQuery({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam = 1 }) =>
      api.get<TransactionsPaginatedResponse>('/transactions', {
        params: { page: pageParam, limit: 20, ...filters },
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  });
```

**Flatten pages for rendering:**
```ts
const transactions = data?.pages.flatMap(p => p.data) ?? [];
```

**Infinite scroll trigger:** Use `IntersectionObserver` on a sentinel div at the bottom:
```tsx
const sentinelRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  });
  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage]);
```

**Loading states:**
- Initial load: skeleton (3 pulse items)
- Loading more: spinner at bottom of list
- Empty state: "No transactions yet. Start earning points!" with an icon

**Filter changes:** When filter chip changes, clear the query cache for that key and refetch from page 1.

### Acceptance criteria
- [ ] Real transactions load from API on page open
- [ ] Scrolling to bottom loads more items automatically
- [ ] Filter chips correctly pass `type` or date range to API
- [ ] Loading skeleton shown during initial fetch
- [ ] "Load more" spinner at bottom while fetching next page
- [ ] Empty state shown when no transactions match filters
- [ ] Balance from `useLoyaltyCard` shown in header

### Definition of done
- [ ] `yarn build` passes
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings
