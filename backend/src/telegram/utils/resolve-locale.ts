export function resolveLocale(
  customerLang: string | undefined,
  supportedLocales: string[],
  defaultLocale: string,
): string {
  if (customerLang && supportedLocales.includes(customerLang)) {
    return customerLang;
  }
  return defaultLocale;
}
