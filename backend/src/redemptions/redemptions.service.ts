import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { LoyaltyCardsService } from '../loyalty-cards/loyalty-cards.service';
import { RewardsService } from '../rewards/rewards.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NullableType } from '../utils/types/nullable.type';
import { Redemption } from './domain/redemption';
import { RedemptionDetailDto } from './dto/redemption-detail.dto';
import { RedemptionRepository } from './infrastructure/persistence/redemption.repository';

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class RedemptionsService {
  constructor(
    private readonly redemptionRepository: RedemptionRepository,
    private readonly rewardsService: RewardsService,
    private readonly loyaltyCardsService: LoyaltyCardsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(
    customerId: number,
    businessId: string,
    rewardId: string,
  ): Promise<Redemption> {
    const reward = await this.rewardsService.findById(rewardId);

    if (!reward || !reward.isActive || reward.businessId !== businessId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { rewardId: 'rewardNotFound' },
      });
    }

    const card = await this.loyaltyCardsService.findByCustomerAndBusiness(
      customerId,
      businessId,
    );

    if (!card) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { cardId: 'cardNotFound' },
      });
    }

    if (card.points < reward.pointsCost) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { points: 'insufficient' },
      });
    }

    // Pre-deduct points immediately
    await this.loyaltyCardsService.deductPoints(card.id, reward.pointsCost);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
    const code = generateCode();
    const qrData = `https://redeem.beerhouse.app/r/${code}`;

    return this.redemptionRepository.create({
      cardId: card.id,
      rewardId,
      code,
      qrData,
      pointsCost: reward.pointsCost,
      status: 'pending',
      expiresAt,
      confirmedAt: null,
      cashierTelegramId: null,
    });
  }

  async confirm(code: string, cashierTelegramId: number): Promise<Redemption> {
    const redemption = await this.redemptionRepository.findByCode(code);

    if (!redemption) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { code: 'redemptionNotFound' },
      });
    }

    if (redemption.status !== 'pending') {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { status: 'redemptionNotPending' },
      });
    }

    if (redemption.expiresAt < new Date()) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { code: 'redemptionExpired' },
      });
    }

    redemption.status = 'confirmed';
    redemption.confirmedAt = new Date();
    redemption.cashierTelegramId = cashierTelegramId;

    const saved = await this.redemptionRepository.save(redemption);

    const reward = await this.rewardsService.findById(redemption.rewardId);
    await this.transactionsService.create({
      cardId: redemption.cardId,
      type: 'redeem',
      points: redemption.pointsCost,
      cashierTelegramId,
      rewardId: redemption.rewardId,
      note: reward?.name ?? null,
    });

    return saved;
  }

  async cancel(code: string): Promise<Redemption> {
    const redemption = await this.redemptionRepository.findByCode(code);

    if (!redemption) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { code: 'redemptionNotFound' },
      });
    }

    if (redemption.status !== 'pending') {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { status: 'redemptionNotPending' },
      });
    }

    redemption.status = 'cancelled';

    const saved = await this.redemptionRepository.save(redemption);

    // Refund points
    await this.loyaltyCardsService.addPoints(
      redemption.cardId,
      redemption.pointsCost,
    );

    return saved;
  }

  async findByIdWithDetails(
    id: string,
  ): Promise<NullableType<RedemptionDetailDto>> {
    const redemption = await this.redemptionRepository.findById(id);
    if (!redemption) return null;
    const reward = await this.rewardsService.findById(redemption.rewardId);
    return Object.assign(new RedemptionDetailDto(), redemption, {
      rewardName: reward?.name ?? '',
    });
  }

  async findByCodeForValidation(code: string): Promise<{
    code: string;
    status: string;
    rewardName: string;
    pointsCost: number;
    expiresAt: Date;
    secondsRemaining: number;
  } | null> {
    const redemption = await this.redemptionRepository.findByCode(code);
    if (!redemption) return null;
    const now = new Date();
    const secondsRemaining = Math.max(
      0,
      Math.floor((redemption.expiresAt.getTime() - now.getTime()) / 1000),
    );
    const reward = await this.rewardsService.findById(redemption.rewardId);
    const isValid =
      redemption.status === 'pending' && redemption.expiresAt > now;
    return {
      code: redemption.code,
      status: isValid ? 'valid' : redemption.status,
      rewardName: reward?.name ?? '',
      pointsCost: redemption.pointsCost,
      expiresAt: redemption.expiresAt,
      secondsRemaining,
    };
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async expirePendingRedemptions(): Promise<void> {
    const now = new Date();
    const expired = await this.redemptionRepository.findPendingExpired(now);

    await Promise.all(
      expired.map(async (redemption) => {
        redemption.status = 'expired';
        await this.redemptionRepository.save(redemption);
        await this.loyaltyCardsService.addPoints(
          redemption.cardId,
          redemption.pointsCost,
        );
      }),
    );
  }
}
