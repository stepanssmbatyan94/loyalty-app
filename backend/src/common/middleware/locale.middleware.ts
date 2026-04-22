import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { BusinessesService } from '../../businesses/businesses.service';
import { resolveLocale } from '../../telegram/utils/resolve-locale';

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  constructor(private readonly businessesService: BusinessesService) {}

  async use(
    req: Request & { locale?: string },
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const acceptLanguage = req.headers['accept-language'];
    const requestedLocale =
      acceptLanguage?.split(',')[0]?.split(';')[0]?.trim() ?? 'en';

    // Decode JWT payload (without full verification) to read businessId.
    // Security decisions remain with AuthGuard — this only reads locale config.
    const authHeader = req.headers['authorization'];
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    let businessId: string | undefined;
    if (token) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString(),
        ) as Record<string, unknown>;
        businessId =
          typeof payload.businessId === 'string'
            ? payload.businessId
            : undefined;
      } catch {
        // ignore malformed tokens
      }
    }

    if (businessId) {
      const business = await this.businessesService.findById(businessId);
      if (business) {
        req.locale = resolveLocale(
          requestedLocale,
          business.supportedLocales,
          business.defaultLocale,
        );
        next();
        return;
      }
    }

    req.locale = requestedLocale;
    next();
  }
}
