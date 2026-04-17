import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Reward } from './domain/reward';
import { RewardRepository } from './infrastructure/persistence/reward.repository';

export type RewardWithEligibility = Reward & {
  canRedeem: boolean;
  ptsNeeded: number;
};

@Injectable()
export class RewardsService {
  constructor(private readonly rewardRepository: RewardRepository) {}

  async create(
    data: Omit<Reward, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<Reward> {
    return this.rewardRepository.create(data);
  }

  async findById(id: string): Promise<Reward | null> {
    return this.rewardRepository.findById(id);
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
}
