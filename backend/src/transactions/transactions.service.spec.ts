import { Test, TestingModule } from '@nestjs/testing';

import { TransactionRepository } from './infrastructure/persistence/transaction.repository';
import { TransactionsService } from './transactions.service';

const mockTransaction = {
  id: 'txn-uuid-1',
  cardId: 'card-uuid-1',
  type: 'earn' as const,
  points: 120,
  cashierTelegramId: null,
  rewardId: null,
  note: null,
  createdAt: new Date('2024-01-01'),
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionRepository,
          useValue: {
            create: jest.fn(),
            findManyByCardId: jest.fn(),
            findRecentByBusinessId: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get(TransactionRepository);
  });

  describe('create()', () => {
    it('should create and return a transaction', async () => {
      transactionRepository.create.mockResolvedValue(mockTransaction);

      const result = await service.create({
        cardId: 'card-uuid-1',
        type: 'earn',
        points: 120,
        cashierTelegramId: null,
        rewardId: null,
        note: null,
      });

      expect(transactionRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('findManyByCardId()', () => {
    it('should return transactions for a card with default pagination', async () => {
      transactionRepository.findManyByCardId.mockResolvedValue([
        mockTransaction,
      ]);

      const result = await service.findManyByCardId('card-uuid-1', {});

      expect(transactionRepository.findManyByCardId).toHaveBeenCalledWith(
        'card-uuid-1',
        {
          type: undefined,
          from: undefined,
          to: undefined,
          limit: 20,
          offset: 0,
        },
      );
      expect(result).toHaveLength(1);
    });

    it('should pass type filter to repository', async () => {
      transactionRepository.findManyByCardId.mockResolvedValue([
        mockTransaction,
      ]);

      await service.findManyByCardId('card-uuid-1', { type: 'earn' });

      expect(transactionRepository.findManyByCardId).toHaveBeenCalledWith(
        'card-uuid-1',
        expect.objectContaining({ type: 'earn' }),
      );
    });

    it('should pass date filters to repository', async () => {
      transactionRepository.findManyByCardId.mockResolvedValue([]);

      await service.findManyByCardId('card-uuid-1', {
        from: '2024-01-01',
        to: '2024-12-31',
      });

      expect(transactionRepository.findManyByCardId).toHaveBeenCalledWith(
        'card-uuid-1',
        expect.objectContaining({
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        }),
      );
    });

    it('should return empty array when no transactions found', async () => {
      transactionRepository.findManyByCardId.mockResolvedValue([]);

      const result = await service.findManyByCardId('card-uuid-1', {});

      expect(result).toHaveLength(0);
    });
  });

  describe('findRecentByBusinessId()', () => {
    it('should return recent transactions for a business', async () => {
      transactionRepository.findRecentByBusinessId.mockResolvedValue([
        mockTransaction,
      ]);

      const result = await service.findRecentByBusinessId(
        'business-uuid-1',
        10,
      );

      expect(transactionRepository.findRecentByBusinessId).toHaveBeenCalledWith(
        'business-uuid-1',
        10,
      );
      expect(result).toHaveLength(1);
    });

    it('should use default limit of 20 when not specified', async () => {
      transactionRepository.findRecentByBusinessId.mockResolvedValue([]);

      await service.findRecentByBusinessId('business-uuid-1');

      expect(transactionRepository.findRecentByBusinessId).toHaveBeenCalledWith(
        'business-uuid-1',
        20,
      );
    });
  });
});
