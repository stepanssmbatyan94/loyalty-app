# Epic 5 — Redemption Flow

Design reference: `docs/design/Redemption/code.html` and `screen.png`.
The most complex customer-facing flow. BE tickets (B-12–B-16) can start as soon as Epic 2 is done.

---

## B-12 — POST /api/v1/redemptions (Create Redemption)

**SP:** 8 | **Layer:** BE | **Status:** Todo
**Depends on:** B-04, B-05, B-07
**Blocks:** B-14, B-15, B-16, F-16

### Description
Core redemption creation endpoint. Validates customer balance, pre-deducts points, generates a unique 6-digit code and QR data URL, and stores the pending redemption with a 5-minute expiry.

### Files to modify
- `backend/src/redemptions/redemptions.service.ts` — implement `create()` method
- `backend/src/redemptions/redemptions.controller.ts` — add POST route
- `backend/src/redemptions/dto/create-redemption.dto.ts` — request DTO

### Implementation notes

**Request DTO:**
```ts
export class CreateRedemptionDto {
  @IsUUID()
  rewardId: string;
}
```

**`create()` service method:**
```ts
async create(customerId: string, businessId: string, dto: CreateRedemptionDto): Promise<Redemption> {
  // 1. Load reward — validate it exists and belongs to this business
  const reward = await this.rewardsService.findById(dto.rewardId);
  if (!reward || reward.businessId !== businessId) {
    throw new UnprocessableEntityException({ status: 422, errors: { reward: 'notFound' } });
  }
  if (!reward.isActive) {
    throw new UnprocessableEntityException({ status: 422, errors: { reward: 'notActive' } });
  }

  // 2. Load card and validate balance
  const card = await this.loyaltyCardsService.findByCustomerAndBusiness(customerId, businessId);
  if (card.points < reward.pointsCost) {
    throw new UnprocessableEntityException({ status: 422, errors: { points: 'insufficient' } });
  }

  // 3. Deduct points immediately (pre-authorised)
  await this.loyaltyCardsService.deductPoints(card.id, reward.pointsCost);

  // 4. Generate 6-digit code (collision-resistant)
  let code: string;
  do {
    code = crypto.randomInt(100000, 999999).toString();
  } while (await this.redemptionsRepository.findByCode(code)); // retry if collision

  // 5. Persist
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  const qrData = `${this.configService.get('app.apiUrl')}/api/v1/redemptions/validate/${code}`;

  return this.redemptionsRepository.create({
    cardId: card.id, rewardId: reward.id, businessId,
    code, qrData, status: 'pending', pointsCost: reward.pointsCost, expiresAt,
  });
}
```

**Controller:**
```ts
@Post()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.customer)
@HttpCode(HttpStatus.CREATED)
create(@Body() dto: CreateRedemptionDto, @Request() req) {
  return this.redemptionsService.create(req.user.sub, req.user.businessId, dto);
}
```

**Response shape** (see `api-contract.md`):
```json
{
  "id": "uuid",
  "code": "459201",
  "qrData": "https://api.../redemptions/validate/459201",
  "rewardName": "Free Pint",
  "pointsCost": 500,
  "expiresAt": "ISO timestamp",
  "status": "pending"
}
```

### Acceptance criteria
- [ ] Points deducted from card immediately on creation
- [ ] `expiresAt` is exactly 5 minutes from creation
- [ ] Code is 6 digits, numeric string, unique
- [ ] Returns 422 if insufficient points
- [ ] Returns 422 if reward is inactive
- [ ] Returns 422 if reward belongs to different business
- [ ] Code collision handled (retry loop, practically impossible but safe)

### Definition of done
- [ ] Unit tests: success, insufficient points, inactive reward, reward not found
- [ ] `npm run lint` passes

---

## B-13 — Cron Job: Auto-Expire Redemptions

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-07, B-06
**Blocks:** B-35 (expiry notification)

### Description
A scheduled job that runs every 30 seconds, finds all pending redemptions past their `expiresAt` time, marks them as expired, and refunds the points to the customer's card.

### Files to create/modify
- `backend/src/redemptions/redemptions.cron.ts` — cron service
- `backend/src/redemptions/redemptions.module.ts` — register cron service
- `backend/src/app.module.ts` — ensure `ScheduleModule.forRoot()` is imported

### Implementation notes

**Cron service:**
```ts
@Injectable()
export class RedemptionsCron {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleExpiredRedemptions() {
    const expired = await this.redemptionsService.findExpiredPending();
    await Promise.all(expired.map(r => this.redemptionsService.expire(r.id)));
  }
}
```

**`findExpiredPending()` repository method:**
```ts
findExpiredPending(): Promise<Redemption[]> {
  return this.repo.find({
    where: { status: 'pending', expiresAt: LessThan(new Date()) }
  });
}
```

**`expire()` service method:**
```ts
async expire(redemptionId: string) {
  const redemption = await this.redemptionsRepository.findById(redemptionId);
  if (redemption.status !== 'pending') return; // already handled

  await this.redemptionsRepository.updateStatus(redemptionId, 'expired');
  await this.loyaltyCardsService.addPoints(redemption.cardId, redemption.pointsCost);
  // Trigger notification B-35 (after Epic 9 is implemented)
}
```

**Add to `AppModule`:**
```ts
import { ScheduleModule } from '@nestjs/schedule';
ScheduleModule.forRoot()
```

### Acceptance criteria
- [ ] Pending redemptions past `expiresAt` are marked `expired` within 30s
- [ ] Points refunded to card on expiry
- [ ] Already-expired or confirmed redemptions not processed twice
- [ ] Cron logs each expiry (use NestJS Logger)

### Definition of done
- [ ] `@nestjs/schedule` in package.json
- [ ] Unit test: `expire()` refunds points and updates status
- [ ] `npm run lint` passes

---

## B-14 — GET /api/v1/redemptions/validate/:code

**SP:** 2 | **Layer:** BE | **Status:** Todo
**Depends on:** B-07
**Blocks:** B-23 (bot confirm flow)

### Description
Called by the Telegram Bot when cashier types or scans a redemption code. Returns the redemption status and details so the bot can show the cashier what they're confirming.

### Files to modify
- `backend/src/redemptions/redemptions.controller.ts` — add `GET /validate/:code`
- `backend/src/redemptions/redemptions.service.ts` — add `findByCodeForValidation()`

### Implementation notes

**This endpoint is called by internal bot service, not by the customer Mini App.**
Auth: use a shared internal service token (Bot API key in env var, passed as `X-Bot-Token` header).

**Response:**
```json
{
  "code": "459201",
  "status": "valid",
  "rewardName": "Free Pint",
  "customerName": "Armen Petrosyan",
  "pointsCost": 500,
  "expiresAt": "ISO timestamp",
  "secondsRemaining": 142
}
```

**Status values and HTTP codes:**
| Status | HTTP | Body |
|---|---|---|
| pending + not expired | 200 | status: "valid" + details |
| expired | 410 | `{ status: "expired" }` |
| confirmed | 409 | `{ status: "already_used" }` |
| cancelled | 409 | `{ status: "cancelled" }` |
| not found | 404 | standard 404 |

**`secondsRemaining` calculation:**
```ts
Math.max(0, Math.floor((redemption.expiresAt.getTime() - Date.now()) / 1000))
```

### Acceptance criteria
- [ ] Valid code returns 200 with all fields
- [ ] Expired code returns 410
- [ ] Already confirmed code returns 409
- [ ] Non-existent code returns 404
- [ ] `secondsRemaining` is 0 for expired codes

### Definition of done
- [ ] Unit tests for all 4 status outcomes
- [ ] `npm run lint` passes

---

## B-15 — PATCH /api/v1/redemptions/:code/confirm

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-14, B-06
**Blocks:** nothing (final bot confirm step)

### Description
Called by the Telegram Bot after the cashier taps "✅ Approve". Marks the redemption as confirmed, creates a Transaction record for the history, and triggers a customer notification.

### Files to modify
- `backend/src/redemptions/redemptions.controller.ts` — add `PATCH /:code/confirm`
- `backend/src/redemptions/redemptions.service.ts` — add `confirm()` method

### Implementation notes

**Request body:**
```ts
{ cashierTelegramId: number }
```

**`confirm()` service method:**
```ts
async confirm(code: string, cashierTelegramId: number) {
  const redemption = await this.redemptionsRepository.findByCode(code);
  if (!redemption) throw new NotFoundException();
  if (redemption.status === 'expired') throw new GoneException({ status: 'expired' });
  if (redemption.status === 'confirmed') throw new ConflictException({ status: 'already_used' });

  // Mark as confirmed
  await this.redemptionsRepository.updateStatus(code, 'confirmed', { cashierTelegramId, confirmedAt: new Date() });

  // Create immutable Transaction record
  await this.transactionsService.create({
    cardId: redemption.cardId,
    businessId: redemption.businessId,
    type: 'redeem',
    points: redemption.pointsCost,
    label: (await this.rewardsService.findById(redemption.rewardId)).name,
    cashierTelegramId,
    rewardId: redemption.rewardId,
  });

  // Trigger notification B-34 (after Epic 9)
  return { success: true, transactionId, customerName, rewardName, pointsDeducted, newBalance };
}
```

### Acceptance criteria
- [ ] Returns success response with `newBalance`
- [ ] Transaction record created with `type: 'redeem'`
- [ ] Confirming an expired code returns 410
- [ ] Confirming an already-confirmed code returns 409
- [ ] `confirmedAt` and `cashierTelegramId` stored on the redemption

### Definition of done
- [ ] Unit tests: success, expired, already confirmed
- [ ] `npm run lint` passes

---

## B-16 — PATCH /api/v1/redemptions/:code/cancel

**SP:** 2 | **Layer:** BE | **Status:** Todo
**Depends on:** B-07
**Blocks:** nothing

### Description
Allows the customer to cancel a pending redemption (e.g. taps "Done" before cashier confirms) or the cashier to reject it via the bot. Points are refunded immediately.

### Files to modify
- `backend/src/redemptions/redemptions.controller.ts` — add `PATCH /:code/cancel`
- `backend/src/redemptions/redemptions.service.ts` — add `cancel()` method

### Implementation notes

**`cancel()` service method:**
```ts
async cancel(code: string) {
  const redemption = await this.redemptionsRepository.findByCode(code);
  if (!redemption || redemption.status !== 'pending') return; // idempotent

  await this.redemptionsRepository.updateStatus(code, 'cancelled');
  await this.loyaltyCardsService.addPoints(redemption.cardId, redemption.pointsCost);
  // Return points immediately
  return { success: true, pointsRefunded: redemption.pointsCost };
}
```

**Auth:** Customer JWT (can cancel their own) OR internal bot token (cashier rejects).

### Acceptance criteria
- [ ] Points refunded to card on cancel
- [ ] Cancelling an already-confirmed redemption does nothing (idempotent)
- [ ] Returns `pointsRefunded` in response

### Definition of done
- [ ] Unit test: cancel pending (refunds pts), cancel confirmed (no-op)
- [ ] `npm run lint` passes

---

## F-14 — RedemptionScreen Layout

**SP:** 5 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-16, F-17

### Description
The full redemption screen shown after the customer taps "Redeem". Displays the reward name, a QR code, the 6-digit code, and the countdown timer. The customer shows this screen to the bartender.

### Files to create
- `frontend/src/features/redemptions/components/redemption-screen.tsx`
- `frontend/src/features/redemptions/components/redemption-screen.stories.tsx`

### Implementation notes

**Props:**
```tsx
interface RedemptionScreenProps {
  rewardName: string;
  code: string;          // "459201"
  qrData: string;        // URL to encode in QR
  expiresAt: string;     // ISO timestamp
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  onDone: () => void;
}
```

**"Active Voucher" badge (from design line 104):**
```tsx
<span className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-fixed text-on-secondary-fixed rounded-full font-label text-xs font-bold uppercase tracking-widest">
  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
  {t('activeVoucher')}
</span>
```

**QR Code:** Use `qrcode.react` package:
```tsx
import QRCode from 'qrcode.react';
// ...
<QRCode value={qrData} size={192} bgColor="#ffffff" fgColor="#1a1c1e" level="M" />
```
Install: `yarn add qrcode.react @types/qrcode.react`

Wrap in the styled container from design (lines 116–136): white background card with blue corner brackets (`.absolute top-4 left-4 w-4 h-4 border-t-4 border-l-4 border-primary`).

**6-digit code display (line 139):**
```tsx
<span className="font-label text-[10px] uppercase font-bold text-on-surface-variant tracking-[0.2em] mb-2 block">
  {t('redemptionCode')}
</span>
<div className="font-headline text-5xl font-black tracking-[0.15em] text-on-background">
  {code.slice(0,3)} {code.slice(3)}
</div>
```

**"Done" button (line 154):**
```tsx
<button onClick={onDone}
  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-5 rounded-lg font-headline font-bold text-lg flex items-center justify-center gap-3">
  {t('done')}
  <span className="material-symbols-outlined">check_circle</span>
</button>
```

**Expired state:** When `status === 'expired'`, replace QR section with:
```tsx
<div className="text-center py-8">
  <span className="material-symbols-outlined text-error text-6xl">timer_off</span>
  <p className="font-headline font-bold text-error mt-4">{t('codeExpired')}</p>
  <p className="text-on-surface-variant text-sm mt-2">{t('pointsReturned')}</p>
</div>
```

**i18n keys** (`rewards` namespace): `activeVoucher`, `youAreRedeeming`, `redemptionCode`, `showToStaff`, `done`, `codeExpired`, `pointsReturned`

### Acceptance criteria
- [ ] "Active Voucher" badge renders with gold background
- [ ] QR code renders and is scannable (manually verify)
- [ ] 6-digit code displayed with space in middle ("459 201")
- [ ] Blue corner brackets around QR code area
- [ ] Expired state replaces QR with error message
- [ ] "Done" button calls `onDone` prop

### Definition of done
- [ ] `qrcode.react` in `package.json`
- [ ] Storybook: pending state, expired state
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings

---

## F-15 — CountdownTimer Component

**SP:** 3 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-16

### Description
Real-time countdown timer that shows MM:SS remaining until the redemption code expires. Turns red and shows a warning when under 60 seconds. Switches to "Expired" state when time runs out.

### Files to create
- `frontend/src/features/redemptions/components/countdown-timer.tsx`
- `frontend/src/features/redemptions/components/countdown-timer.stories.tsx`

### Implementation notes

**Props:**
```tsx
interface CountdownTimerProps {
  expiresAt: string;           // ISO timestamp
  onExpired: () => void;       // called when timer hits 0
}
```

**Timer logic:**
```tsx
'use client';
const [secondsLeft, setSecondsLeft] = useState(() =>
  Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
);

useEffect(() => {
  if (secondsLeft <= 0) { onExpired(); return; }
  const id = setInterval(() => {
    setSecondsLeft(s => {
      if (s <= 1) { onExpired(); clearInterval(id); return 0; }
      return s - 1;
    });
  }, 1000);
  return () => clearInterval(id);
}, [expiresAt]);

const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
const seconds = (secondsLeft % 60).toString().padStart(2, '0');
const isWarning = secondsLeft <= 60 && secondsLeft > 0;
```

**Render (from design line 144):**
```tsx
<div className={cn(
  'flex items-center gap-3 px-6 py-3 rounded-full border',
  isWarning
    ? 'bg-error-container/40 border-error-container'
    : 'bg-surface-container-low border-outline-variant/20'
)}>
  <span className={cn('material-symbols-outlined text-xl',
    isWarning ? 'text-error' : 'text-on-surface-variant')}
    style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
  <span className={cn('font-headline font-bold text-lg tabular-nums',
    isWarning ? 'text-error' : 'text-on-surface-variant')}>
    {secondsLeft > 0 ? `${t('expiresIn')} ${minutes}:${seconds}` : t('expired')}
  </span>
</div>
```

**i18n keys** (`rewards` namespace): `expiresIn`, `expired`

### Acceptance criteria
- [ ] Counts down second by second accurately
- [ ] Changes to red/warning style at <60 seconds
- [ ] Calls `onExpired` when it hits 0
- [ ] Shows "Expired" text when `secondsLeft === 0`
- [ ] `tabular-nums` prevents layout shift as digits change
- [ ] Timer starts immediately from correct remaining time

### Definition of done
- [ ] Storybook story with 5-min start, 30-second warning, expired state
- [ ] `yarn check-types` passes
- [ ] No memory leaks (interval cleared in cleanup)

---

## F-16 — Redeem Action from Catalog

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** F-13, B-12
**Blocks:** F-17

### Description
Wire the "Redeem" button in the Rewards Catalog to call `POST /redemptions` and navigate to the Redemption screen on success.

### Files to create/modify
- `frontend/src/features/rewards/api/create-redemption.ts` — mutation hook
- `frontend/src/app/(app)/rewards/page.tsx` — handle redeem action

### Implementation notes

**Mutation hook:**
```ts
export const useCreateRedemption = (options?: MutationConfig<...>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) =>
      api.post<RedemptionResponse>('/redemptions', { rewardId }),
    onSuccess: () => {
      // Invalidate card balance — points were deducted
      queryClient.invalidateQueries({ queryKey: ['loyalty-card'] });
    },
    ...options,
  });
};
```

**In `RewardsPage`:**
```tsx
const createRedemption = useCreateRedemption({
  mutationConfig: {
    onSuccess: (redemption) => {
      router.push(`/redemption/${redemption.id}`);
    },
    onError: () => {
      showErrorNotification(t('redemptionFailed'));
    },
  },
});
```

### Acceptance criteria
- [ ] Tapping Redeem calls `POST /redemptions` with correct `rewardId`
- [ ] RewardCard button shows loading state while mutation is in flight
- [ ] On success: navigate to `/redemption/:id`
- [ ] On error: show error notification, button returns to normal
- [ ] Loyalty card balance is invalidated in React Query cache on success

### Definition of done
- [ ] `yarn check-types` passes

---

## F-17 — Redemption Screen Page + Done Button

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** F-14, F-15, F-16, B-12
**Blocks:** nothing (final step for this epic)

### Description
Create the `/redemption/[id]` page route, fetch redemption data, compose the `RedemptionScreen` and `CountdownTimer` components, and handle the "Done" button + expiry event.

### Files to create
- `frontend/src/app/(app)/redemption/[id]/page.tsx`
- `frontend/src/features/redemptions/api/get-redemption.ts`

### Implementation notes

**API hook:**
```ts
export const useRedemption = (id: string) =>
  useQuery({
    queryKey: ['redemption', id],
    queryFn: () => api.get<RedemptionResponse>(`/redemptions/${id}`),
    refetchInterval: 5000, // poll every 5s to detect cashier confirmation
  });
```

**Page:**
```tsx
'use client';
export default function RedemptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: redemption } = useRedemption(id);

  const handleDone = async () => {
    if (redemption?.status === 'pending') {
      // Cancel if not yet confirmed — refunds points
      await api.patch(`/redemptions/${redemption.code}/cancel`);
      queryClient.invalidateQueries({ queryKey: ['loyalty-card'] });
    }
    router.replace('/');
  };

  const handleExpired = () => {
    // Timer ran out locally — invalidate to get refund confirmation
    queryClient.invalidateQueries({ queryKey: ['loyalty-card'] });
    queryClient.invalidateQueries({ queryKey: ['redemption', id] });
  };

  return (
    <>
      <TopAppBar variant="redemption" />
      <RedemptionScreen
        rewardName={redemption?.rewardName ?? ''}
        code={redemption?.code ?? ''}
        qrData={redemption?.qrData ?? ''}
        expiresAt={redemption?.expiresAt ?? ''}
        status={redemption?.status ?? 'pending'}
        onDone={handleDone}
      />
      {redemption?.status === 'pending' && (
        <CountdownTimer expiresAt={redemption.expiresAt} onExpired={handleExpired} />
      )}
    </>
  );
}
```

**Confirm dialog on Done while pending:**
Show a confirmation before cancelling: "Your code hasn't been confirmed yet. Return to home? Your points will be refunded."

### Acceptance criteria
- [ ] Page loads with real redemption data from API
- [ ] Countdown timer shown and counts down in real time
- [ ] On expiry: timer triggers `handleExpired`, UI switches to expired state
- [ ] "Done" while pending: shows confirmation dialog → on confirm, cancels redemption + navigates home
- [ ] "Done" after confirmed (cashier confirmed): navigates home, no cancellation
- [ ] Balance refreshes on home screen after returning from redemption

### Definition of done
- [ ] `yarn build` passes
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings
