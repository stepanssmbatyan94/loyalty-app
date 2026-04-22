import { Test, TestingModule } from '@nestjs/testing';

import { BusinessTranslationRepository } from '../businesses/infrastructure/persistence/business-translation.repository';
import { RewardTranslationRepository } from '../rewards/infrastructure/persistence/reward-translation.repository';
import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let service: TranslationService;
  let businessRepo: jest.Mocked<BusinessTranslationRepository>;
  let rewardRepo: jest.Mocked<RewardTranslationRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        {
          provide: BusinessTranslationRepository,
          useValue: { getField: jest.fn() },
        },
        {
          provide: RewardTranslationRepository,
          useValue: { getField: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(TranslationService);
    businessRepo = module.get(BusinessTranslationRepository);
    rewardRepo = module.get(RewardTranslationRepository);
  });

  describe('getTranslation() — business entity', () => {
    it('should return the value for the requested locale when found', async () => {
      businessRepo.getField.mockResolvedValue('Pivnoy Dom');

      const result = await service.getTranslation(
        'business',
        'biz-1',
        'hy',
        'name',
        'en',
      );

      expect(result).toBe('Pivnoy Dom');
      expect(businessRepo.getField).toHaveBeenCalledWith('biz-1', 'hy', 'name');
      expect(businessRepo.getField).toHaveBeenCalledTimes(1);
    });

    it('should fall back to defaultLocale when requested locale is missing', async () => {
      businessRepo.getField
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('Beer House');

      const result = await service.getTranslation(
        'business',
        'biz-1',
        'hy',
        'name',
        'en',
      );

      expect(result).toBe('Beer House');
      expect(businessRepo.getField).toHaveBeenCalledTimes(2);
      expect(businessRepo.getField).toHaveBeenNthCalledWith(
        2,
        'biz-1',
        'en',
        'name',
      );
    });

    it('should return null when neither locale has a translation', async () => {
      businessRepo.getField.mockResolvedValue(null);

      const result = await service.getTranslation(
        'business',
        'biz-1',
        'hy',
        'name',
        'en',
      );

      expect(result).toBeNull();
    });

    it('should not make a second DB call when requested locale equals defaultLocale', async () => {
      businessRepo.getField.mockResolvedValue(null);

      const result = await service.getTranslation(
        'business',
        'biz-1',
        'en',
        'name',
        'en',
      );

      expect(result).toBeNull();
      expect(businessRepo.getField).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTranslation() — reward entity', () => {
    it('should use rewardTranslationRepository for reward entity type', async () => {
      rewardRepo.getField.mockResolvedValue('Free Coffee');

      const result = await service.getTranslation(
        'reward',
        'reward-1',
        'en',
        'name',
        'en',
      );

      expect(result).toBe('Free Coffee');
      expect(rewardRepo.getField).toHaveBeenCalledWith(
        'reward-1',
        'en',
        'name',
      );
      expect(businessRepo.getField).not.toHaveBeenCalled();
    });

    it('should fall back to defaultLocale for rewards', async () => {
      rewardRepo.getField
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('Бесплатный кофе');

      const result = await service.getTranslation(
        'reward',
        'reward-1',
        'hy',
        'name',
        'ru',
      );

      expect(result).toBe('Бесплатный кофе');
    });

    it('should return null when neither locale has a reward translation', async () => {
      rewardRepo.getField.mockResolvedValue(null);

      const result = await service.getTranslation(
        'reward',
        'reward-1',
        'hy',
        'name',
        'en',
      );

      expect(result).toBeNull();
    });
  });

  describe('getBusinessTranslations()', () => {
    it('should return all three business fields', async () => {
      businessRepo.getField
        .mockResolvedValueOnce('Beer House')
        .mockResolvedValueOnce('Welcome!')
        .mockResolvedValueOnce('pts');

      const result = await service.getBusinessTranslations('biz-1', 'en', 'en');

      expect(result).toEqual({
        name: 'Beer House',
        welcomeMessage: 'Welcome!',
        pointsLabel: 'pts',
      });
    });
  });

  describe('getRewardTranslations()', () => {
    it('should return name and description for a reward', async () => {
      rewardRepo.getField
        .mockResolvedValueOnce('Free Coffee')
        .mockResolvedValueOnce('One free coffee of your choice');

      const result = await service.getRewardTranslations(
        'reward-1',
        'en',
        'en',
      );

      expect(result).toEqual({
        name: 'Free Coffee',
        description: 'One free coffee of your choice',
      });
    });
  });
});
