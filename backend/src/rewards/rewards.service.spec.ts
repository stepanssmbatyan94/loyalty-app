import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { RewardRepository } from './infrastructure/persistence/reward.repository';
import { RewardsService } from './rewards.service';

const mockReward = {
  id: 'reward-uuid-1',
  businessId: 'business-uuid-1',
  name: 'Free Pint',
  description: null,
  pointsCost: 500,
  imageUrl: null,
  isActive: true,
  stock: null,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
};

describe('RewardsService', () => {
  let service: RewardsService;
  let rewardRepository: jest.Mocked<RewardRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        {
          provide: RewardRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAllActiveByBusinessId: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RewardsService>(RewardsService);
    rewardRepository = module.get(RewardRepository);
  });

  describe('create()', () => {
    it('should create and return a reward', async () => {
      rewardRepository.create.mockResolvedValue(mockReward);

      const result = await service.create({
        businessId: 'business-uuid-1',
        name: 'Free Pint',
        description: null,
        pointsCost: 500,
        imageUrl: null,
        isActive: true,
        stock: null,
      });

      expect(rewardRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockReward);
    });
  });

  describe('findActiveWithEligibility()', () => {
    it('should return rewards with canRedeem=true when customer has enough points', async () => {
      rewardRepository.findAllActiveByBusinessId.mockResolvedValue([
        mockReward,
      ]);

      const result = await service.findActiveWithEligibility(
        'business-uuid-1',
        600,
      );

      expect(result).toHaveLength(1);
      expect(result[0].canRedeem).toBe(true);
      expect(result[0].ptsNeeded).toBe(0);
    });

    it('should return rewards with canRedeem=false when customer has insufficient points', async () => {
      rewardRepository.findAllActiveByBusinessId.mockResolvedValue([
        mockReward,
      ]);

      const result = await service.findActiveWithEligibility(
        'business-uuid-1',
        300,
      );

      expect(result).toHaveLength(1);
      expect(result[0].canRedeem).toBe(false);
      expect(result[0].ptsNeeded).toBe(200);
    });

    it('should return empty array when no active rewards exist', async () => {
      rewardRepository.findAllActiveByBusinessId.mockResolvedValue([]);

      const result = await service.findActiveWithEligibility(
        'business-uuid-1',
        1000,
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('update()', () => {
    it('should update and return the reward when it belongs to the business', async () => {
      const updated = { ...mockReward, name: 'Updated Pint' };
      rewardRepository.findById.mockResolvedValue(mockReward);
      rewardRepository.update.mockResolvedValue(updated);

      const result = await service.update('reward-uuid-1', 'business-uuid-1', {
        name: 'Updated Pint',
      });

      expect(rewardRepository.update).toHaveBeenCalledWith('reward-uuid-1', {
        name: 'Updated Pint',
      });
      expect(result.name).toBe('Updated Pint');
    });

    it('should throw UnprocessableEntityException when reward is not found', async () => {
      rewardRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', 'business-uuid-1', { name: 'X' }),
      ).rejects.toThrow(UnprocessableEntityException);

      await expect(
        service.update('nonexistent-id', 'business-uuid-1', { name: 'X' }),
      ).rejects.toMatchObject({
        response: {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { id: 'rewardNotFound' },
        },
      });
    });

    it('should throw UnprocessableEntityException when reward belongs to a different business', async () => {
      rewardRepository.findById.mockResolvedValue(mockReward);

      await expect(
        service.update('reward-uuid-1', 'other-business-uuid', { name: 'X' }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('softDelete()', () => {
    it('should soft-delete the reward when it belongs to the business', async () => {
      rewardRepository.findById.mockResolvedValue(mockReward);
      rewardRepository.softDelete.mockResolvedValue(undefined);

      await service.softDelete('reward-uuid-1', 'business-uuid-1');

      expect(rewardRepository.softDelete).toHaveBeenCalledWith('reward-uuid-1');
    });

    it('should throw UnprocessableEntityException when reward is not found', async () => {
      rewardRepository.findById.mockResolvedValue(null);

      await expect(
        service.softDelete('nonexistent-id', 'business-uuid-1'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should throw UnprocessableEntityException when reward belongs to a different business', async () => {
      rewardRepository.findById.mockResolvedValue(mockReward);

      await expect(
        service.softDelete('reward-uuid-1', 'other-business-uuid'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
