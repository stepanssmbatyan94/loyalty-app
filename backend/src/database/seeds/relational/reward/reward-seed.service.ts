import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BusinessEntity } from '../../../../businesses/infrastructure/persistence/relational/entities/business.entity';
import { RewardEntity } from '../../../../rewards/infrastructure/persistence/relational/entities/reward.entity';

const REWARDS = [
  {
    name: 'Free Pint',
    description: 'Enjoy a complimentary pint of your favourite beer',
    pointsCost: 500,
    isActive: true,
    stock: null,
  },
  {
    name: 'Half Off Burger',
    description: '50% discount on any burger from our menu',
    pointsCost: 800,
    isActive: true,
    stock: null,
  },
  {
    name: 'Appetizer Platter',
    description: 'A sharing platter of mixed appetizers on us',
    pointsCost: 1200,
    isActive: true,
    stock: null,
  },
  {
    name: 'Beer Flight',
    description: 'Four 150ml tasters of craft beers of your choice',
    pointsCost: 1500,
    isActive: true,
    stock: null,
  },
];

@Injectable()
export class RewardSeedService {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
    @InjectRepository(RewardEntity)
    private readonly rewardRepo: Repository<RewardEntity>,
  ) {}

  async run(): Promise<void> {
    const business = await this.businessRepo.findOne({
      where: { name: 'Beer House' },
    });

    if (!business) {
      // Business seed hasn't run or failed — skip
      return;
    }

    for (const reward of REWARDS) {
      const existing = await this.rewardRepo.findOne({
        where: { businessId: business.id, name: reward.name },
      });

      if (!existing) {
        await this.rewardRepo.save(
          this.rewardRepo.create({
            businessId: business.id,
            name: reward.name,
            description: reward.description,
            pointsCost: reward.pointsCost,
            imageUrl: null,
            isActive: reward.isActive,
            stock: reward.stock,
          }),
        );
      }
    }
  }
}
