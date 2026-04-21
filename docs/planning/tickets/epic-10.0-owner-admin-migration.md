# Epic 10.0 — Owner Admin Migration to Unified React App

Moves the business owner admin panel out of the Next.js frontend and into the standalone `admin/` React app alongside the super admin panel. After this epic, a single React app (Vite + React + TypeScript) serves both `superadmin` and `owner` roles. Login is shared; role determines routing and sidebar.

> Epic 10.0 must be completed before starting Epic 10 (super admin features). ADMIN-01 and ADMIN-02 from Epic 10 are **absorbed here** and extended to support both roles from day one.

**Depends on:** Epic 8 (all Done — owner admin is fully working in Next.js)  
**Blocks:** Epic 10 (ADMIN-03, ADMIN-04, ADMIN-05, B-36)

---

## Dependency Graph

```
ADMIN-0-01 (scaffold)
  └─ ADMIN-0-02 (login)
       └─ ADMIN-0-03 (layout shell)
            ├─ ADMIN-0-04 (dashboard)
            ├─ ADMIN-0-05 (rewards)
            ├─ ADMIN-0-06 (settings)
            ├─ ADMIN-0-07 (customers)
            └─ ADMIN-0-08 (cashier mgmt)
                 └─ ADMIN-0-09 (remove from Next.js) [waits for all 04–08]
```

Epic 10 (ADMIN-03, ADMIN-04, ADMIN-05, B-36) can start in parallel once `ADMIN-0-02` is done.

---

## ADMIN-0-01 — React App Scaffold (Multi-Role)

*(Absorbs and replaces Epic 10's ADMIN-01)*

**SP:** 3 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** nothing  
**Blocks:** ADMIN-0-02 through ADMIN-0-09

### Description

Bootstrap the `admin/` Vite + React app. Routing must accommodate both superadmin paths (`/businesses/*`) and owner paths (`/owner/*`) from the start.

### Files to create

```
admin/
├── index.html
├── vite.config.ts          ← port 3001
├── tsconfig.json
├── package.json
├── tailwind.config.ts      ← copy theme.extend from frontend/tailwind.config.cjs
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx              ← router with role-based root redirect
    ├── lib/
    │   ├── api-client.ts    ← native fetch wrapper (port from frontend/src/lib/api-client.ts, strip Next.js-specific parts)
    │   ├── token-storage.ts ← localStorage under key 'admin_auth_session'
    │   └── query-client.ts
    ├── stores/
    │   └── auth-store.ts    ← Zustand: { token, refreshToken, tokenExpires, role, setSession, clearSession }
    ├── providers/
    │   └── app-providers.tsx
    ├── components/
    │   └── protected-route.tsx
    └── routes/
        ├── index.tsx        ← route definitions
        ├── login/page.tsx
        ├── businesses/page.tsx      ← placeholder (Epic 10)
        └── owner/
            ├── dashboard/page.tsx   ← placeholder
            ├── rewards/page.tsx     ← placeholder
            ├── settings/page.tsx    ← placeholder
            ├── customers/page.tsx   ← placeholder
            └── team/page.tsx        ← placeholder
```

### Implementation notes

**`ProtectedRoute`:**
```tsx
interface ProtectedRouteProps {
  allowedRoles: ('superadmin' | 'owner')[];
  children: ReactNode;
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { role } = useAuthStore();
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
};
```

**Root redirect in `App.tsx`:**
```tsx
function RootRedirect() {
  const { role } = useAuthStore();
  if (role === 'superadmin') return <Navigate to="/businesses" replace />;
  if (role === 'owner') return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/login" replace />;
}
```

**`api-client.ts`:** Port `frontend/src/lib/api-client.ts`. Remove all `typeof window` guards, `next/headers` imports, and `NextFetchRequestConfig` references. Token read from Zustand store via `useAuthStore.getState().token`.

**`tailwind.config.ts`:** Copy the full `theme.extend` block from `frontend/tailwind.config.cjs` (Material Design 3 color tokens, Inter/Plus Jakarta Sans/Be Vietnam Pro font families, border radius scale).

**`package.json` key deps:**
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@tanstack/react-query": "^5",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "zod": "^3",
    "zustand": "^4",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "vite": "^5",
    "@vitejs/plugin-react": "^4",
    "typescript": "^5",
    "tailwindcss": "^3",
    "autoprefixer": "^10"
  }
}
```

**`vite.config.ts`:**
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3001 },
});
```

### Acceptance criteria
- [ ] `npm run dev` starts on port 3001
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `/login` renders; unauthenticated access to `/owner/*` or `/businesses/*` redirects to `/login`
- [ ] Tailwind design tokens (colors, fonts) match the main frontend

### Definition of done
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds

---

## ADMIN-0-02 — Unified Login Page (superadmin + owner)

*(Absorbs and replaces Epic 10's ADMIN-02)*

**SP:** 2 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** ADMIN-0-01  
**Blocks:** ADMIN-0-03 through ADMIN-0-09, ADMIN-03 (Epic 10)

### Description

Email + password login form. Accepts both `superadmin` and `owner` roles. After successful login, decodes the JWT role and redirects to the appropriate section. Rejects `customer` and `cashier` roles with a clear error.

### Files to create

- `admin/src/routes/login/page.tsx`
- `admin/src/features/auth/api/login.ts`
- `admin/src/features/auth/hooks/use-login.ts`

### Implementation notes

**Login function (`api/login.ts`):**
```ts
export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post<{ token: string; refreshToken: string; tokenExpires: number }>(
    '/auth/email/login',
    credentials,
  );
  const payload = JSON.parse(atob(response.token.split('.')[1]));
  const role = (payload.role?.name ?? payload.role)?.toLowerCase() as string;
  if (role !== 'superadmin' && role !== 'owner') {
    throw new Error('Access denied: not an admin account');
  }
  useAuthStore.getState().setSession(response.token, response.refreshToken, response.tokenExpires, role);
  return role as 'superadmin' | 'owner';
};
```

**Hook (`hooks/use-login.ts`):**
```ts
export const useLogin = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: login,
    onSuccess: (role) => {
      navigate(role === 'superadmin' ? '/businesses' : '/owner/dashboard', { replace: true });
    },
  });
};
```

**Login page:**
```tsx
export default function LoginPage() {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const { mutate, isPending, error } = useLogin();
  const { role } = useAuthStore();
  if (role) return <RootRedirect />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-sm p-8 bg-surface-container-lowest rounded-xl shadow-lg">
        <h1 className="font-headline text-2xl font-bold mb-6">Admin Login</h1>
        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4">
          <input type="email" placeholder="Email" {...register('email', { required: true })}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface" />
          <input type="password" placeholder="Password" {...register('password', { required: true })}
            className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface" />
          {error && <p className="text-error text-sm">{(error as Error).message}</p>}
          <button type="submit" disabled={isPending}
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-60">
            {isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Acceptance criteria
- [ ] Owner credentials → redirected to `/owner/dashboard`
- [ ] Superadmin credentials → redirected to `/businesses`
- [ ] Customer/cashier credentials → "Access denied: not an admin account" error shown
- [ ] Already-authenticated users redirected away from `/login` based on role
- [ ] Form validates email format before submit

### Definition of done
- [ ] `npm run typecheck` passes
- [ ] Manual test: owner login → `/owner/dashboard`; superadmin login → `/businesses`

---

## ADMIN-0-03 — Role-Based Layout Shell

**SP:** 3 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** ADMIN-0-02  
**Blocks:** ADMIN-0-04 through ADMIN-0-08

### Description

Two layout components wrapping their route sections. Port the owner layout from `frontend/src/app/owner/_components/owner-layout.tsx` — strip Next.js-specific APIs, inline English strings.

### Files to create

- `admin/src/components/layouts/owner-layout.tsx`
- `admin/src/components/layouts/super-admin-layout.tsx`

### Implementation notes

**Owner sidebar nav:**
| Label | Icon (lucide-react) | Route |
|---|---|---|
| Dashboard | `LayoutDashboard` | `/owner/dashboard` |
| Rewards | `Gift` | `/owner/rewards` |
| Customers | `Users` | `/owner/customers` |
| Team | `UserCheck` | `/owner/team` |
| Settings | `Settings` | `/owner/settings` |

**Porting changes from Next.js owner-layout:**
- `import Link from 'next/link'` → `import { Link } from 'react-router-dom'`
- `usePathname()` → `useLocation()` from `react-router-dom`; active check: `location.pathname.startsWith(item.href)`
- `useTranslations('admin.nav')` → hardcoded English label strings
- `useRouter().push('/owner/login')` → `useNavigate()('/login')`

**Shared logout:**
```ts
const handleLogout = async () => {
  await api.post('/auth/logout').catch(() => {});
  useAuthStore.getState().clearSession();
  navigate('/login', { replace: true });
};
```

**SuperAdminLayout:** Minimal — top bar with "Super Admin" title and logout; single sidebar link "Businesses" → `/businesses`. This layout will grow in Epic 10.

**Route wiring in `routes/index.tsx`:**
```tsx
<Route element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout /></ProtectedRoute>}>
  <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
  <Route path="/owner/rewards/*" element={<OwnerRewardsPage />} />
  <Route path="/owner/settings" element={<OwnerSettingsPage />} />
  <Route path="/owner/customers" element={<OwnerCustomersPage />} />
  <Route path="/owner/team" element={<OwnerTeamPage />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout /></ProtectedRoute>}>
  <Route path="/businesses/*" element={<BusinessesPage />} />
</Route>
```

### Acceptance criteria
- [ ] Owner routes render inside `OwnerLayout` with correct sidebar
- [ ] Active nav item highlighted based on current path
- [ ] Logout clears tokens and returns to `/login`
- [ ] Mobile: hamburger menu opens sidebar drawer

### Definition of done
- [ ] `npm run typecheck` passes
- [ ] Manual test: navigate between owner sections; active state updates correctly

---

## ADMIN-0-04 — Migrate Owner Dashboard Metrics

**SP:** 3 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** ADMIN-0-03  
**Blocks:** nothing

### Description

Port the analytics dashboard page from the Next.js frontend.

### Source → destination mapping

| Source (frontend) | Destination (admin) |
|---|---|
| `src/features/owner-analytics/dashboard-metrics.tsx` | `src/features/owner-analytics/components/dashboard-metrics.tsx` |
| `src/features/owner-analytics/kpi-card.tsx` | `src/features/owner-analytics/components/kpi-card.tsx` |
| `src/features/owner-analytics/api/get-dashboard.ts` | `src/features/owner-analytics/api/get-dashboard.ts` |
| `src/app/owner/(protected)/dashboard/page.tsx` | `src/routes/owner/dashboard/page.tsx` |

### Porting notes

- Remove `useTranslations` / `next-intl` → inline English strings (e.g. `"Total Customers"`, `"Transactions Today"`)
- Remove `next/navigation` imports — no navigation needed on this page
- API hook uses admin app's `api-client.ts`; query shape (`GET /analytics/dashboard`) unchanged

### Acceptance criteria
- [ ] `/owner/dashboard` renders all 5 KPI cards with live data
- [ ] Data auto-refreshes every 60s (`refetchInterval: 60_000`)
- [ ] Loading skeleton shown on first fetch
- [ ] Non-owner role cannot access route (ProtectedRoute blocks at layout level)

### Definition of done
- [ ] `npm run typecheck` passes

---

## ADMIN-0-05 — Migrate Reward Management UI

**SP:** 5 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** ADMIN-0-03  
**Blocks:** nothing

### Description

Port the full reward CRUD interface.

### Source → destination mapping

| Source (frontend) | Destination (admin) |
|---|---|
| `src/features/owner-rewards/` (all files) | `src/features/owner-rewards/` |
| `src/app/owner/(protected)/rewards/page.tsx` | `src/routes/owner/rewards/page.tsx` |
| rewards new/edit pages | `src/routes/owner/rewards/new/page.tsx`, `src/routes/owner/rewards/:id/edit/page.tsx` |

### Routes in admin app

- `/owner/rewards` — list
- `/owner/rewards/new` — create form
- `/owner/rewards/:id/edit` — edit form

### Porting notes

- Remove `next-intl`; inline English strings
- `useRouter()` → `useNavigate()`; `useParams()` from `react-router-dom`
- Image upload: same `POST /api/v1/files/upload` pattern; no change

### Acceptance criteria
- [ ] List shows all rewards (active + inactive) with toggle
- [ ] Create/edit form validates before submit
- [ ] Delete shows confirm dialog; reward removed from list immediately
- [ ] Image upload preview works

### Definition of done
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes

---

## ADMIN-0-06 — Migrate Earn Rate Settings UI

**SP:** 2 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** ADMIN-0-03  
**Blocks:** nothing

### Description

Port the earn rate settings form.

### Source → destination mapping

| Source (frontend) | Destination (admin) |
|---|---|
| `src/features/owner-settings/` (earn-rate relevant files) | `src/features/owner-settings/` |
| `src/app/owner/(protected)/settings/page.tsx` | `src/routes/owner/settings/page.tsx` |

### Porting notes

Remove `next-intl`; use hardcoded English labels: `"Earn rate mode"`, `"AMD per point"`, `"Points per visit"`, `"Save settings"`, `"Settings saved"`.

### Acceptance criteria
- [ ] Current settings pre-filled from `GET /businesses/me`
- [ ] Mode selector updates the label for the value field
- [ ] Save shows success confirmation
- [ ] `earnRateValue` validated as integer ≥ 1

### Definition of done
- [ ] `npm run typecheck` passes

---

## ADMIN-0-07 — Migrate Top Customers List

**SP:** 2 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** ADMIN-0-03  
**Blocks:** nothing

### Description

Port the paginated top customers table.

### Source → destination mapping

| Source (frontend) | Destination (admin) |
|---|---|
| `src/features/owner-analytics/top-customers-table.tsx` | `src/features/owner-analytics/components/top-customers-table.tsx` |
| `src/features/owner-analytics/api/get-top-customers.ts` | `src/features/owner-analytics/api/get-top-customers.ts` |
| `src/app/owner/(protected)/customers/page.tsx` | `src/routes/owner/customers/page.tsx` |

### Porting notes

- Remove `next-intl`; inline English column headers
- No navigation hooks needed on this page

### Acceptance criteria
- [ ] Table sorted by total earned DESC (server-side)
- [ ] Rank number continues correctly across pages
- [ ] Pagination shows correct total count
- [ ] Empty state shown if no customers yet

### Definition of done
- [ ] `npm run typecheck` passes

---

## ADMIN-0-08 — Migrate Cashier Management UI

**SP:** 3 | **Layer:** ADMIN | **Status:** Todo  
**Depends on:** ADMIN-0-03  
**Blocks:** nothing

### Description

Port the cashier list + create/deactivate UI.

### Source → destination mapping

| Source (frontend) | Destination (admin) |
|---|---|
| `src/features/owner-team/` (all files) | `src/features/owner-team/` |
| `src/app/owner/(protected)/team/page.tsx` | `src/routes/owner/team/page.tsx` |

### Porting notes

- Remove `next-intl`; inline English strings
- No router navigation needed on this page

### Acceptance criteria
- [ ] List shows all cashiers (active + inactive) with status badge
- [ ] Create form: all required fields validated before submit
- [ ] Invite email confirmation shown after successful creation
- [ ] Deactivate shows confirmation dialog; cashier shows inactive badge after

### Definition of done
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes

---

## ADMIN-0-09 — Remove Owner Routes from Next.js Frontend

**SP:** 2 | **Layer:** FE | **Status:** Todo  
**Depends on:** ADMIN-0-04, ADMIN-0-05, ADMIN-0-06, ADMIN-0-07, ADMIN-0-08  
**Blocks:** nothing

### Description

Clean up the Next.js frontend once all owner features are live and verified in the admin app.

### Files to delete

- `frontend/src/app/owner/` — entire directory (login page, protected layout, all 5 pages, `_components/`)
- `frontend/src/features/owner-auth/`
- `frontend/src/features/owner-analytics/`
- `frontend/src/features/owner-rewards/`
- `frontend/src/features/owner-settings/`
- `frontend/src/features/owner-team/`

### Files to update

- `frontend/src/config/paths.ts` — remove `owner` section
- `frontend/messages/en.json` — remove `admin` namespace
- `frontend/messages/ru.json` — remove `admin` namespace
- `frontend/CLAUDE.md` — remove owner admin references from route map

### Acceptance criteria
- [ ] `yarn build` passes in frontend after deletion
- [ ] `yarn check-types` passes with 0 errors
- [ ] No broken imports referencing deleted files
- [ ] `admin` namespace removed from both locale files

### Definition of done
- [ ] `yarn build` passes
- [ ] `yarn check-types` passes
