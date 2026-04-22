# Epic 8 — Business Owner Admin Panel

Web panel (built inside the Next.js frontend) for the business owner to manage rewards, configure the earn rate, view analytics, and manage cashier accounts.

> ⚠️ No screen design yet — wireframes required before starting FE tickets. FE tickets below are spec-only; layout details may change once designs arrive.

All backend tickets (B-27–B-31) can be started immediately. FE tickets (F-22–F-26) should be validated against designs when available.

---

## B-27 — POST/PATCH/DELETE /api/v1/rewards (Owner CRUD)

**SP:** 3 | **Layer:** BE | **Status:** Done
**Depends on:** B-05
**Blocks:** F-22

### Description
Owner-only CRUD endpoints to create, update, and soft-delete rewards for their business.

### Files to modify
- `backend/src/rewards/rewards.controller.ts` — add POST, PATCH `:id`, DELETE `:id` routes
- `backend/src/rewards/rewards.service.ts` — add `create()`, `update()`, `softDelete()` methods
- `backend/src/rewards/dto/create-reward.dto.ts` — creation DTO
- `backend/src/rewards/dto/update-reward.dto.ts` — partial update DTO

### Implementation notes

**Create DTO:**
```ts
export class CreateRewardDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsInt() @Min(1)
  pointsCost: number;

  @IsOptional() @IsUrl()
  imageUrl?: string;

  @IsOptional() @IsBoolean()
  isActive?: boolean = true;
}
```

**Update DTO:**
```ts
export class UpdateRewardDto extends PartialType(CreateRewardDto) {}
```

**Service methods:**
```ts
async create(businessId: string, dto: CreateRewardDto): Promise<Reward> {
  return this.rewardsRepository.create({ ...dto, businessId });
}

async update(id: string, businessId: string, dto: UpdateRewardDto): Promise<Reward> {
  const reward = await this.rewardsRepository.findOneOrFail({ id, businessId });
  return this.rewardsRepository.save({ ...reward, ...dto });
}

async softDelete(id: string, businessId: string): Promise<void> {
  const reward = await this.rewardsRepository.findOneOrFail({ id, businessId });
  await this.rewardsRepository.softDelete(id);
}
```

**Controller:**
```ts
@Post()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@HttpCode(HttpStatus.CREATED)
create(@Body() dto: CreateRewardDto, @Request() req) {
  return this.rewardsService.create(req.user.businessId, dto);
}

@Patch(':id')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@HttpCode(HttpStatus.OK)
update(@Param('id') id: string, @Body() dto: UpdateRewardDto, @Request() req) {
  return this.rewardsService.update(id, req.user.businessId, dto);
}

@Delete(':id')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@HttpCode(HttpStatus.NO_CONTENT)
remove(@Param('id') id: string, @Request() req) {
  return this.rewardsService.softDelete(id, req.user.businessId);
}
```

**Image upload:** handled by a separate `POST /api/v1/files/upload` endpoint (outside this ticket). The FE uploads first and passes the resulting `imageUrl` to this endpoint.

### Acceptance criteria
- [ ] `POST /rewards` creates reward scoped to owner's `businessId`
- [ ] `PATCH /rewards/:id` returns 404 if reward belongs to different business
- [ ] `DELETE /rewards/:id` sets `deletedAt` (soft-delete), record still in DB
- [ ] Soft-deleted rewards are excluded from customer catalog (`GET /rewards`)
- [ ] Non-owner role returns 403

### Definition of done
- [ ] Unit tests: create, update, delete, cross-business 404
- [ ] `npm run lint` passes

---

## B-28 — PATCH /api/v1/businesses/me/settings

**SP:** 2 | **Layer:** BE | **Status:** Done
**Depends on:** B-03
**Blocks:** F-23

### Description
Allows the business owner to update the earn rate configuration for their business.

### Files to modify
- `backend/src/businesses/businesses.controller.ts` — add `PATCH /me/settings` route
- `backend/src/businesses/businesses.service.ts` — add `updateSettings()` method
- `backend/src/businesses/dto/update-business-settings.dto.ts` — settings DTO

### Implementation notes

**DTO:**
```ts
export class UpdateBusinessSettingsDto {
  @IsOptional() @IsEnum(['per_amd_spent', 'fixed_per_visit'])
  earnRateMode?: 'per_amd_spent' | 'fixed_per_visit';

  @IsOptional() @IsInt() @Min(1)
  earnRateValue?: number;
  // per_amd_spent: pts per 100 AMD (default: 1 pt per 100 AMD → earnRateValue = 100)
  // fixed_per_visit: flat pts per visit
}
```

**Service:**
```ts
async updateSettings(businessId: string, dto: UpdateBusinessSettingsDto) {
  const business = await this.businessesRepository.findOneOrFail({ id: businessId });
  return this.businessesRepository.save({ ...business, ...dto });
}
```

**Controller:**
```ts
@Patch('me/settings')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@HttpCode(HttpStatus.OK)
updateSettings(@Body() dto: UpdateBusinessSettingsDto, @Request() req) {
  return this.businessesService.updateSettings(req.user.businessId, dto);
}
```

**Earn rate logic in Transaction service:**
```ts
// When earn mode is per_amd_spent:
const pts = Math.floor(amountAmd / business.earnRateValue);
// When earn mode is fixed_per_visit:
const pts = business.earnRateValue;
```

### Acceptance criteria
- [ ] Owner can update `earnRateMode` and `earnRateValue` independently
- [ ] Changes take effect on next earn transaction immediately
- [ ] Non-owner role returns 403
- [ ] Invalid mode value returns 422

### Definition of done
- [ ] Unit test: update mode, update value, unauthorized access
- [ ] `npm run lint` passes

---

## B-29 — GET /api/v1/analytics/dashboard

**SP:** 5 | **Layer:** BE | **Status:** Done
**Depends on:** B-04, B-06
**Blocks:** F-24

### Description
Returns aggregated KPI metrics for the business owner's dashboard. Three key metrics: total customers, transactions today, total points issued all-time.

### Files to create
- `backend/src/analytics/analytics.module.ts`
- `backend/src/analytics/analytics.controller.ts`
- `backend/src/analytics/analytics.service.ts`

### Implementation notes

**Response shape:**
```json
{
  "totalCustomers": 142,
  "transactionsToday": 23,
  "totalPointsIssued": 18450,
  "totalPointsRedeemed": 3200,
  "activeRewards": 5
}
```

**Service implementation:**
```ts
async getDashboard(businessId: string) {
  const [totalCustomers, transactionsToday, pointsAgg, activeRewards] =
    await Promise.all([
      this.loyaltyCardsRepository.count({ where: { businessId } }),

      this.transactionsRepository.count({
        where: {
          card: { businessId },
          createdAt: MoreThanOrEqual(startOfDay(new Date())),
        },
      }),

      this.transactionsRepository
        .createQueryBuilder('t')
        .leftJoin('t.card', 'card')
        .where('card.businessId = :businessId', { businessId })
        .select([
          'SUM(CASE WHEN t.type = \'earn\' THEN t.points ELSE 0 END) AS issued',
          'SUM(CASE WHEN t.type = \'redeem\' THEN t.points ELSE 0 END) AS redeemed',
        ])
        .getRawOne(),

      this.rewardsRepository.count({ where: { businessId, isActive: true, deletedAt: IsNull() } }),
    ]);

  return {
    totalCustomers,
    transactionsToday,
    totalPointsIssued: Number(pointsAgg?.issued ?? 0),
    totalPointsRedeemed: Number(pointsAgg?.redeemed ?? 0),
    activeRewards,
  };
}
```

**Caching:** Add short TTL (60s) using NestJS `CacheInterceptor` to avoid repeated heavy aggregation queries.

**Controller:**
```ts
@Get('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@UseInterceptors(CacheInterceptor)
@CacheTTL(60)
@HttpCode(HttpStatus.OK)
getDashboard(@Request() req) {
  return this.analyticsService.getDashboard(req.user.businessId);
}
```

### Acceptance criteria
- [ ] All 5 KPI fields returned in single request
- [ ] `transactionsToday` counts only today's transactions (midnight–now in server timezone)
- [ ] Data is scoped to owner's `businessId` — cannot see other business data
- [ ] Non-owner role returns 403

### Definition of done
- [ ] Unit tests: counts correct for known seeded data
- [ ] `npm run lint` passes

---

## B-30 — GET /api/v1/analytics/top-customers

**SP:** 2 | **Layer:** BE | **Status:** Done
**Depends on:** B-04
**Blocks:** F-25

### Description
Paginated list of top customers for the business, sorted by `totalPointsEarned` descending.

### Files to modify
- `backend/src/analytics/analytics.controller.ts` — add `GET /top-customers` route
- `backend/src/analytics/analytics.service.ts` — add `getTopCustomers()` method

### Implementation notes

**Query params DTO:**
```ts
export class TopCustomersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit?: number = 20;
}
```

**Response shape:**
```json
{
  "data": [
    {
      "rank": 1,
      "customerId": "uuid",
      "name": "Aram Petrosyan",
      "phone": "+37491234567",
      "currentPoints": 920,
      "totalPointsEarned": 2340,
      "memberSince": "2023-09-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 142 }
}
```

**Service:**
```ts
async getTopCustomers(businessId: string, query: TopCustomersQueryDto) {
  const { page = 1, limit = 20 } = query;
  const [cards, total] = await this.loyaltyCardsRepository.findAndCount({
    where: { businessId },
    relations: ['customer'],
    order: { totalPointsEarned: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: cards.map((card, index) => ({
      rank: (page - 1) * limit + index + 1,
      customerId: card.customerId,
      name: card.customer.name,
      phone: card.customer.phone,
      currentPoints: card.points,
      totalPointsEarned: card.totalPointsEarned,
      memberSince: card.createdAt,
    })),
    meta: { page, limit, total, hasNextPage: page * limit < total },
  };
}
```

### Acceptance criteria
- [ ] Sorted by `totalPointsEarned` DESC (lifetime, not current balance)
- [ ] `rank` field starts at 1, continues across pages correctly
- [ ] Paginated with correct `meta` fields
- [ ] Scoped to owner's business only
- [ ] Non-owner returns 403

### Definition of done
- [ ] Unit test: correct rank ordering, cross-page rank continuity
- [ ] `npm run lint` passes

---

## B-31 — POST/PATCH /api/v1/users (Cashier Account Management)

**SP:** 3 | **Layer:** BE | **Status:** Done
**Depends on:** B-01
**Blocks:** F-26

### Description
Owner creates and deactivates cashier accounts for their business. A cashier is a user with `role: cashier` scoped to the same `businessId` as the owner.

### Files to modify
- `backend/src/users/users.controller.ts` — add POST and PATCH `:id` owner-only routes
- `backend/src/users/users.service.ts` — add `createCashier()`, `deactivateCashier()` methods
- `backend/src/users/dto/create-cashier.dto.ts`

### Implementation notes

**Create Cashier DTO:**
```ts
export class CreateCashierDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsInt()
  telegramUserId: number;    // Required: used for bot auth (cashier must have Telegram)
}
```

**Service:**
```ts
async createCashier(ownerBusinessId: string, dto: CreateCashierDto) {
  const tempPassword = randomBytes(8).toString('hex');
  const hashed = await bcrypt.hash(tempPassword, 10);

  const cashier = await this.usersRepository.create({
    ...dto,
    role: RoleEnum.cashier,
    businessId: ownerBusinessId,
    password: hashed,
    isActive: true,
  });

  // Send invite email with temp password
  await this.mailService.sendCashierInvite(dto.email, { name: dto.name, tempPassword });

  return cashier;
}

async deactivateCashier(id: string, ownerBusinessId: string) {
  const cashier = await this.usersRepository.findOneOrFail({
    where: { id, businessId: ownerBusinessId, role: RoleEnum.cashier },
  });
  return this.usersRepository.save({ ...cashier, isActive: false });
}
```

**Controller:**
```ts
@Post('cashiers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@HttpCode(HttpStatus.CREATED)
createCashier(@Body() dto: CreateCashierDto, @Request() req) {
  return this.usersService.createCashier(req.user.businessId, dto);
}

@Patch('cashiers/:id/deactivate')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@HttpCode(HttpStatus.OK)
deactivateCashier(@Param('id') id: string, @Request() req) {
  return this.usersService.deactivateCashier(id, req.user.businessId);
}
```

### Acceptance criteria
- [ ] Created cashier has `role: cashier` and same `businessId` as owner
- [ ] Invite email sent with temporary password
- [ ] Deactivated cashier cannot log in (`isActive: false` check in auth)
- [ ] Owner cannot deactivate cashiers from other businesses (404)
- [ ] `telegramUserId` is stored for bot authentication
- [ ] `PATCH /api/v1/users/:id/status` endpoint accepts `{ isActive: boolean }` and updates the cashier's active status (used by F-26 deactivate button)

### Definition of done
- [ ] Unit tests: create cashier, deactivate cashier, cross-business 404
- [ ] `npm run lint` passes

---

## F-22 — Owner: Reward Management UI

**SP:** 8 | **Layer:** FE | **Status:** Done
**Depends on:** B-27, F-01
**Blocks:** nothing

### Description
Full CRUD interface for managing rewards: list all rewards with active/inactive toggle, create new reward form, edit existing reward, soft-delete. Owner-only route.

### Files to create
- `frontend/src/features/rewards/components/reward-management-list.tsx`
- `frontend/src/features/rewards/components/reward-form.tsx`
- `frontend/src/features/rewards/api/manage-rewards.ts` — mutation hooks
- `frontend/src/app/(owner)/rewards/page.tsx`
- `frontend/src/app/(owner)/rewards/new/page.tsx`
- `frontend/src/app/(owner)/rewards/[id]/edit/page.tsx`

### Implementation notes

**Mutation hooks:**
```ts
// src/features/rewards/api/manage-rewards.ts
export const useCreateReward = () =>
  useMutation({
    mutationFn: (dto: CreateRewardDto) => api.post('/rewards', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards'] }),
  });

export const useUpdateReward = (id: string) =>
  useMutation({
    mutationFn: (dto: UpdateRewardDto) => api.patch(`/rewards/${id}`, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards'] }),
  });

export const useDeleteReward = () =>
  useMutation({
    mutationFn: (id: string) => api.delete(`/rewards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rewards'] }),
  });
```

**Reward form fields:**
- Name (text input, required)
- Description (textarea, optional)
- Points cost (number input, min 1)
- Image upload (file picker → `POST /files/upload` → set `imageUrl`)
- Active toggle (boolean switch)

**List row actions:** Edit (navigates to edit page) | Toggle active (inline PATCH) | Delete (confirm dialog → soft delete)

**Image upload flow:**
```ts
const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const { url } = await api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  setValue('imageUrl', url);
};
```

**Route guard:** `(owner)` layout wraps all owner routes — redirect to `/` if role is not `owner`.

### Acceptance criteria
- [ ] List shows all rewards (active + inactive) for this business
- [ ] Toggle switch immediately updates `isActive` without page reload
- [ ] Create/edit form validates all required fields before submitting
- [ ] Image preview shown after upload
- [ ] Delete shows confirmation dialog before calling API
- [ ] Soft-deleted rewards disappear from the list
- [ ] Non-owner cannot access `/owner/rewards`

### Definition of done
- [ ] `yarn check-types` passes
- [ ] `yarn build` passes
- [ ] No hardcoded strings

---

## F-23 — Owner: Earn Rate Settings UI

**SP:** 2 | **Layer:** FE | **Status:** Done
**Depends on:** B-28, F-01
**Blocks:** nothing

### Description
Simple settings form for the owner to configure the earn rate mode and value.

### Files to create
- `frontend/src/features/businesses/components/earn-rate-form.tsx`
- `frontend/src/features/businesses/api/update-settings.ts`
- `frontend/src/app/(owner)/settings/page.tsx`

### Implementation notes

**Mutation hook:**
```ts
export const useUpdateSettings = () =>
  useMutation({
    mutationFn: (dto: UpdateBusinessSettingsDto) =>
      api.patch('/businesses/me/settings', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast.success(t('settingsSaved'));
    },
  });
```

**Form layout:**
```tsx
<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
  <div>
    <label className="font-label font-semibold">{t('earnRateMode')}</label>
    <select {...register('earnRateMode')}>
      <option value="per_amd_spent">{t('perAmdSpent')}</option>
      <option value="fixed_per_visit">{t('fixedPerVisit')}</option>
    </select>
  </div>
  <div>
    <label className="font-label font-semibold">
      {mode === 'per_amd_spent' ? t('amdPerPoint') : t('pointsPerVisit')}
    </label>
    <input type="number" min={1} {...register('earnRateValue', { valueAsNumber: true })} />
  </div>
  <button type="submit">{t('saveSettings')}</button>
</form>
```

**i18n keys** (`businesses` namespace): `earnRateMode`, `perAmdSpent`, `fixedPerVisit`, `amdPerPoint`, `pointsPerVisit`, `saveSettings`, `settingsSaved`

### Acceptance criteria
- [ ] Current settings pre-filled from `GET /businesses/me`
- [ ] Mode selector updates label for the value field
- [ ] Save shows success toast on API response
- [ ] Form validates: `earnRateValue` must be integer ≥ 1

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-24 — Owner: Dashboard Metrics Page

**SP:** 5 | **Layer:** FE | **Status:** Done
**Depends on:** B-29, F-01
**Blocks:** nothing

### Description
Analytics dashboard for the owner with 3–5 KPI cards showing business health metrics.

### Files to create
- `frontend/src/features/analytics/components/kpi-card.tsx`
- `frontend/src/features/analytics/api/get-dashboard.ts`
- `frontend/src/app/(owner)/dashboard/page.tsx`

### Implementation notes

**Query hook:**
```ts
export const useDashboard = () =>
  useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => api.get<DashboardResponse>('/analytics/dashboard'),
    refetchInterval: 60_000,  // Auto-refresh every 60s
  });
```

**KPI Card component:**
```tsx
interface KpiCardProps {
  title: string;
  value: number | string;
  icon: string;           // Material Symbol name
  trend?: string;         // e.g. "+12% this week" — optional
  color?: 'primary' | 'secondary' | 'tertiary';
}

<div className="bg-surface-container-lowest rounded-xl p-6 flex items-center gap-4 shadow-sm">
  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center',
    color === 'primary' ? 'bg-primary/10 text-primary' : ...)}>
    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
      {icon}
    </span>
  </div>
  <div>
    <p className="font-label text-xs text-on-surface-variant uppercase tracking-widest">{title}</p>
    <p className="font-headline text-3xl font-extrabold">{value.toLocaleString()}</p>
    {trend && <p className="font-label text-xs text-tertiary mt-0.5">{trend}</p>}
  </div>
</div>
```

**KPI cards:**
1. Total Customers — icon `group`, color `primary`
2. Transactions Today — icon `receipt_long`, color `secondary`
3. Total Points Issued — icon `stars`, color `tertiary`
4. Points Redeemed — icon `redeem`, color `error`
5. Active Rewards — icon `confirmation_number`, color `primary`

**i18n keys** (`analytics` namespace): `totalCustomers`, `transactionsToday`, `totalPointsIssued`, `pointsRedeemed`, `activeRewards`, `dashboard`

### Acceptance criteria
- [ ] All 5 KPI cards render with real data
- [ ] Values formatted with locale separator
- [ ] Data auto-refreshes every 60 seconds
- [ ] Loading skeleton shown during initial fetch
- [ ] Non-owner cannot access dashboard

### Definition of done
- [ ] `yarn check-types` passes
- [ ] `yarn build` passes
- [ ] No hardcoded strings

---

## F-25 — Owner: Top Customers List

**SP:** 3 | **Layer:** FE | **Status:** Done
**Depends on:** B-30, F-01
**Blocks:** nothing

### Description
Paginated ranked table of top customers sorted by total points earned.

### Files to create
- `frontend/src/features/analytics/components/top-customers-table.tsx`
- `frontend/src/features/analytics/api/get-top-customers.ts`
- `frontend/src/app/(owner)/customers/page.tsx`

### Implementation notes

**Query hook:**
```ts
export const useTopCustomers = (page: number) =>
  useQuery({
    queryKey: ['top-customers', page],
    queryFn: () =>
      api.get<TopCustomersResponse>('/analytics/top-customers', { params: { page, limit: 20 } }),
  });
```

**Table columns:**
| # | Name | Phone | Current Balance | Total Earned | Member Since |

**Row:**
```tsx
<tr className="border-b border-outline-variant/10 hover:bg-surface-container-low">
  <td className="py-3 px-4 font-bold text-primary">#{rank}</td>
  <td className="py-3 px-4 font-body">{name}</td>
  <td className="py-3 px-4 font-body text-on-surface-variant">{phone}</td>
  <td className="py-3 px-4 font-headline font-bold">{currentPoints.toLocaleString()}</td>
  <td className="py-3 px-4 text-tertiary font-semibold">{totalPointsEarned.toLocaleString()}</td>
  <td className="py-3 px-4 text-on-surface-variant text-sm">{formatDate(memberSince)}</td>
</tr>
```

**Pagination:** Previous / Next buttons; show "Page X of Y".

**i18n keys** (`analytics` namespace): `topCustomers`, `rank`, `name`, `phone`, `currentBalance`, `totalEarned`, `memberSince`

### Acceptance criteria
- [ ] Table sorted by total earned DESC (server-side)
- [ ] Rank number continues correctly across pages
- [ ] Pagination shows correct total count
- [ ] Empty state shown if no customers yet

### Definition of done
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-26 — Owner: Cashier Management UI

**SP:** 5 | **Layer:** FE | **Status:** Done
**Depends on:** B-31, F-01
**Blocks:** nothing

### Description
Owner view to list all cashiers for their business, create new cashier accounts, and deactivate existing ones.

### Files to create
- `frontend/src/features/users/components/cashier-list.tsx`
- `frontend/src/features/users/components/create-cashier-form.tsx`
- `frontend/src/features/users/api/manage-cashiers.ts`
- `frontend/src/app/(owner)/team/page.tsx`

### Implementation notes

**Query hook:**
```ts
export const useCashiers = () =>
  useQuery({
    queryKey: ['cashiers'],
    queryFn: () => api.get<{ data: Cashier[] }>('/users/cashiers'),
  });
```

**Mutation hooks:**
```ts
export const useCreateCashier = () =>
  useMutation({
    mutationFn: (dto: CreateCashierDto) => api.post('/users/cashiers', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashiers'] }),
  });

export const useDeactivateCashier = () =>
  useMutation({
    mutationFn: (id: string) => api.patch(`/users/cashiers/${id}/deactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashiers'] }),
  });
```

**Cashier list row:**
```tsx
<div className="flex items-center justify-between p-4 bg-surface-container-lowest rounded-lg">
  <div>
    <p className="font-bold">{name}</p>
    <p className="text-sm text-on-surface-variant">{email}</p>
    <p className="text-xs text-on-surface-variant/60">Telegram ID: {telegramUserId}</p>
  </div>
  <div className="flex items-center gap-3">
    <span className={cn('px-2 py-1 rounded-full text-xs font-bold',
      isActive ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error')}>
      {isActive ? t('active') : t('inactive')}
    </span>
    {isActive && (
      <button onClick={() => handleDeactivate(id)}
              className="text-error text-sm font-semibold">
        {t('deactivate')}
      </button>
    )}
  </div>
</div>
```

**Create cashier form fields:** Name, Email, Phone (optional), Telegram User ID
- Note: Include tooltip explaining how to find Telegram User ID

**Deactivation:** Confirm dialog before calling API.

**i18n keys** (`team` namespace): `cashiers`, `addCashier`, `active`, `inactive`, `deactivate`, `deactivateConfirm`, `inviteSent`, `telegramIdHelp`

### Acceptance criteria
- [ ] List shows all cashiers (active + inactive) with status badge
- [ ] Create form: all required fields validated before submit
- [ ] Invite email confirmation shown after successful creation
- [ ] Deactivate shows confirmation dialog
- [ ] Deactivated cashiers show `inactive` badge, no deactivate button

### Definition of done
- [ ] `yarn check-types` passes
- [ ] `yarn build` passes
- [ ] No hardcoded strings
