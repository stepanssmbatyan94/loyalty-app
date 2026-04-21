import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Reward } from './domain/reward';
import { RewardTranslation } from './domain/reward-translation';
import { RewardRepository } from './infrastructure/persistence/reward.repository';
import { RewardTranslationRepository } from './infrastructure/persistence/reward-translation.repository';

export type RewardWithEligibility = Reward & {
  canRedeem: boolean;
  ptsNeeded: number;
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
  ): Promise<RewardWithEligibility[]> {
    const rewards =
      await this.rewardRepository.findAllActiveByBusinessId(businessId);

    return rewards.map((reward) => ({
      ...reward,
      canRedeem: customerPoints >= reward.pointsCost,
      ptsNeeded: Math.max(0, reward.pointsCost - customerPoints),
    }));
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
