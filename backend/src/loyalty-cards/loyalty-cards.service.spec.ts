import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { RewardsService } from '../rewards/rewards.service';
import { LoyaltyCard } from './domain/loyalty-card';
import { LoyaltyCardRepository } from './infrastructure/persistence/loyalty-card.repository';
import { LoyaltyCardsService } from './loyalty-cards.service';

const makeCard = (overrides: Partial<LoyaltyCard> = {}): LoyaltyCard => ({
  id: 'card-uuid',
  customerId: 1,
  businessId: 'biz-uuid',
  points: 100,
  totalPointsEarned: 200,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('LoyaltyCardsService', () => {
  let service: LoyaltyCardsService;
  let repo: jest.Mocked<LoyaltyCardRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoyaltyCardsService,
        {
          provide: LoyaltyCardRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByCustomerAndBusiness: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: RewardsService,
          useValue: {
            findActiveWithEligibility: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(LoyaltyCardsService);
    repo = module.get(LoyaltyCardRepository);
  });

  describe('findOrCreateForCustomer()', () => {
    it('should return existing card when found', async () => {
      const card = makeCard();
      repo.findByCustomerAndBusiness.mockResolvedValue(card);

      const result = await service.findOrCreateForCustomer(1, 'biz-uuid');

      expect(result).toBe(card);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('should create and return a new card when none exists', async () => {
      const newCard = makeCard({ points: 0, totalPointsEarned: 0 });
      repo.findByCustomerAndBusiness.mockResolvedValue(null);
      repo.create.mockResolvedValue(newCard);

      const result = await service.findOrCreateForCustomer(1, 'biz-uuid');

      expect(repo.create).toHaveBeenCalledWith({
        customerId: 1,
        businessId: 'biz-uuid',
        points: 0,
        totalPointsEarned: 0,
      });
      expect(result.points).toBe(0);
    });
  });

  describe('addPoints()', () => {
    it('should increment points and totalPointsEarned then save', async () => {
      const card = makeCard({ points: 100, totalPointsEarned: 200 });
      const updated = makeCard({ points: 150, totalPointsEarned: 250 });
      repo.findById.mockResolvedValue(card);
      repo.save.mockResolvedValue(updated);

      const result = await service.addPoints('card-uuid', 50);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ points: 150, totalPointsEarned: 250 }),
      );
      expect(result.points).toBe(150);
    });

    it('should throw when card is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.addPoints('missing', 50)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('deductPoints()', () => {
    it('should decrement points and save', async () => {
      const card = makeCard({ points: 100 });
      const updated = makeCard({ points: 60 });
      repo.findById.mockResolvedValue(card);
      repo.save.mockResolvedValue(updated);

      const result = await service.deductPoints('card-uuid', 40);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ points: 60 }),
      );
      expect(result.points).toBe(60);
    });

    it('should throw "insufficient" when card balance is too low', async () => {
      const card = makeCard({ points: 30 });
      repo.findById.mockResolvedValue(card);

      await expect(service.deductPoints('card-uuid', 50)).rejects.toMatchObject(
        {
          response: {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: { points: 'insufficient' },
          },
        },
      );
    });

    it('should throw when card is not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.deductPoints('missing', 50)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('findByCustomerAndBusiness()', () => {
    it('should return the card when found', async () => {
      const card = makeCard();
      repo.findByCustomerAndBusiness.mockResolvedValue(card);

      const result = await service.findByCustomerAndBusiness(1, 'biz-uuid');

      expect(result).toBe(card);
    });

    it('should return null when not found', async () => {
      repo.findByCustomerAndBusiness.mockResolvedValue(null);

      const result = await service.findByCustomerAndBusiness(1, 'biz-uuid');

      expect(result).toBeNull();
    });
  });
});
