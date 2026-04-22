import { resolveLocale } from './resolve-locale';

describe('resolveLocale()', () => {
  it('should return customerLang when it is in supportedLocales', () => {
    expect(resolveLocale('hy', ['en', 'ru', 'hy'], 'en')).toBe('hy');
  });

  it('should return defaultLocale when customerLang is undefined', () => {
    expect(resolveLocale(undefined, ['en', 'ru', 'hy'], 'en')).toBe('en');
  });

  it('should return defaultLocale when customerLang is not in supportedLocales', () => {
    expect(resolveLocale('fr', ['en', 'ru', 'hy'], 'en')).toBe('en');
  });

  it('should return defaultLocale when supportedLocales is empty', () => {
    expect(resolveLocale('hy', [], 'en')).toBe('en');
  });
});
