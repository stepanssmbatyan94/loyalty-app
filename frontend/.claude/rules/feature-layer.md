# Feature Layer Rules

You are editing a **feature module** — a self-contained unit of product functionality. Features own their API hooks, components, types, and hooks. Nothing inside a feature may reach into another feature.

## Feature directory structure

```
src/features/{feature-name}/
├── api/              # React Query hooks + fetcher functions (ALL via @/lib/api-client)
├── components/       # UI components scoped to this feature
│   └── __tests__/   # Co-located component tests
├── hooks/            # Custom hooks used only by this feature
├── types/            # TypeScript types for this feature's domain
└── utils/            # Feature-specific utility functions
```

Only include the directories the feature actually needs. Not every feature requires all of them.

## Allowed imports

```typescript
// Foundation (always allowed):
import { api } from '@/lib/api-client';
import { MutationConfig, QueryConfig } from '@/lib/react-query';
import { useUser } from '@/lib/auth';
import { paths } from '@/config/paths';
import { env } from '@/config/env';

// Shared UI (always allowed):
import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';

// Shared types and hooks (always allowed):
import { User } from '@/types/api';
import { useDisclosure } from '@/hooks/use-disclosure';

// Own feature (always allowed — use relative paths):
import { getItemsQueryOptions } from '../api/get-items';
import { ItemCard } from '../components/item-card';
```

## i18n — no hardcoded strings

Every piece of user-visible text in a feature component must come from translations. Feature components are almost always client components, so use `useTranslations`:

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function LoyaltyCardItem({ card }: { card: LoyaltyCard }) {
  const t = useTranslations('loyaltyCards');
  return (
    <div>
      <span>{t('pointsLabel')}</span>
      <strong>{card.points}</strong>
      <Button>{t('redeemButton')}</Button>
    </div>
  );
}
```

Add new keys to **both** `messages/en.json` and `messages/ru.json`. See `docs/loyalty-domain.md` for the correct i18n namespace for each feature.

## One component per file

Each `.tsx` file in `components/` exports exactly one component. If a feature component grows large, split it — the `components/` folder exists for this purpose.

```
// ✅ Correct — split into focused files
features/loyalty-cards/components/
├── loyalty-card-list.tsx     # renders the list
├── loyalty-card-item.tsx     # renders one card
└── loyalty-card-empty.tsx    # empty state

// ❌ Wrong — one file doing too much
features/loyalty-cards/components/
└── loyalty-cards.tsx         # renders list, item, empty state, and a modal
```

## Forbidden — these are correctness violations

| Forbidden | Why | Correct alternative |
|---|---|---|
| `import ... from '@/features/other-feature/...'` | Features must be self-contained | Compose at `src/app/**` or extract to `src/lib/`, `src/hooks/`, `src/types/` |
| `fetch('/api/...')` directly in API file | Bypasses shared error handling & auth | `import { api } from '@/lib/api-client'; api.get('/...')` |
| `useState` for form fields | Form state belongs in RHF | `useForm<Schema>()` from `react-hook-form` + Zod schema |
| Direct `api.get()` call inside a component | Components use hooks, not direct API | Extract to `api/get-x.ts` and expose a `useX()` hook |
| `any` type in API response or component props | Hides real bugs | Use proper types; use `unknown` and narrow if truly dynamic |
| Hardcoded text strings in JSX (`"Add Points"`, `"Loading..."`) | Breaks i18n | `useTranslations('namespace')` — add keys to both `en.json` and `ru.json` |
| Multiple components exported from one `.tsx` file | Hard to navigate, violates single responsibility | One component per file; split into separate files in `components/` |
| `console.log(...)` left in code | Debug artifact | Remove before committing |
| Hardcoded `http://localhost:3000` or API URL | Breaks other environments | Use `env.API_URL` from `@/config/env` or the `api` client |

## Canonical API hook pattern

### Query (read)

```typescript
// src/features/loyalty-cards/api/get-loyalty-cards.ts
import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { LoyaltyCard } from '@/types/api';

export const getLoyaltyCards = (): Promise<{ data: LoyaltyCard[] }> => {
  return api.get('/loyalty-cards');
};

export const getLoyaltyCardsQueryOptions = () => {
  return queryOptions({
    queryKey: ['loyalty-cards'],
    queryFn: getLoyaltyCards,
  });
};

type UseLoyaltyCardsOptions = {
  queryConfig?: QueryConfig<typeof getLoyaltyCards>;
};

export const useLoyaltyCards = ({ queryConfig }: UseLoyaltyCardsOptions = {}) => {
  return useQuery({
    ...getLoyaltyCardsQueryOptions(),
    ...queryConfig,
  });
};
```

### Mutation (write)

```typescript
// src/features/loyalty-cards/api/add-points.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { getLoyaltyCardsQueryOptions } from './get-loyalty-cards';

export type AddPointsDTO = {
  cardId: string;
  points: number;
};

export const addPoints = (data: AddPointsDTO) => {
  return api.post(`/loyalty-cards/${data.cardId}/points`, data);
};

type UseAddPointsOptions = {
  mutationConfig?: MutationConfig<typeof addPoints>;
};

export const useAddPoints = ({ mutationConfig }: UseAddPointsOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      // Invalidate related queries after mutation
      queryClient.invalidateQueries({
        queryKey: getLoyaltyCardsQueryOptions().queryKey,
      });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: addPoints,
  });
};
```

## Canonical form pattern

```typescript
// src/features/loyalty-cards/components/add-points-form.tsx
import { z } from 'zod';
import { Form, Input } from '@/components/ui/form';
import { useAddPoints } from '../api/add-points';

const addPointsSchema = z.object({
  points: z.number().int().positive('Points must be a positive number'),
});

type AddPointsValues = z.infer<typeof addPointsSchema>;

export function AddPointsForm({ cardId }: { cardId: string }) {
  const addPointsMutation = useAddPoints({
    mutationConfig: {
      onSuccess: () => {
        // show notification, close drawer, etc.
      },
    },
  });

  return (
    <Form<AddPointsValues, typeof addPointsSchema>
      onSubmit={(values) => addPointsMutation.mutate({ cardId, ...values })}
      schema={addPointsSchema}
    >
      {({ register, formState }) => (
        <Input
          label="Points"
          type="number"
          error={formState.errors['points']}
          registration={register('points', { valueAsNumber: true })}
        />
      )}
    </Form>
  );
}
```

## Naming conventions

| Item | Convention | Example |
|---|---|---|
| Feature directory | `kebab-case` | `loyalty-cards/`, `point-transactions/` |
| Component file | `kebab-case.tsx` | `loyalty-card-item.tsx` |
| Component export | `PascalCase` | `LoyaltyCardItem` |
| API file | `kebab-case.ts` | `get-loyalty-cards.ts`, `add-points.ts` |
| Query hook | `use` + `PascalCase` | `useLoyaltyCards`, `useAddPoints` |
| Query options fn | camelCase + `QueryOptions` | `getLoyaltyCardsQueryOptions` |
| Zod schema | camelCase + `Schema` | `addPointsSchema` |
| Type from schema | PascalCase + `Values` | `AddPointsValues` |
| DTO type | PascalCase + `DTO` | `AddPointsDTO` |
| Types file | `index.ts` inside `types/` | `src/features/loyalty-cards/types/index.ts` |

## Quick checklist before saving

- [ ] File is in the correct subdirectory (`api/`, `components/`, `hooks/`, `types/`, `utils/`)
- [ ] No imports from `@/features/other-feature/`
- [ ] API functions use `api` from `@/lib/api-client` (not raw `fetch`)
- [ ] Forms use `react-hook-form` + Zod, not `useState`
- [ ] Mutation hook invalidates relevant query cache on success
- [ ] All TypeScript types are explicit — no `any`
- [ ] No hardcoded text strings in JSX — all text uses `useTranslations()`
- [ ] New i18n keys added to both `messages/en.json` and `messages/ru.json`
- [ ] Each `.tsx` file exports exactly one component
