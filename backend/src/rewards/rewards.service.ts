import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Reward } from './domain/reward';
import { RewardTranslation } from './domain/reward-translation';
import { RewardRepository } from './infrastructure/persistence/reward.repository';
import { RewardTranslationRepository } from './infrastructure/persistence/reward-translation.repository';

export type ResolvedRewardTranslation = RewardTranslation & {
  isFallback: boolean;
};

export type RewardWithEligibility = Reward & {
  canRedeem: boolean;
  ptsNeeded: number;
  translations: ResolvedRewardTranslation[];
};

@Injectable()
export class RewardsService {
  constructor(
    private readonly rewardRepository: RewardRepository,
    private readonly rewardTranslationRepository: RewardTranslationRepository,
  ) {}

  async create(
    data: Omit<Reward, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<Reward> {
    return this.rewardRepository.create(data);
  }

  async findById(id: string): Promise<Reward | null> {
    return this.rewardRepository.findById(id);
  }

  findAllByBusinessId(businessId: string): Promise<Reward[]> {
    return this.rewardRepository.findAllByBusinessId(businessId);
  }

  async findActiveWithEligibility(
    businessId: string,
    customerPoints: number,
    locale?: string,
    defaultLocale?: string,
  ): Promise<RewardWithEligibility[]> {
    const rewards =
      await this.rewardRepository.findAllActiveByBusinessId(businessId);

    const allTranslations =
      await this.rewardTranslationRepository.findByRewardIds(
        rewards.map((r) => r.id),
      );

    // Group by rewardId → locale → translations
    const byReward = new Map<string, Map<string, RewardTranslation[]>>();
    for (const t of allTranslations) {
      if (!byReward.has(t.rewardId)) byReward.set(t.rewardId, new Map());
      const localeMap = byReward.get(t.rewardId)!;
      const list = localeMap.get(t.locale) ?? [];
      list.push(t);
      localeMap.set(t.locale, list);
    }

    return rewards.map((reward) => {
      const localeMap =
        byReward.get(reward.id) ?? new Map<string, RewardTranslation[]>();
      const translations = this.resolveTranslations(
        localeMap,
        locale,
        defaultLocale,
      );
      return {
        ...reward,
        translations,
        canRedeem: customerPoints >= reward.pointsCost,
        ptsNeeded: Math.max(0, reward.pointsCost - customerPoints),
      };
    });
  }

  /**
   * Resolves translations per-field: for each field ('name', 'description'),
   * tries the requested locale first, then falls back to defaultLocale.
   * A ru locale with only 'name' + en defaultLocale with 'name'+'description'
   * → returns ru 'name' + en 'description'.
   */
  private resolveTranslations(
    localeMap: Map<string, RewardTranslation[]>,
    locale?: string,
    defaultLocale?: string,
  ): ResolvedRewardTranslation[] {
    const fields: Array<RewardTranslation['field']> = ['name', 'description'];
    const result: ResolvedRewardTranslation[] = [];

    for (const field of fields) {
      const fromLocale = locale
        ? localeMap.get(locale)?.find((t) => t.field === field)
        : undefined;
      if (fromLocale) {
        result.push({ ...fromLocale, isFallback: false });
        continue;
      }
      const fromDefault = defaultLocale
        ? localeMap.get(defaultLocale)?.find((t) => t.field === field)
        : undefined;
      if (fromDefault) result.push({ ...fromDefault, isFallback: true });
    }

    return result;
  }

  async update(
    id: string,
    businessId: string,
    payload: Partial<Reward>,
  ): Promise<Reward> {
    const existing = await this.rewardRepository.findById(id);

    if (!existing) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'rewardNotFound' },
      });
    }

    if (existing.businessId !== businessId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'rewardNotFound' },
      });
    }

    return this.rewardRepository.update(id, payload);
  }

  async softDelete(id: string, businessId: string): Promise<void> {
    const existing = await this.rewardRepository.findById(id);

    if (!existing) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'rewardNotFound' },
      });
    }

    if (existing.businessId !== businessId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'rewardNotFound' },
      });
    }

    return this.rewardRepository.softDelete(id);
  }

  async getTranslations(
    id: string,
    businessId: string,
  ): Promise<RewardTranslation[]> {
    const existing = await this.rewardRepository.findById(id);

    if (!existing || existing.businessId !== businessId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'rewardNotFound' },
      });
    }

    return this.rewardTranslationRepository.findByReward(id);
  }

  async updateTranslations(
    id: string,
    businessId: string,
    translations: Array<{
      locale: string;
      field: 'name' | 'description';
      value: string;
    }>,
  ): Promise<{ updated: number }> {
    const existing = await this.rewardRepository.findById(id);

    if (!existing || existing.businessId !== businessId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { id: 'rewardNotFound' },
      });
    }

    for (const t of translations) {
      await this.rewardTranslationRepository.upsert({ rewardId: id, ...t });
    }

    return { updated: translations.length };
  }
}
