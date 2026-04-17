import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BusinessEntity } from '../../../../businesses/infrastructure/persistence/relational/entities/business.entity';
import { LoyaltyCardEntity } from '../../../../loyalty-cards/infrastructure/persistence/relational/entities/loyalty-card.entity';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { TransactionEntity } from '../../../../transactions/infrastructure/persistence/relational/entities/transaction.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

// Fixed Telegram ID used in the dev test initData string
const DEV_TELEGRAM_ID = '123456789';

@Injectable()
export class CustomerSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(LoyaltyCardEntity)
    private readonly cardRepo: Repository<LoyaltyCardEntity>,
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
  ) {}

  async run(): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { name: 'Beer House' },
    });
    if (!business) return; // business seed hasn't run

    // Find or create the test customer
    let customer = await this.userRepo.findOne({
      where: { socialId: DEV_TELEGRAM_ID, provider: 'telegram' },
    });

    if (!customer) {
      customer = await this.userRepo.save(
        this.userRepo.create({
          firstName: 'Test',
          lastName: 'Customer',
          provider: 'telegram',
          socialId: DEV_TELEGRAM_ID,
          role: { id: RoleEnum.user, name: 'User' },
          status: { id: StatusEnum.active, name: 'Active' },
        }),
      );
    }

    // Find or create the loyalty card
    let card = await this.cardRepo.findOne({
      where: { customerId: customer.id, businessId: business.id },
    });

    if (!card) {
      card = await this.cardRepo.save(
        this.cardRepo.create({
          customerId: customer.id,
          businessId: business.id,
          points: 350,
          totalPointsEarned: 470,
        }),
      );

      // Seed 3 transactions so Recent Activity is visible
      const txCount = await this.txRepo.count({ where: { cardId: card.id } });
      if (txCount === 0) {
        await this.txRepo.save([
          this.txRepo.create({
            cardId: card.id,
            type: 'earn',
            points: 350,
            cashierTelegramId: null,
            rewardId: null,
            note: 'Dinner — 35,000 AMD',
          }),
          this.txRepo.create({
            cardId: card.id,
            type: 'earn',
            points: 120,
            cashierTelegramId: null,
            rewardId: null,
            note: 'Drinks — 12,000 AMD',
          }),
          this.txRepo.create({
            cardId: card.id,
            type: 'redeem',
            points: 120,
            cashierTelegramId: null,
            rewardId: null,
            note: 'Free Pint (partial)',
          }),
        ]);
      }
    }
  }
}
