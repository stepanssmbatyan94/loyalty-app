# Next.js Loyalty App — Project Skill

Use this skill when adding features, reviewing code, or creating new modules in this codebase.

---

## 1. Dependency rules

The arrow points **inward** — outer layers depend on inner, never the reverse.

```
HTTP Request
     ↓
App Layer       (src/app/**  — pages, layouts, route groups)
     ↓
Features        (src/features/**  — self-contained product modules)
     ↓
Foundation      (src/lib/, src/hooks/, src/components/, src/config/)
     ↓
Core            (src/types/, src/utils/)
```

| Layer | Allowed imports | Forbidden |
|---|---|---|
| `src/app/**` | features, lib, components, config, types, utils | Direct cross-feature state sharing |
| `src/features/*/api/` | `@/lib/api-client`, `@/lib/react-query`, own feature types | Other features, raw `fetch()` |
| `src/features/*/components/` | Own feature api/hooks/types, `@/components/`, `@/lib/`, `@/types/` | Other features |
| `src/components/` | `@/lib/`, `@/types/`, `@/utils/`, `@/hooks/` | `@/features/` |
| `src/lib/` | `@/types/`, `@/utils/`, `@/config/` | `@/features/`, `@/components/` |

---

## 2. Feature module structure

```
src/features/{feature-name}/
├── api/
│   ├── get-{items}.ts          # queryOptions + useQuery hook
│   ├── create-{item}.ts        # useMutation hook
│   ├── update-{item}.ts        # useMutation hook
│   └── delete-{item}.ts        # useMutation hook
├── components/
│   ├── {item}-list.tsx          # List/table component
│   ├── {item}-card.tsx          # Individual item display
│   ├── create-{item}.tsx        # Form + drawer/modal
│   ├── update-{item}.tsx        # Form + drawer/modal
│   ├── delete-{item}.tsx        # Confirmation dialog
│   └── __tests__/
│       └── {component}.test.tsx
├── hooks/                       # Feature-specific hooks (optional)
├── types/
│   └── index.ts                 # TypeScript interfaces for this feature
└── utils/                       # Feature-specific utilities (optional)
```

---

## 3. API layer pattern

### Query (read data)

```typescript
// src/features/loyalty-cards/api/get-loyalty-card.ts
import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { LoyaltyCard } from '../types';

export const getLoyaltyCard = ({ id }: { id: string }): Promise<LoyaltyCard> => {
  return api.get(`/loyalty-cards/${id}`);
};

export const getLoyaltyCardQueryOptions = (id: string) => {
  return queryOptions({
    queryKey: ['loyalty-cards', id],
    queryFn: () => getLoyaltyCard({ id }),
  });
};

type UseLoyaltyCardOptions = {
  id: string;
  queryConfig?: QueryConfig<typeof getLoyaltyCard>;
};

export const useLoyaltyCard = ({ id, queryConfig }: UseLoyaltyCardOptions) => {
  return useQuery({
    ...getLoyaltyCardQueryOptions(id),
    ...queryConfig,
  });
};
```

### Mutation (write data)

```typescript
// src/features/loyalty-cards/api/add-points.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getLoyaltyCardsQueryOptions } from './get-loyalty-cards';

export type AddPointsDTO = {
  cardId: string;
  points: number;
  transactionNote?: string;
};

export const addPoints = (data: AddPointsDTO) => {
  return api.post(`/loyalty-cards/${data.cardId}/points`, {
    points: data.points,
    note: data.transactionNote,
  });
};

type UseAddPointsOptions = {
  mutationConfig?: MutationConfig<typeof addPoints>;
};

export const useAddPoints = ({ mutationConfig }: UseAddPointsOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      // Invalidate the loyalty cards list so UI reflects new points balance
      queryClient.invalidateQueries({ queryKey: getLoyaltyCardsQueryOptions().queryKey });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: addPoints,
  });
};
```

**Key rules:**
- One file per operation: `get-x.ts`, `create-x.ts`, `update-x.ts`, `delete-x.ts`
- Always export both the plain function (`addPoints`) and the hook (`useAddPoints`)
- Always export `getXQueryOptions()` — hooks and components use this for cache keys
- Always invalidate related queries on mutation success

---

## 4. Form pattern

```typescript
// src/features/loyalty-cards/components/add-points-form.tsx
'use client';

import { z } from 'zod';
import { Form, Input, Textarea } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { useAddPoints } from '../api/add-points';

// 1. Define schema next to the form that uses it
const addPointsSchema = z.object({
  points: z
    .number({ invalid_type_error: 'Points must be a number' })
    .int('Points must be a whole number')
    .positive('Points must be greater than zero')
    .max(1000, 'Cannot add more than 1000 points at once'),
  note: z.string().optional(),
});

type AddPointsValues = z.infer<typeof addPointsSchema>;

type AddPointsFormProps = {
  cardId: string;
  onSuccess?: () => void;
};

export function AddPointsForm({ cardId, onSuccess }: AddPointsFormProps) {
  const { addNotification } = useNotifications();

  const addPointsMutation = useAddPoints({
    mutationConfig: {
      onSuccess: () => {
        addNotification({ type: 'success', title: 'Points added successfully' });
        onSuccess?.();
      },
    },
  });

  return (
    <Form<AddPointsValues, typeof addPointsSchema>
      id="add-points-form"
      onSubmit={(values) => addPointsMutation.mutate({ cardId, ...values })}
      schema={addPointsSchema}
    >
      {({ register, formState }) => (
        <>
          <Input
            label="Points"
            type="number"
            error={formState.errors['points']}
            registration={register('points', { valueAsNumber: true })}
          />
          <Textarea
            label="Note (optional)"
            error={formState.errors['note']}
            registration={register('note')}
          />
          <Button
            type="submit"
            isLoading={addPointsMutation.isPending}
            disabled={addPointsMutation.isPending}
          >
            Add Points
          </Button>
        </>
      )}
    </Form>
  );
}
```

---

## 5. State management guide

| State kind | Tool | When to use |
|---|---|---|
| API data (users, cards, transactions) | **React Query** `useQuery` / `useMutation` | Any server-synchronized data |
| Complex client state with RTK Query | **Redux Toolkit** | Only for existing RTK Query setup (gypsum-products) — don't add new slices |
| Toast notifications | **Zustand** via `useNotifications()` | Pre-wired — use the existing store |
| Dialog/drawer open state | **`useState`** or **`useDisclosure()`** | Local, per-component |
| Form fields | **react-hook-form** | Always — never `useState` for forms |
| URL state (filters, pagination) | **`useSearchParams`** from `next/navigation` | Shareable/bookmarkable state |

**When in doubt:** If the state comes from or goes to the server, use React Query. If it's ephemeral UI state, use `useState`. If it's a form, use react-hook-form.

---

## 6. Next.js App Router patterns

### Server vs Client Components

```typescript
// Server Component (default — no directive)
// ✅ Can: async/await, direct DB/API access, no bundle cost
export default async function LoyaltyCardsPage() {
  return <LoyaltyCardList />;  // LoyaltyCardList can be a Client Component
}

// Client Component
// ✅ Can: hooks, events, browser APIs
'use client';
export function LoyaltyCardList() {
  const { data } = useLoyaltyCards();  // React Query hook
  ...
}
```

### Dynamic imports (heavy client components)

```typescript
import dynamic from 'next/dynamic';

const QrScanner = dynamic(
  () => import('@/features/loyalty-cards/components/qr-scanner'),
  { ssr: false, loading: () => <Spinner /> }
);
```

### Metadata

```typescript
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Loyalty Cards | LoyaltyApp' };
```

---

## 7. i18n patterns

```typescript
// Server Component
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('loyaltyCards');
t('title')             // → "Loyalty Cards"
t('pointsLabel')       // → "Points"

// Client Component
'use client';
import { useTranslations } from 'next-intl';
const t = useTranslations('loyaltyCards');
```

**Adding new keys:** Always update both `messages/en.json` and `messages/ru.json`. Use nested namespaces:

```json
{
  "loyaltyCards": {
    "title": "Loyalty Cards",
    "pointsLabel": "Points",
    "redeemButton": "Redeem Reward",
    "emptyState": "No loyalty cards yet"
  }
}
```

---

## 9. Naming conventions

| Item | Convention | Example |
|---|---|---|
| Feature directory | `kebab-case` | `loyalty-cards/`, `point-transactions/` |
| Component file | `kebab-case.tsx` | `loyalty-card-item.tsx` |
| Component export | `PascalCase` function | `LoyaltyCardItem` |
| API fetch function | `camelCase` verb + noun | `getLoyaltyCards`, `addPoints`, `deleteCard` |
| Query options function | camelCase + `QueryOptions` | `getLoyaltyCardsQueryOptions` |
| React Query hook | `use` + `PascalCase` | `useLoyaltyCards`, `useAddPoints` |
| Zod schema | camelCase + `Schema` | `addPointsSchema`, `createCardSchema` |
| DTO type | `PascalCase` + `DTO` | `AddPointsDTO`, `CreateCardDTO` |
| Inferred Zod type | `PascalCase` + `Values` | `AddPointsValues` |
| Hook file | `use-kebab-case.ts` | `use-disclosure.ts`, `use-debounce.ts` |
| Test file | co-located `*.test.tsx` | `loyalty-card-item.test.tsx` |
| Story file | co-located `*.stories.tsx` | `button.stories.tsx` |
| i18n namespace | `camelCase` | `loyaltyCards`, `pointTransactions` |

---

## 10. Forbidden patterns

| Forbidden | Why | Correct alternative |
|---|---|---|
| `import ... from '@/features/other'` inside a feature | Cross-feature coupling | Compose at `src/app/` or extract to `src/lib/` |
| Raw `fetch('/api/...')` in feature API files | Bypasses shared auth, error handling, base URL | `api.get('/...')` from `@/lib/api-client` |
| `useState` for form fields | Forms have dedicated state management | `useForm()` from `react-hook-form` + Zod schema |
| `'use client'` buried below imports | Next.js ignores it | Must be line 1 |
| Hardcoded `http://localhost:3000` or `process.env.NEXT_PUBLIC_API_URL` inline | Breaks per-environment config | Use `env.API_URL` or let the `api` client handle it |
| `import ... from '@/features/'` in `src/components/` | Shared components must be domain-agnostic | Receive data via props |
| `import ... from '@/features/'` in `src/lib/` | Foundation layer has no feature knowledge | Pass values as parameters |
| `console.log(...)` in production code | Debug artifact | Remove before committing |
| `any` in component props or API responses | Hides type errors | Use `unknown` + type narrowing, or proper interfaces |
| Adding new Redux slices for simple server state | Adds unnecessary complexity | Use React Query |
| Missing `ru.json` key when adding `en.json` key | Broken Russian UI | Always update both language files |
| Hardcoded text strings in JSX | Breaks i18n | `useTranslations('namespace')` — keys in both `en.json` and `ru.json` |
| Multiple components exported from one `.tsx` file | Violates single responsibility | One component per file |

---

## 11. File layout checklist for agents

When creating a new file, verify:

- [ ] Located in the correct layer (`app/` / `features/` / `components/` / `lib/` / `types/`)
- [ ] No forbidden cross-layer imports (see dependency table in §1)
- [ ] Feature API file: uses `api` from `@/lib/api-client`, exports queryOptions fn + hook
- [ ] Feature component: uses hooks for data, not direct API calls
- [ ] Mutation hook: invalidates related query cache on success
- [ ] Form: uses react-hook-form + Zod, not `useState`
- [ ] `'use client'` at line 1 if present; absent if the component has no hooks/events
- [ ] Props typed with explicit TypeScript interface/type
- [ ] Both `messages/en.json` and `messages/ru.json` updated if new i18n keys added
- [ ] No hardcoded text strings in JSX — all visible text uses `useTranslations()`
- [ ] Each `.tsx` file exports exactly one component
- [ ] No `any` types, no `console.log`, no hardcoded URLs
