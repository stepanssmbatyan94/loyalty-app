import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { LoyaltyCard } from '../../../../domain/loyalty-card';
import { LoyaltyCardRepository } from '../../loyalty-card.repository';
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
}
