# Epic 1 — Foundation & Project Setup

All other epics are blocked until this epic is complete. Tickets F-01–F-03 have no dependencies and can start immediately. B-01 and B-02 can run in parallel with FE tickets.

---

## F-01 — Tailwind Design Tokens

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** nothing
**Blocks:** F-02, F-03, F-05, F-06, F-07, F-08, F-10, F-11, F-14, F-15

### Description
Configure all custom design tokens in the Tailwind config — colors, font families, and border radius — so every component can reference them by name rather than raw hex values. All values come directly from the design system defined in the HTML prototypes.

### Files to modify
- `frontend/tailwind.config.cjs` — add colors, fontFamily, borderRadius extensions

### Implementation notes
Copy the `tailwind.config` block from `docs/design/Home:My Card/code.html` (lines 12–73). The config already contains the full token set. Merge into the existing `tailwind.config.cjs` under `theme.extend`.

Key token groups:
- **Colors (30+):** `primary`, `primary-container`, `secondary`, `secondary-fixed`, `tertiary`, `tertiary-fixed`, `surface`, `surface-container-low`, `surface-container-highest`, `on-background`, `on-surface`, `on-surface-variant`, `error`, `outline-variant`, etc.
- **Font families:** `headline` → `Plus Jakarta Sans`, `body` → `Be Vietnam Pro`, `label` → `Inter`
- **Border radius:** `DEFAULT: 1rem`, `lg: 2rem`, `xl: 3rem`, `full: 9999px`

Also add Google Fonts import to `frontend/src/app/layout.tsx`:
```
Plus Jakarta Sans: wght@400;600;700;800
Be Vietnam Pro: wght@400;500;600
Inter: wght@400;500;600
Material Symbols Outlined: wght,FILL@100..700,0..1
```

Add `.glass-card` CSS class to global styles:
```css
.glass-card {
  background: linear-gradient(135deg, #005f9e 0%, #1278c3 100%);
  position: relative;
  overflow: hidden;
}
.glass-card::before {
  content: '';
  position: absolute;
  top: -50%; right: -20%;
  width: 80%; height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(30deg);
}
.no-scrollbar::-webkit-scrollbar { display: none; }
```

### Acceptance criteria
- [ ] All 30+ custom color tokens available via `text-primary`, `bg-surface-container-low`, etc.
- [ ] `font-headline`, `font-body`, `font-label` utility classes apply correct fonts
- [ ] `rounded-xl` = 3rem, `rounded-lg` = 2rem, `rounded-DEFAULT` = 1rem
- [ ] Google Fonts load in the app (check Network tab)
- [ ] `glass-card` class applies the gradient background
- [ ] No raw hex values needed in any component for design system colors

### Definition of done
- [ ] `yarn build` passes with no type errors
- [ ] `yarn lint` passes
- [ ] Storybook renders correctly with new tokens (if Storybook is running)

---

## F-02 — TopAppBar Shared Component

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-09, F-13, F-20 (all pages need the nav)

### Description
Create a reusable `TopAppBar` component that appears at the top of all 4 customer screens. It has a glassmorphism background, the BEER HOUSE logo on the left, and user avatar + optional notification icon on the right. Three layout variants are needed.

### Files to create
- `frontend/src/components/ui/top-app-bar/top-app-bar.tsx`
- `frontend/src/components/ui/top-app-bar/top-app-bar.stories.tsx`
- `frontend/src/components/ui/top-app-bar/index.ts`

### Implementation notes
Follow the **Simple** component pattern from `.claude/rules/components-layer.md`.

```tsx
interface TopAppBarProps {
  variant?: 'home' | 'catalog' | 'redemption';
  avatarUrl?: string;
  onNotificationClick?: () => void;
}
```

Styling (from `docs/design/Home:My Card/code.html` line 104):
```
bg-white/80 backdrop-blur-xl flex items-center justify-between w-full px-6 py-4 fixed top-0 z-50
```

- **`home` variant:** logo (sports_bar icon + "BEER HOUSE" text) + notification bell + avatar
- **`catalog` variant:** menu icon + "BEER HOUSE" text + avatar
- **`redemption` variant:** close `X` button + "BEER HOUSE" text + avatar

Use `material-symbols-outlined` for icons (already loaded via F-01 fonts).

Avatar is a `w-10 h-10 rounded-full` image with `border-2 border-primary-container/20`.

All text must use `useTranslations('common')` — add key `appName: "BEER HOUSE"` to both `messages/en.json` and `messages/ru.json`.

Mark as `'use client'` (uses onClick handlers).

### Acceptance criteria
- [ ] Glassmorphism background visible (blur effect over content below)
- [ ] Fixed at top, correct z-index (doesn't disappear behind content)
- [ ] All 3 variants render correctly
- [ ] Avatar renders with fallback (initials or placeholder) when `avatarUrl` is undefined
- [ ] Notification icon only shown on `home` variant
- [ ] Close button only shown on `redemption` variant
- [ ] `onNotificationClick` fires on bell tap

### Definition of done
- [ ] Component in `src/components/ui/top-app-bar/` with `index.ts` export
- [ ] Storybook story covers all 3 variants
- [ ] `yarn check-types` passes
- [ ] No hardcoded strings — uses `useTranslations`

---

## F-03 — BottomNavBar Shared Component

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** F-01
**Blocks:** F-09, F-13, F-20

### Description
Create the sticky bottom navigation bar used on 3 of the 4 screens (not Redemption). Three tabs: Home, Rewards, History. Active tab shows a filled pill highlight; inactive tabs are grey.

### Files to create
- `frontend/src/components/ui/bottom-nav-bar/bottom-nav-bar.tsx`
- `frontend/src/components/ui/bottom-nav-bar/bottom-nav-bar.stories.tsx`
- `frontend/src/components/ui/bottom-nav-bar/index.ts`

### Implementation notes
Follow Simple component pattern. Use Next.js `usePathname()` to determine active tab.

```tsx
// No props needed — reads active route from pathname
export function BottomNavBar() { ... }
```

Styling (from `docs/design/Home:My Card/code.html` line 224):
```
fixed bottom-0 left-0 w-full z-50 flex justify-around items-center
px-4 pb-8 pt-4 bg-white/90 backdrop-blur-2xl rounded-t-[3rem]
shadow-[0_-4px_20px_rgba(0,0,0,0.05)]
```

Active tab pill:
```
bg-blue-50 text-blue-700 rounded-full px-5 py-2 scale-110
```

Inactive tab:
```
text-slate-400 px-5 py-2 hover:text-blue-500 transition-colors
```

Tabs and routes:
| Tab | Icon | Route |
|-----|------|-------|
| Home | `home` (FILL 1 when active) | `/` |
| Rewards | `redeem` (FILL 1 when active) | `/rewards` |
| History | `history` (FILL 1 when active) | `/history` |

Add i18n keys to `common` namespace: `nav.home`, `nav.rewards`, `nav.history`.

Mark as `'use client'` (uses `usePathname`).

### Acceptance criteria
- [ ] Active tab shows blue pill background + filled icon
- [ ] Inactive tabs grey, no background
- [ ] Navigates to correct route on tap
- [ ] Fixed at bottom, doesn't overlap content (page must have `pb-32` padding)
- [ ] Rounded top corners (`rounded-t-[3rem]`) visible
- [ ] Glassmorphism background (blur effect)

### Definition of done
- [ ] Component in `src/components/ui/bottom-nav-bar/` with `index.ts`
- [ ] Storybook story shows all 3 active states
- [ ] `yarn check-types` passes
- [ ] Uses `useTranslations('common')` for tab labels

---

## F-04 — Telegram Mini App Initialization & Auth

**SP:** 5 | **Layer:** FE | **Status:** Todo
**Depends on:** B-01
**Blocks:** All pages that show customer data

### Description
Initialize the Telegram Mini App SDK on app load, extract `initData`, call `POST /api/v1/auth/telegram` to authenticate, and store the JWT for all subsequent API calls. Handle first-time users (phone contact request) and returning users (silent re-auth).

### Files to create/modify
- `frontend/src/features/auth/api/telegram-auth.ts` — API call + hook
- `frontend/src/features/auth/hooks/use-telegram-auth.ts` — initialization logic
- `frontend/src/app/(app)/layout.tsx` — call auth on mount
- `frontend/src/lib/api-client.ts` — ensure Authorization header is attached
- `frontend/package.json` — add `@twa-dev/sdk`

### Implementation notes

**1. Install SDK:**
```bash
yarn add @twa-dev/sdk
```

**2. API call (`telegram-auth.ts`):**
```ts
import { api } from '@/lib/api-client';

export const telegramAuth = (initData: string) =>
  api.post('/auth/telegram', { initData });

export const useTelegramAuth = () =>
  useMutation({ mutationFn: telegramAuth });
```

**3. Initialization hook (`use-telegram-auth.ts`):**
```ts
'use client';
import WebApp from '@twa-dev/sdk';

export function useTelegramAuth() {
  useEffect(() => {
    WebApp.ready(); // tells Telegram the app is ready
    const initData = WebApp.initData;
    // call POST /auth/telegram with initData
    // on first open: WebApp.requestContact() if no phone yet
    // store token in memory / zustand store
  }, []);
}
```

**4. Token storage:**
Use a Zustand store (`src/stores/auth-store.ts`):
```ts
interface AuthStore {
  token: string | null;
  setToken: (token: string) => void;
}
```
Do NOT use `localStorage` — Mini App context resets between sessions anyway.

**5. API client auth header:**
Attach token from Zustand store to every request in `api-client.ts` interceptor.

**6. First-time flow:**
- Check if `isNew: true` in auth response
- If yes, call `WebApp.requestContact()` to prompt phone sharing
- After contact share, user is already registered (backend created card on first call)

**7. Error state:**
- If `initData` is missing (running in browser, not Telegram): show "Please open via Telegram" message
- If auth fails: show error screen, not a broken app

### Acceptance criteria
- [ ] App authenticates automatically on first load inside Telegram
- [ ] `WebApp.ready()` called so Telegram hides the loading screen
- [ ] Phone contact is requested on first-time open only
- [ ] JWT stored in Zustand store, attached to all API requests
- [ ] Returning user: no contact prompt, silent re-auth
- [ ] Running outside Telegram: graceful error message shown
- [ ] Auth errors (invalid initData) show an error screen

### Definition of done
- [ ] `@twa-dev/sdk` in `package.json`
- [ ] Zustand auth store created in `src/stores/auth-store.ts`
- [ ] API client attaches `Authorization: Bearer <token>` on every request
- [ ] `yarn check-types` passes
- [ ] `yarn build` passes

---

## B-01 — Telegram initData JWT Auth Strategy

**SP:** 5 | **Layer:** BE | **Status:** Todo
**Depends on:** nothing (BE)
**Blocks:** All authenticated BE endpoints

### Description
Implement `POST /api/v1/auth/telegram` endpoint that validates the Telegram `initData` HMAC signature, creates or fetches the user + loyalty card, and returns a JWT with the full payload needed for all subsequent requests.

### Files to create/modify
- `backend/src/auth/strategies/telegram.strategy.ts` — Passport strategy
- `backend/src/auth/auth.controller.ts` — add `POST /auth/telegram` route
- `backend/src/auth/auth.service.ts` — add `loginWithTelegram()` method
- `backend/src/auth/dto/auth-telegram-login.dto.ts` — request DTO
- `backend/src/auth/dto/auth-telegram-response.dto.ts` — response DTO

### Implementation notes

**1. HMAC validation:**
```ts
import * as crypto from 'crypto';

function validateTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return computedHash === hash;
}
```

**2. JWT payload shape:**
```ts
{
  sub: userId,           // internal UUID
  role: 'customer',
  businessId: string,    // from URL context or initData startParam
  cardId: string,        // UUID of the LoyaltyCard
  telegramId: number,
}
```

**3. `loginWithTelegram()` service flow:**
1. Parse `initData` → extract `user` object (telegramId, first_name, last_name, phone_number if shared)
2. Validate HMAC (throw `UnprocessableEntityException` if invalid)
3. Check auth_date freshness (reject if >5 minutes old)
4. `findOrCreate` user by `telegramId`
5. If new user: create `LoyaltyCard` for the business (businessId from Mini App startParam)
6. Issue JWT with full payload

**4. BusinessId resolution:**
The Mini App is opened from a business-specific QR. The QR encodes `?startapp=businessId`. Extract from `initData.start_param`.

**5. Reference implementation:**
Follow pattern in `backend/src/auth/auth.service.ts` (existing email login). See `backend/docs/auth.md` for JWT flow.

**6. Error keys (i18n):**
- `{ errors: { initData: 'invalidOrExpired' } }` — invalid HMAC or stale auth_date
- `{ errors: { business: 'notFound' } }` — businessId not found

### Acceptance criteria
- [ ] Valid `initData` returns 201 with `token`, `refreshToken`, `tokenExpires`, `user`, `card`
- [ ] `isNew: true` in response for first-time users
- [ ] Invalid HMAC returns 422 with correct error key
- [ ] `auth_date` older than 5 minutes returns 422
- [ ] New user: `User` + `LoyaltyCard` created in DB
- [ ] Existing user: existing card returned, no duplicate created
- [ ] JWT contains `sub`, `role`, `businessId`, `cardId`, `telegramId`

### Definition of done
- [ ] Unit test: `auth.service.spec.ts` covers valid initData, invalid HMAC, stale timestamp, new user, existing user
- [ ] `npm run lint` passes
- [ ] `npm run test` passes

---

## B-02 — Email Login, Refresh & Logout Endpoints

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** nothing
**Blocks:** Owner admin panel, Super admin panel

### Description
Wire up email/password authentication for Business Owner and Super Admin roles. The NestJS boilerplate already has most of this — the work is adding role validation and ensuring the JWT payload matches our spec.

### Files to modify
- `backend/src/auth/auth.service.ts` — ensure `loginWithEmail()` returns `businessId` in JWT for owner role
- `backend/src/auth/strategies/jwt.strategy.ts` — validate payload contains `role`
- `backend/src/roles/roles.enum.ts` — add `owner`, `cashier`, `superadmin` roles (alongside existing `user`, `admin`)
- `backend/src/auth/guards/roles.guard.ts` — verify guard handles new roles

### Implementation notes

**Roles enum:**
```ts
export enum RoleEnum {
  user = 1,
  admin = 2,
  owner = 3,
  cashier = 4,
  superadmin = 5,
}
```

**Owner JWT payload (email login):**
```json
{
  "sub": "uuid",
  "role": "owner",
  "businessId": "uuid"
}
```

**Super Admin JWT payload:**
```json
{
  "sub": "uuid",
  "role": "superadmin"
}
```

Existing boilerplate endpoints to verify work correctly:
- `POST /api/v1/auth/email/login` — use as-is, ensure businessId injected for owner
- `POST /api/v1/auth/refresh` — no changes needed
- `POST /api/v1/auth/logout` — no changes needed

### Acceptance criteria
- [ ] Owner login returns JWT with `role: 'owner'` and `businessId`
- [ ] Super admin login returns JWT with `role: 'superadmin'`
- [ ] Wrong password returns 422 with `{ errors: { password: 'incorrect' } }`
- [ ] Unknown email returns 422 with `{ errors: { email: 'notFound' } }`
- [ ] Refresh token flow works (new token issued, old refresh invalidated)
- [ ] Logout invalidates session

### Definition of done
- [ ] Existing boilerplate auth tests still pass
- [ ] New role enum values seeded in DB
- [ ] `npm run lint` passes
