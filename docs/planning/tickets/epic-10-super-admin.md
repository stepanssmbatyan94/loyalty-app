# Epic 10 — Super Admin Panel (Separate React App)

Standalone React application (Vite + React + TypeScript) for the platform super admin to create and manage business accounts. This is a completely separate app from the customer Mini App — it lives in the `admin/` folder of the monorepo and is deployed independently.

> ⚠️ No screen design provided for this panel. Implement clean, functional UI using the same Tailwind design tokens as the main app. No Telegram integration — standard email+password auth only.

> **Depends on Epic 10.0:** ADMIN-01 (App Scaffold) and ADMIN-02 (Login Page) have been moved to **[Epic 10.0](epic-10.0-owner-admin-migration.md)** and extended to support both `superadmin` and `owner` roles. Complete Epic 10.0 before starting this epic — the `admin/` app and unified login will already exist.

**Super Admin can:**
- View all businesses on the platform
- Create new business accounts (which auto-provisions: owner user, loyalty card template, bot webhook)
- View/edit business details and deactivate businesses
- Log in via email + password (shared login with owner — role determines routing)

---

## ADMIN-03 — Businesses List Page

**SP:** 3 | **Layer:** ADMIN | **Status:** Done
**Depends on:** ADMIN-0-02 (Epic 10.0), B-36
**Blocks:** ADMIN-05

### Description
Paginated table of all businesses on the platform with key details and status indicator. Primary landing page after login.

### Files to create
- `admin/src/routes/businesses/page.tsx`
- `admin/src/features/businesses/api/get-businesses.ts`
- `admin/src/features/businesses/components/business-table.tsx`

### Implementation notes

**Query hook:**
```ts
export const useBusinesses = (page: number) =>
  useQuery({
    queryKey: ['admin-businesses', page],
    queryFn: () =>
      api.get<{ data: Business[]; meta: PaginationMeta }>('/admin/businesses', {
        params: { page, limit: 20 },
      }),
  });
```

**Table columns:**
| Name | Owner | Plan | Status | Bot Connected | Created | Actions |

**Status badge:**
```tsx
<span className={cn(
  'px-2 py-1 rounded-full text-xs font-bold',
  business.isActive
    ? 'bg-tertiary/10 text-tertiary'
    : 'bg-error/10 text-error',
)}>
  {business.isActive ? 'Active' : 'Inactive'}
</span>
```

**Bot connected indicator:** Green check icon if `botToken` is set, amber warning icon if not.

**Actions column:** "View" link → `/businesses/:id` | "Deactivate" button (with confirm dialog)

**Page layout:**
```tsx
export default function BusinessesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBusinesses(page);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-headline text-2xl font-bold">Businesses</h1>
        <Link to="/businesses/new">
          <button className="px-4 py-2 bg-primary text-white rounded-lg font-bold">
            + New Business
          </button>
        </Link>
      </div>
      {isLoading ? <TableSkeleton /> : <BusinessTable businesses={data.data} />}
      <Pagination meta={data?.meta} page={page} onChange={setPage} />
    </div>
  );
}
```

### Acceptance criteria
- [x] Table shows all businesses with all 7 columns
- [x] Pagination works correctly
- [x] "New Business" button navigates to create form
- [x] Row click or "View" link navigates to business detail
- [x] Status badge shows correct color per `isActive` field

### Definition of done
- [x] `npm run typecheck` passes
- [x] `npm run build` passes

---

## ADMIN-04 — Create Business Form

**SP:** 5 | **Layer:** ADMIN | **Status:** Done
**Depends on:** ADMIN-03, B-36
**Blocks:** nothing

### Description
Form to provision a new business on the platform. Creating a business also auto-creates the owner user account, registers the Telegram bot webhook, and sends credentials to the owner's email.

### Files to create
- `admin/src/routes/businesses/new/page.tsx`
- `admin/src/features/businesses/api/create-business.ts`
- `admin/src/features/businesses/components/create-business-form.tsx`

### Implementation notes

**Form fields:**

Section 1 — Business Info:
- Business Name (text, required)
- Logo URL (text, optional — for MVP)

Section 2 — Owner Account:
- Owner Full Name (text, required)
- Owner Email (email, required) — credentials will be emailed here
- Owner Phone (text, optional)

Section 3 — Telegram Bot:
- Bot Token (text, required) — from `@BotFather`
- Telegram Group Chat ID (text, required) — staff group where cashiers work
- Bot Username (text, required) — e.g. `beer_house_bot` (without @)

**Validation (Zod schema):**
```ts
const createBusinessSchema = z.object({
  name: z.string().min(2).max(100),
  logoUrl: z.string().url().optional().or(z.literal('')),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPhone: z.string().optional(),
  botToken: z.string().regex(/^\d+:[A-Za-z0-9_-]{35}$/,
    'Invalid bot token format (expected: 123456789:AABBcc...)'),
  telegramGroupChatId: z.string().regex(/^-?\d+$/, 'Must be a numeric chat ID'),
  botUsername: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{4,}$/,
    'Must be valid Telegram username without @'),
});
```

**Mutation hook:**
```ts
export const useCreateBusiness = () =>
  useMutation({
    mutationFn: (dto: CreateBusinessDto) => api.post('/admin/businesses', dto),
    onSuccess: (newBusiness) => {
      queryClient.invalidateQueries({ queryKey: ['admin-businesses'] });
      navigate(`/businesses/${newBusiness.id}`);
      toast.success('Business created! Owner credentials sent by email.');
    },
  });
```

**What the backend does on create (see B-36):**
1. Creates Business record with bot config
2. Creates owner User with random temp password
3. Sends email to owner with login URL + temp password
4. Registers bot webhook: `POST https://api.telegram.org/bot{token}/setWebhook`

**Form layout:** Two-column grid on wider screens, single column on mobile. Section dividers with labels.

### Acceptance criteria
- [x] All required fields validated before submit
- [x] Bot token format validated client-side
- [x] On success: redirected to new business detail page
- [x] Success toast: "Business created! Owner credentials sent by email."
- [x] API errors shown inline (e.g., "Email already in use")
- [x] Webhook registration failure surfaces as error (not silent)

### Definition of done
- [x] `npm run typecheck` passes
- [x] Manual test: create business → check email received → owner can log in

---

## ADMIN-05 — Business Detail Page

**SP:** 3 | **Layer:** ADMIN | **Status:** Done
**Depends on:** ADMIN-03, B-36
**Blocks:** nothing

### Description
View and edit a specific business's details. Shows all configuration fields, current stats summary, and allows super admin to deactivate/reactivate the business.

### Files to create
- `admin/src/routes/businesses/detail/page.tsx`
- `admin/src/features/businesses/api/get-business.ts`
- `admin/src/features/businesses/api/update-business.ts`

### Implementation notes

**Query hook:**
```ts
export const useBusiness = (id: string) =>
  useQuery({
    queryKey: ['admin-business', id],
    queryFn: () => api.get<Business>(`/admin/businesses/${id}`),
  });
```

**Update mutation:**
```ts
export const useUpdateBusiness = (id: string) =>
  useMutation({
    mutationFn: (dto: UpdateBusinessDto) => api.patch(`/admin/businesses/${id}`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-business', id] });
      toast.success('Business updated');
    },
  });
```

**Page sections:**

1. **Header** — Business name, status badge, Back to list link
2. **Business Info** — Inline editable fields: name, logo URL
3. **Telegram Config** — Read-only display of bot token (masked), group chat ID, bot username. "Re-register Webhook" button (calls `POST /admin/businesses/:id/webhook`)
4. **Owner Info** — Read-only: owner ID, registration date
5. **Danger Zone** — Deactivate / Reactivate toggle with confirm dialog

**Deactivate/reactivate:**
```ts
const handleDeactivate = async () => {
  if (!confirm('Deactivate this business? Owner and cashiers will lose access.')) return;
  await api.patch(`/admin/businesses/${id}`, { isActive: false });
  queryClient.invalidateQueries({ queryKey: ['admin-business', id] });
};
```

**Re-register Webhook button:** Useful when bot token changes.
```ts
const handleReregisterWebhook = () =>
  api.post(`/admin/businesses/${id}/webhook`).then(() => toast.success('Webhook re-registered'));
```

### Acceptance criteria
- [x] All business fields displayed correctly
- [x] Bot token masked in display (show only last 6 chars)
- [x] "Re-register Webhook" calls backend and shows success/error toast
- [x] Deactivate shows confirm dialog before proceeding
- [x] Deactivated businesses show reactivate button instead
- [x] Non-existent business ID shows 404 state

### Definition of done
- [x] `npm run typecheck` passes
- [x] `npm run build` passes

---

## B-36 — GET/POST /api/v1/admin/businesses

**SP:** 5 | **Layer:** BE | **Status:** Done
**Depends on:** B-03, B-02
**Blocks:** ADMIN-03, ADMIN-04, ADMIN-05

### Description
Super admin business management endpoints. `GET` returns paginated list of all businesses. `POST` provisions a new business including owner account creation, email send, and bot webhook registration.

### Files created
- `backend/src/admin/admin.module.ts`
- `backend/src/admin/admin.controller.ts`
- `backend/src/admin/admin.service.ts`
- `backend/src/admin/dto/create-business-admin.dto.ts`
- `backend/src/admin/dto/update-business-admin.dto.ts`

### Files modified
- `backend/src/businesses/businesses.service.ts` — added `findAllWithPagination`, `createForAdmin`
- `backend/src/businesses/infrastructure/persistence/business.repository.ts` — added `findAllWithPagination`
- `backend/src/businesses/infrastructure/persistence/relational/repositories/businesses.repository.ts` — implemented it
- `backend/src/users/users.service.ts` — added `createOwner`
- `backend/src/mail/mail.service.ts` — added `sendOwnerWelcome`
- `backend/src/mail/mail-templates/owner-welcome.hbs` — welcome email template
- `backend/src/app.module.ts` — registered `AdminModule`

### Acceptance criteria
- [x] `GET /admin/businesses` returns paginated businesses (superadmin only)
- [x] `POST /admin/businesses` creates business, owner, registers webhook, sends email
- [x] Owner receives credentials email
- [x] Duplicate email returns 422 with meaningful error
- [x] Non-superadmin role returns 403

### Definition of done
- [x] `npm run lint` passes
- [x] `npm run build` passes
