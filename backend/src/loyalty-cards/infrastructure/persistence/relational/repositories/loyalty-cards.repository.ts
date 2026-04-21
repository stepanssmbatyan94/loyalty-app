import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { LoyaltyCard } from '../../../../domain/loyalty-card';
import {
  CustomerSearchResult,
  LoyaltyCardRepository,
} from '../../loyalty-card.repository';
import { LoyaltyCardEntity } from '../entities/loyalty-card.entity';
import { LoyaltyCardMapper } from '../mappers/loyalty-card.mapper';

@Injectable()
export class LoyaltyCardsRelationalRepository implements LoyaltyCardRepository {
  constructor(
    @InjectRepository(LoyaltyCardEntity)
    private readonly repo: Repository<LoyaltyCardEntity>,
  ) {}

  async create(
    data: Omit<LoyaltyCard, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LoyaltyCard> {
    const entity = this.repo.create(
      LoyaltyCardMapper.toPersistence(data as LoyaltyCard),
    );
    const saved = await this.repo.save(entity);
    return LoyaltyCardMapper.toDomain(saved);
  }

  async findById(id: LoyaltyCard['id']): Promise<NullableType<LoyaltyCard>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? LoyaltyCardMapper.toDomain(entity) : null;
  }

  async findByCustomerAndBusiness(
    customerId: number,
    businessId: string,
  ): Promise<NullableType<LoyaltyCard>> {
    const entity = await this.repo.findOne({
      where: { customerId, businessId },
    });
    return entity ? LoyaltyCardMapper.toDomain(entity) : null;
  }

  async save(card: LoyaltyCard): Promise<LoyaltyCard> {
    const entity = await this.repo.save(LoyaltyCardMapper.toPersistence(card));
    return LoyaltyCardMapper.toDomain(entity);
  }

  async searchCustomers(
    businessId: string,
    query: string,
  ): Promise<CustomerSearchResult[]> {
    const q = `%${query.toLowerCase()}%`;
    return this.repo
      .createQueryBuilder('card')
      .innerJoin(UserEntity, 'u', 'u.id = card.customerId')
      .where('card.businessId = :businessId', { businessId })
      .andWhere(
        '(LOWER(u.firstName) LIKE :q OR LOWER(u.lastName) LIKE :q)',
        { q },
      )
      .select('card.id', 'cardId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('card.points', 'points')
      .addSelect('card.totalPointsEarned', 'totalPointsEarned')
      .limit(3)
      .getRawMany<CustomerSearchResult>();
  }
}
