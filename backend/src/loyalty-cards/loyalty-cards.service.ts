import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

import { RewardsService } from '../rewards/rewards.service';
import { LoyaltyCard } from './domain/loyalty-card';
import { LoyaltyCardMeResponseDto } from './dto/loyalty-card-me-response.dto';
import { LoyaltyCardRepository } from './infrastructure/persistence/loyalty-card.repository';

@Injectable()
export class LoyaltyCardsService {
  constructor(
    private readonly loyaltyCardRepository: LoyaltyCardRepository,
    private readonly rewardsService: RewardsService,
  ) {}

  async findOrCreateForCustomer(
    customerId: number,
    businessId: string,
  ): Promise<LoyaltyCard> {
    const existing = await this.loyaltyCardRepository.findByCustomerAndBusiness(
      customerId,
      businessId,
    );

    if (existing) {
      return existing;
    }

    return this.loyaltyCardRepository.create({
      customerId,
      businessId,
      points: 0,
      totalPointsEarned: 0,
    });
  }

  async getCardWithProgress(
    customerId: number,
    businessId: string,
  ): Promise<LoyaltyCardMeResponseDto> {
    const card = await this.findOrCreateForCustomer(customerId, businessId);

    const rewards = await this.rewardsService.findActiveWithEligibility(
      businessId,
      card.points,
    );

    const nextRewardRaw =
      rewards
        .filter((r) => r.ptsNeeded > 0)
        .sort((a, b) => a.pointsCost - b.pointsCost)[0] ?? null;

    const progressPercent = nextRewardRaw
      ? Math.min(
          Math.round((card.points / nextRewardRaw.pointsCost) * 100),
          100,
        )
      : 100;

    const nextReward = nextRewardRaw
      ? {
          id: nextRewardRaw.id,
          name: nextRewardRaw.name,
          pointsCost: nextRewardRaw.pointsCost,
          ptsRemaining: nextRewardRaw.ptsNeeded,
        }
      : null;

    // TODO: Replace with real signed scan token URL when scan-token feature (B-08) is implemented
    const qrCodeUrl = `https://placeholder/qr/${card.id}`;

    return {
      id: card.id,
      businessId: card.businessId,
      customerId: card.customerId,
      points: card.points,
      totalPointsEarned: card.totalPointsEarned,
      qrCodeUrl,
      nextReward,
      progressPercent,
      memberSince: card.createdAt,
    };
  }

  async addPoints(cardId: string, points: number): Promise<LoyaltyCard> {
    const card = await this.loyaltyCardRepository.findById(cardId);

    if (!card) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { cardId: 'cardNotFound' },
      });
    }

    card.points += points;
    card.totalPointsEarned += points;

    return this.loyaltyCardRepository.save(card);
  }

  async deductPoints(cardId: string, points: number): Promise<LoyaltyCard> {
    const card = await this.loyaltyCardRepository.findById(cardId);

    if (!card) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { cardId: 'cardNotFound' },
      });
    }

    if (card.points < points) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { points: 'insufficient' },
      });
    }

    card.points -= points;

    return this.loyaltyCardRepository.save(card);
  }

  findById(id: string): Promise<LoyaltyCard | null> {
    return this.loyaltyCardRepository.findById(id);
  }

  findByCustomerAndBusiness(
    customerId: number,
    businessId: string,
  ): Promise<LoyaltyCard | null> {
    return this.loyaltyCardRepository.findByCustomerAndBusiness(
      customerId,
      businessId,
    );
  }
}
