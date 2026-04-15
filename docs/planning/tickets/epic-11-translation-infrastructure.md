# Epic 11 — Multi-Tenant Translation Infrastructure

Foundation layer for all multi-language features. Provides the generic translation lookup service, bot locale resolution, API locale middleware, and frontend locale passing. All other translation features (Epic 8 translation editor, Epic 7 bot locale-aware messages) depend on this epic.

**Depends on:** B-03b (BusinessTranslation module), B-05b (RewardTranslation module) from Epic 2

---

## B-37 — Translation Service

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-03b, B-05b
**Blocks:** B-39, B-18c

### Description
Generic service that resolves a translated string for any entity, implementing the 3-step locale fallback chain. Used by all bot handlers and API controllers that need to return locale-aware strings (business name, welcome message, points label, reward name, reward description).

### Files to create
```
backend/src/translation/
├── translation.service.ts
└── translation.module.ts
```

### Implementation notes

**Service signature:**
```ts
@Injectable()
export class TranslationService {
  // Returns the best available value for (entity, locale, field)
  // Fallback chain: requested locale → defaultLocale → null
  async getTranslation(
    entityType: 'business' | 'reward',
    entityId: string,
    locale: string,
    field: string,
    defaultLocale: string,
  ): Promise<string | null> { ... }

  // Convenience: resolve all fields for a business in one call
  async getBusinessTranslations(
    businessId: string,
    locale: string,
    defaultLocale: string,
  ): Promise<{ name: string | null; welcomeMessage: string | null; pointsLabel: string | null }> { ... }

  // Convenience: resolve name + description for a reward
  async getRewardTranslations(
    rewardId: string,
    locale: string,
    defaultLocale: string,
  ): Promise<{ name: string | null; description: string | null }> { ... }
}
```

**Fallback chain:**
```
1. Query translation table for (entityId, requestedLocale, field)
2. If not found → query for (entityId, defaultLocale, field)
3. If still not found → return null (caller uses raw field value as final fallback)
```

**Module:** Export `TranslationService`. Import `BusinessTranslationModule` and `RewardTranslationModule`.

### Acceptance criteria
- [ ] Returns correct value for the requested locale when translation exists
- [ ] Falls back to `defaultLocale` when requested locale is missing
- [ ] Returns `null` (not throws) when neither locale has a translation
- [ ] Works for both `business` and `reward` entity types

### Definition of done
- [ ] Unit tests covering: found → found, fallback path, both missing
- [ ] `npm run lint` passes

---

## B-38 — Bot Locale Resolution

**SP:** 2 | **Layer:** BOT | **Status:** Todo
**Depends on:** B-03 (Business.supportedLocales + defaultLocale)
**Blocks:** B-18b, B-18c

### Description
Pure utility function that resolves which locale to use for a given customer based on the business's supported locale list. Used in every bot message send to pick the correct language.

### Files to create
```
backend/src/telegram/utils/resolve-locale.ts
```

### Implementation notes

```ts
/**
 * Returns the locale to use for this customer:
 * - If business supports customerLang → use it
 * - Otherwise → use business.defaultLocale
 */
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
```

**Usage in bot handlers:**
```ts
// In /start and lang:* handlers:
const locale = resolveLocale(ctx.from?.language_code, business.supportedLocales, business.defaultLocale);
const welcome = await translationService.getBusinessTranslations(business.id, locale, business.defaultLocale);
await ctx.reply(welcome.welcomeMessage ?? 'Welcome!');
```

### Acceptance criteria
- [ ] Returns `customerLang` when it is in `supportedLocales`
- [ ] Returns `defaultLocale` when `customerLang` is undefined
- [ ] Returns `defaultLocale` when `customerLang` is not in `supportedLocales`
- [ ] Pure function — no side effects, no DB calls

### Definition of done
- [ ] Unit tests: 4 cases (exact match, no lang, unsupported lang, default used)
- [ ] `npm run lint` passes

---

## B-39 — API Locale Middleware

**SP:** 3 | **Layer:** BE | **Status:** Todo
**Depends on:** B-37, B-03
**Blocks:** B-10 (GET /loyalty-cards/me), B-11 (GET /rewards)

### Description
NestJS middleware that reads the `Accept-Language` request header, resolves it against the requesting business's `supportedLocales`, and attaches the resolved locale to `req.locale`. All controllers that return translatable fields use `req.locale` to fetch the correct translation — consumers never receive raw base fields.

### Files to create
```
backend/src/common/middleware/locale.middleware.ts
```

### Implementation notes

**Middleware:**
```ts
@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  constructor(private readonly businessesService: BusinessesService) {}

  async use(req: Request & { locale?: string }, res: Response, next: NextFunction) {
    const acceptLanguage = req.headers['accept-language'];
    const requestedLocale = acceptLanguage?.split(',')[0]?.split(';')[0]?.trim() ?? 'en';

    // businessId comes from the JWT payload (set by AuthGuard before middleware on protected routes)
    const businessId: string | undefined = (req as any).user?.businessId;

    if (businessId) {
      const business = await this.businessesService.findById(businessId);
      if (business) {
        req.locale = resolveLocale(requestedLocale, business.supportedLocales, business.defaultLocale);
        return next();
      }
    }

    req.locale = requestedLocale;
    next();
  }
}
```

**Register in:** `BusinessesModule` and `RewardsModule` (any module whose controllers return translated content).

**Controllers read locale via:** `@Req() req` and pass `req.locale` to service methods.

### Acceptance criteria
- [ ] `Accept-Language: hy` on a business with `supportedLocales: ['en', 'hy']` → `req.locale = 'hy'`
- [ ] `Accept-Language: fr` on a business with `supportedLocales: ['en', 'hy']` → `req.locale = 'en'` (defaultLocale)
- [ ] Missing `Accept-Language` header → `req.locale = defaultLocale`
- [ ] Requests without `businessId` in JWT (unauthenticated) → `req.locale = raw header value`

### Definition of done
- [ ] Middleware registered in relevant modules
- [ ] Integration test: request with `Accept-Language: hy` returns Armenian translated fields
- [ ] `npm run lint` passes

---

## F-31 — Frontend Locale Passing

**SP:** 2 | **Layer:** FE | **Status:** Todo
**Depends on:** F-04 (auth store with user.language)
**Blocks:** correct translations in Mini App

### Description
Add an `Accept-Language` header to every API request from the Mini App so the backend returns translated strings in the customer's language. Uses the `user.language` field stored in the auth store after Telegram authentication.

### Files to update
```
frontend/src/lib/api-client.ts   (or wherever axios/fetch is configured)
```

### Implementation notes

**In the API client interceptor:**
```ts
// Get language from auth store
const { user } = useAuthStore.getState();
const locale = user?.language ?? 'en';

// Add to every request
axios.defaults.headers.common['Accept-Language'] = locale;

// Or in an interceptor:
apiClient.interceptors.request.use((config) => {
  const { user } = useAuthStore.getState();
  config.headers['Accept-Language'] = user?.language ?? 'en';
  return config;
});
```

**Note:** `user.language` is set during the `lang:*` Telegram bot callback (B-18c) and stored in the DB. It is included in the JWT payload or returned on the `/auth/telegram` response.

### Acceptance criteria
- [ ] Every API request from the Mini App includes `Accept-Language: <user.language>`
- [ ] Falls back to `en` when `user.language` is null or undefined
- [ ] Header is set on all requests (not just specific endpoints)
- [ ] Changing language in bot updates the header on next app open

### Definition of done
- [ ] Header visible in browser DevTools Network tab
- [ ] Manual test: set language to `hy` in bot → open Mini App → rewards show Armenian names
- [ ] `npm run lint` passes
