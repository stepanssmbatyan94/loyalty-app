# Components Layer Rules

You are editing the **shared components layer** — reusable UI primitives and layout components that are domain-agnostic. Shared components have no knowledge of features, business rules, or API data. They are pure UI building blocks.

## What belongs here

```
src/components/
├── ui/
│   ├── button/                      # Simple: one component per folder
│   │   ├── button.tsx
│   │   ├── button.stories.tsx
│   │   └── index.ts                 # export * from './button'
│   │
│   ├── form/                        # Composite: multiple related files, one folder
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── select.tsx
│   │   ├── switch.tsx
│   │   ├── label.tsx
│   │   ├── field-wrapper.tsx
│   │   ├── error.tsx
│   │   ├── form-drawer.tsx
│   │   ├── form.stories.tsx
│   │   ├── __tests__/
│   │   │   └── form.test.tsx
│   │   └── index.ts                 # export * from each file
│   │
│   ├── dialog/                      # Composite with a nested sub-component
│   │   ├── dialog.tsx
│   │   ├── dialog.stories.tsx
│   │   ├── __tests__/
│   │   ├── confirmation-dialog/     # sub-component gets its own folder + index.ts
│   │   │   ├── confirmation-dialog.tsx
│   │   │   ├── confirmation-dialog.stories.tsx
│   │   │   └── index.ts
│   │   └── index.ts                 # re-exports dialog AND confirmation-dialog
│   │
│   ├── spinner/                     # Simple pattern — same as button/
│   ├── drawer/                      # Composite pattern — same as dialog/
│   ├── notifications/               # Composite: notification.tsx + notifications.tsx + notifications-store.ts
│   └── table/                       # Composite: table.tsx + pagination.tsx
│
├── errors/                          # Error boundary fallback components
└── layouts/                         # Layout wrappers (Shell, content-layout, etc.)
```

**Two patterns — pick the right one:**

| Pattern | When | Examples |
|---|---|---|
| **Simple** — one `.tsx` + `.stories.tsx` + `index.ts` | Single self-contained component | `button/`, `spinner/`, `link/`, `dropdown/` |
| **Composite** — multiple `.tsx` files flat in one folder + `index.ts` | Tightly related group of primitives | `form/`, `dialog/`, `notifications/`, `table/` |

Every component folder **must** have an `index.ts` that re-exports with `export * from './...'`. Consumers import from the folder name, not the file:

```typescript
// ✅ Import from folder (index.ts handles resolution)
import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';

// ❌ Never import the file directly
import { Button } from '@/components/ui/button/button';
```

If a component depends on a specific feature's data or API, it does NOT belong here — put it in `src/features/{feature}/components/` instead.

## i18n — no hardcoded strings

Every piece of user-visible text must come from translations. Never write string literals in JSX.

```typescript
// ✅ Correct
'use client';
import { useTranslations } from 'next-intl';

export function ConfirmDialog({ onConfirm }: Props) {
  const t = useTranslations('common');
  return (
    <Dialog>
      <p>{t('areYouSure')}</p>
      <Button onClick={onConfirm}>{t('confirm')}</Button>
      <Button variant="outline">{t('cancel')}</Button>
    </Dialog>
  );
}

// ❌ Wrong
export function ConfirmDialog({ onConfirm }: Props) {
  return (
    <Dialog>
      <p>Are you sure?</p>
      <Button onClick={onConfirm}>Confirm</Button>
    </Dialog>
  );
}
```

Shared components that display generic text (confirm, cancel, save, loading…) use the `common` namespace. Add new keys to **both** `messages/en.json` and `messages/ru.json`.

## One component per file

Each `.tsx` file exports exactly one component. If you find yourself writing a second `export function` or an internal `function renderXxx()` helper, extract it into a separate file within the same folder.

```
// ✅ Correct — each component is its own file
dialog/
├── dialog.tsx               # exports Dialog
├── confirmation-dialog/
│   └── confirmation-dialog.tsx  # exports ConfirmationDialog

// ❌ Wrong — two components in one file
dialog/
└── dialog.tsx               # exports Dialog AND ConfirmationDialog
```

## 'use client' placement

Add `'use client'` **only** when the component uses hooks or browser APIs. When required, it must be on **line 1**, before any imports.

```typescript
// ✅ Client component — directive at line 1
'use client';

import { useState } from 'react';

export function Accordion({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  ...
}

// ✅ Server-compatible component — no directive
import { cn } from '@/utils/cn';

export function Card({ className, children }: CardProps) {
  return <div className={cn('rounded-lg border p-4', className)}>{children}</div>;
}
```

## className merging — always use cn()

Never concatenate class names with string interpolation or `+`. Always use the `cn()` utility from `@/utils/cn`:

```typescript
// ✅ Correct
import { cn } from '@/utils/cn';
<div className={cn('base-class', isActive && 'active-class', className)} />

// ❌ Wrong
<div className={`base-class ${isActive ? 'active-class' : ''} ${className}`} />
```

## Styling

- **Tailwind CSS** for all styling — no inline `style={{}}` except for truly dynamic values (e.g. CSS variables for dynamic colors)
- **Radix UI** primitives for accessible interactive components (Dialog, Dropdown, Tooltip, etc.)
- Never import component libraries (MUI, Ant Design, Chakra) — use Radix + Tailwind
- Use `class-variance-authority` (`cva`) for components with multiple variants

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
```

## Props typing

Every component must have an explicit TypeScript `interface` or `type` for its props. Never use implicit `any` or rely on `React.FC<{}>` without explicit typing.

```typescript
// ✅ Correct
interface BadgeProps {
  label: string;
  count?: number;
  variant?: 'default' | 'success' | 'warning';
  className?: string;
}

export function Badge({ label, count, variant = 'default', className }: BadgeProps) { ... }

// ❌ Wrong
export function Badge(props: any) { ... }
```

## Storybook stories

Every non-trivial shared component must have a `.stories.tsx` file **inside its folder**:

```typescript
// src/components/ui/button/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';         // relative import within the folder

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'UI/Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = { args: { children: 'Add Points' } };
export const Destructive: Story = { args: { children: 'Delete', variant: 'destructive' } };
```

## Forbidden

| Forbidden | Why | Correct alternative |
|---|---|---|
| `import ... from '@/features/'` | Shared components are feature-agnostic | Move component to `src/features/{name}/components/` |
| `import ... from '@/lib/api-client'` | Shared components don't fetch data | Receive data via props or accept a render prop / slot |
| Side effects in component body (not in `useEffect`) | Runs on every render | Wrap in `useEffect` or move to event handler |
| `console.log(...)` | Debug artifact | Remove before committing |
| Inline `style={{}}` for static values | Inconsistent with Tailwind | Use Tailwind classes |
| String concatenation for class names | Fragile, hard to read | Use `cn()` from `@/utils/cn` |
| Importing the `.tsx` file directly (`/button/button`) | Bypasses the public API | Import from the folder (`/button`) — `index.ts` resolves it |

## Quick checklist before saving

- [ ] Component has no imports from `@/features/`
- [ ] `'use client'` is on line 1 if present, absent if not needed
- [ ] `cn()` used for all className merging
- [ ] Props have explicit TypeScript interface/type
- [ ] Tailwind classes for styling — no inline styles for static values
- [ ] Component lives in its own folder (`button/button.tsx`), not as a flat file
- [ ] `index.ts` exists in the folder, re-exporting with `export * from './...'`
- [ ] Storybook `.stories.tsx` file is inside the component folder (not alongside it)
- [ ] No hardcoded text strings in JSX — all text uses `useTranslations()`
- [ ] New i18n keys added to both `messages/en.json` and `messages/ru.json`
- [ ] Each `.tsx` file exports exactly one component
- [ ] No API calls, data fetching, or business logic
