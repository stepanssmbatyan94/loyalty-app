import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { LoyaltyCardsService } from '../loyalty-cards/loyalty-cards.service';
import { RewardsService } from '../rewards/rewards.service';
import { RedemptionRepository } from './infrastructure/persistence/redemption.repository';
import { RedemptionsService } from './redemptions.service';

const mockCard = {
  id: 'card-uuid-1',
  customerId: 1,
  businessId: 'biz-uuid-1',
  points: 1000,
  totalPointsEarned: 1000,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockReward = {
  id: 'reward-uuid-1',
  businessId: 'biz-uuid-1',
  name: 'Free Pint',
  description: null,
  pointsCost: 500,
  imageUrl: null,
  isActive: true,
  stock: null,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
};

const mockRedemption = {
  id: 'rdmp-uuid-1',
  cardId: 'card-uuid-1',
  rewardId: 'reward-uuid-1',
  code: '123456',
  qrData: 'https://redeem.beerhouse.app/r/123456',
  pointsCost: 500,
  status: 'pending' as const,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  confirmedAt: null,
  cashierTelegramId: null,
  createdAt: new Date(),
};

describe('RedemptionsService', () => {
  let service: RedemptionsService;
  let redemptionRepository: jest.Mocked<RedemptionRepository>;
  let rewardsService: jest.Mocked<RewardsService>;
  let loyaltyCardsService: jest.Mocked<LoyaltyCardsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedemptionsService,
        {
          provide: RedemptionRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByCode: jest.fn(),
            findPendingExpired: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: RewardsService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: LoyaltyCardsService,
          useValue: {
            findByCustomerAndBusiness: jest.fn(),
            deductPoints: jest.fn(),
            addPoints: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RedemptionsService>(RedemptionsService);
    redemptionRepository = module.get(RedemptionRepository);
    rewardsService = module.get(RewardsService);
    loyaltyCardsService = module.get(LoyaltyCardsService);
  });

  describe('create()', () => {
    it('should create a pending redemption and pre-deduct points', async () => {
      rewardsService.findById.mockResolvedValue(mockReward);
      loyaltyCardsService.findByCustomerAndBusiness.mockResolvedValue(mockCard);
      loyaltyCardsService.deductPoints.mockResolvedValue({
        ...mockCard,
        points: 500,
      });
      redemptionRepository.create.mockResolvedValue(mockRedemption);

      const result = await service.create(1, 'biz-uuid-1', 'reward-uuid-1');

      expect(loyaltyCardsService.deductPoints).toHaveBeenCalledWith(
        'card-uuid-1',
        500,
      );
      expect(redemptionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cardId: 'card-uuid-1',
          rewardId: 'reward-uuid-1',
          pointsCost: 500,
          status: 'pending',
        }),
      );
      expect(result.status).toBe('pending');
    });

    it('should throw when reward is not found', async () => {
      rewardsService.findById.mockResolvedValue(null);

      await expect(
        service.create(1, 'biz-uuid-1', 'nonexistent-reward'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw when reward belongs to a different business', async () => {
      rewardsService.findById.mockResolvedValue({
        ...mockReward,
        businessId: 'other-biz',
      });

      await expect(
        service.create(1, 'biz-uuid-1', 'reward-uuid-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw when customer has no loyalty card', async () => {
      rewardsService.findById.mockResolvedValue(mockReward);
      loyaltyCardsService.findByCustomerAndBusiness.mockResolvedValue(null);

      await expect(
        service.create(1, 'biz-uuid-1', 'reward-uuid-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw when customer has insufficient points', async () => {
      rewardsService.findById.mockResolvedValue(mockReward);
      loyaltyCardsService.findByCustomerAndBusiness.mockResolvedValue({
        ...mockCard,
        points: 100,
      });

      await expect(
        service.create(1, 'biz-uuid-1', 'reward-uuid-1'),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        service.create(1, 'biz-uuid-1', 'reward-uuid-1'),
      ).rejects.toMatchObject({
        response: {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { points: 'insufficient' },
        },
      });
    });
  });

  describe('confirm()', () => {
    it('should confirm a pending redemption', async () => {
      const confirmed = {
        ...mockRedemption,
        status: 'confirmed' as const,
        confirmedAt: new Date(),
        cashierTelegramId: 12345,
      };
      redemptionRepository.findByCode.mockResolvedValue({ ...mockRedemption });
      redemptionRepository.save.mockResolvedValue(confirmed);

      const result = await service.confirm('123456', 12345);

      expect(result.status).toBe('confirmed');
      expect(result.cashierTelegramId).toBe(12345);
    });

    it('should throw when code is not found', async () => {
      redemptionRepository.findByCode.mockResolvedValue(null);

      await expect(service.confirm('000000', 12345)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw when redemption is not pending', async () => {
      redemptionRepository.findByCode.mockResolvedValue({
        ...mockRedemption,
        status: 'confirmed' as const,
      });

      await expect(service.confirm('123456', 12345)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw when redemption is expired', async () => {
      redemptionRepository.findByCode.mockResolvedValue({
        ...mockRedemption,
        status: 'pending' as const,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.confirm('123456', 12345)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('cancel()', () => {
    it('should cancel a pending redemption and refund points', async () => {
      const cancelled = { ...mockRedemption, status: 'cancelled' as const };
      redemptionRepository.findByCode.mockResolvedValue({ ...mockRedemption });
      redemptionRepository.save.mockResolvedValue(cancelled);

      const result = await service.cancel('123456');

      expect(result.status).toBe('cancelled');
      expect(loyaltyCardsService.addPoints).toHaveBeenCalledWith(
        'card-uuid-1',
        500,
      );
    });

    it('should throw when code is not found', async () => {
      redemptionRepository.findByCode.mockResolvedValue(null);

      await expect(service.cancel('000000')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw when redemption is not pending', async () => {
      redemptionRepository.findByCode.mockResolvedValue({
        ...mockRedemption,
        status: 'confirmed' as const,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      await expect(service.cancel('123456')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('expirePendingRedemptions()', () => {
    it('should expire pending redemptions and refund points', async () => {
      redemptionRepository.findPendingExpired.mockResolvedValue([
        { ...mockRedemption },
      ]);
      redemptionRepository.save.mockResolvedValue({
        ...mockRedemption,
        status: 'expired' as const,
      });

      await service.expirePendingRedemptions();

      expect(redemptionRepository.save).toHaveBeenCalledTimes(1);
      expect(loyaltyCardsService.addPoints).toHaveBeenCalledWith(
        'card-uuid-1',
        500,
      );
    });

    it('should do nothing when there are no pending expired redemptions', async () => {
      redemptionRepository.findPendingExpired.mockResolvedValue([]);

      await service.expirePendingRedemptions();

      expect(redemptionRepository.save).not.toHaveBeenCalled();
      expect(loyaltyCardsService.addPoints).not.toHaveBeenCalled();
    });
  });
});
