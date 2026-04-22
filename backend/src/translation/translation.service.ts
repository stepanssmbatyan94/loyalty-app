import { Injectable } from '@nestjs/common';

import { BusinessTranslationRepository } from '../businesses/infrastructure/persistence/business-translation.repository';
import { RewardTranslationRepository } from '../rewards/infrastructure/persistence/reward-translation.repository';

@Injectable()
export class TranslationService {
  constructor(
    private readonly businessTranslationRepository: BusinessTranslationRepository,
    private readonly rewardTranslationRepository: RewardTranslationRepository,
  ) {}

  async getTranslation(
    entityType: 'business' | 'reward',
    entityId: string,
    locale: string,
    field: string,
    defaultLocale: string,
  ): Promise<string | null> {
    const repo =
      entityType === 'business'
        ? this.businessTranslationRepository
        : this.rewardTranslationRepository;

    const value = await repo.getField(entityId, locale, field);
    if (value !== null && value !== undefined) return value;

    if (locale !== defaultLocale) {
      const fallback = await repo.getField(entityId, defaultLocale, field);
      if (fallback !== null && fallback !== undefined) return fallback;
    }

    return null;
  }

  async getBusinessTranslations(
    businessId: string,
    locale: string,
    defaultLocale: string,
  ): Promise<{
    name: string | null;
    welcomeMessage: string | null;
    pointsLabel: string | null;
  }> {
    const [name, welcomeMessage, pointsLabel] = await Promise.all([
      this.getTranslation('business', businessId, locale, 'name', defaultLocale),
      this.getTranslation(
        'business',
        businessId,
        locale,
        'welcomeMessage',
        defaultLocale,
      ),
      this.getTranslation(
        'business',
        businessId,
        locale,
        'pointsLabel',
        defaultLocale,
      ),
    ]);
    return { name, welcomeMessage, pointsLabel };
  }

  async getRewardTranslations(
    rewardId: string,
    locale: string,
    defaultLocale: string,
  ): Promise<{ name: string | null; description: string | null }> {
    const [name, description] = await Promise.all([
      this.getTranslation('reward', rewardId, locale, 'name', defaultLocale),
      this.getTranslation(
        'reward',
        rewardId,
        locale,
        'description',
        defaultLocale,
      ),
    ]);
    return { name, description };
  }
}
