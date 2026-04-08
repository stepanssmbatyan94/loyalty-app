import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async () => {
  // No middleware yet — always use the default locale until [locale] route
  // segments are added and the middleware is re-enabled.
  const locale = routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
