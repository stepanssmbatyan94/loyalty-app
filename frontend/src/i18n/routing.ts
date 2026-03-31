import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
  // Keep 'never' until src/app routes are restructured to [locale] segments.
  // This prevents next-intl from redirecting existing routes prematurely.
  localePrefix: 'never',
});
