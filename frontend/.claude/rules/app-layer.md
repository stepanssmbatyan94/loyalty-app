# App Layer Rules

You are editing the **app layer** — Next.js App Router pages and layouts. This is the composition layer: it imports from features, wires them into pages, and handles routing. It is the only layer where data from different features may be composed together.

## Server Components by default

Every file in `src/app/` is a **Server Component** unless it has `'use client'` at the top. Prefer Server Components — they render on the server, reducing JS bundle size.

Add `'use client'` **only when** the component:
- Uses React hooks (`useState`, `useEffect`, `useRef`, `useContext`, etc.)
- Uses browser-only APIs (`window`, `document`, `localStorage`)
- Uses event handlers (`onClick`, `onChange`, etc.) attached to non-form elements
- Uses third-party client-only libraries

```typescript
// ✅ Server Component — no directive needed
export default async function LoyaltyCardsPage() {
  const cards = await getLoyaltyCards(); // direct server call
  return <LoyaltyCardList initialData={cards} />;
}

// ✅ Client Component — directive at line 1
'use client';

import { useState } from 'react';
export function PointsCounter({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);
  ...
}
```

## 'use client' placement — critical rule

`'use client'` must be the **very first line** of the file, before any imports or comments. Next.js will silently fail or throw if it appears elsewhere.

```typescript
// ✅ Correct
'use client';

import { useQuery } from '@tanstack/react-query';

// ❌ Wrong — directive after imports
import { useQuery } from '@tanstack/react-query';
'use client'; // Next.js won't recognize this
```

## i18n — next-intl patterns

**Server Component:**
```typescript
import { getTranslations } from 'next-intl/server';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  return <h1>{t('title')}</h1>;
}
```

**Client Component:**
```typescript
'use client';

import { useTranslations } from 'next-intl';

export function PointsBadge() {
  const t = useTranslations('loyaltyCards');
  return <span>{t('pointsLabel')}</span>;
}
```

**Adding new translation keys:** Always update **both** `messages/en.json` and `messages/ru.json`. Never leave one language missing a key.

## Route groups

```
src/app/
├── (app)/           # Protected routes — layout enforces auth guard
│   ├── layout.tsx   # Auth check goes here, not in individual pages
│   ├── dashboard/
│   ├── loyalty-cards/
│   └── transactions/
├── auth/            # Public auth routes (login, register)
│   ├── login/
│   └── register/
└── layout.tsx       # Root layout — providers, fonts, metadata
```

Auth guard belongs in the `(app)/layout.tsx`, not in individual page components.

## Page component signature (Next.js 14)

```typescript
// Params and searchParams are now async in Next.js 14
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function CardDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page = '1' } = await searchParams;
  ...
}
```

## Dynamic imports for heavy client components

Avoid importing large client components directly — use dynamic imports to keep the initial bundle small:

```typescript
import dynamic from 'next/dynamic';

const QrCodeScanner = dynamic(() => import('@/features/loyalty-cards/components/qr-scanner'), {
  ssr: false,            // browser-only component
  loading: () => <Spinner />,
});
```

## Metadata

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Loyalty Cards',
  description: 'Manage your loyalty cards',
};
```

## Forbidden

| Forbidden | Why | Correct alternative |
|---|---|---|
| `'use client'` not on line 1 | Next.js won't recognize it | Move to line 1, before all imports |
| Data fetching with `useEffect` + `fetch` in a page | Server Components fetch directly | Use `async/await` in Server Component or a React Query hook in Client Component |
| Cross-feature state passed via URL (querystring hacks) | Tight coupling | Each feature manages its own state; compose at the page level via props |
| Business logic in `layout.tsx` beyond auth/navigation | Layout is structural | Move logic to a feature component or service |
| Missing i18n key in one language file | Broken translation | Always update both `en.json` and `ru.json` |

## Quick checklist before saving

- [ ] Is `'use client'` actually required? If no hooks/events, remove it
- [ ] `'use client'` is on line 1 if present
- [ ] New translation keys added to both `messages/en.json` and `messages/ru.json`
- [ ] Page component uses `await params` / `await searchParams` (Next.js 14 async)
- [ ] Heavy client components use `dynamic()` with `ssr: false`
- [ ] Auth guard is in the `(app)/layout.tsx`, not duplicated per page
