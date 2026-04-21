import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { Reward } from '../../../../domain/reward';
import { RewardRepository } from '../../reward.repository';
import { RewardEntity } from '../entities/reward.entity';
import { RewardMapper } from '../mappers/reward.mapper';

@Injectable()
export class RewardsRelationalRepository implements RewardRepository {
  constructor(
    @InjectRepository(RewardEntity)
    private readonly repo: Repository<RewardEntity>,
  ) {}

  async create(
    data: Omit<Reward, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<Reward> {
    const entity = this.repo.create(RewardMapper.toPersistence(data as Reward));
    const saved = await this.repo.save(entity);
    return RewardMapper.toDomain(saved);
  }

  async findById(id: Reward['id']): Promise<NullableType<Reward>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? RewardMapper.toDomain(entity) : null;
  }

  async findAllActiveByBusinessId(businessId: string): Promise<Reward[]> {
    const entities = await this.repo.find({
      where: { businessId, isActive: true },
      order: { pointsCost: 'ASC' },
    });
    return entities.map((e) => RewardMapper.toDomain(e));
  }

  async findAllByBusinessId(businessId: string): Promise<Reward[]> {
    const entities = await this.repo.find({
      where: { businessId },
      withDeleted: true,
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => RewardMapper.toDomain(e));
  }

  async update(id: Reward['id'], payload: Partial<Reward>): Promise<Reward> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      throw new Error('Reward not found');
    }

    const updated = await this.repo.save(
      this.repo.create(
        RewardMapper.toPersistence({
          ...RewardMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return RewardMapper.toDomain(updated);
  }

  async softDelete(id: Reward['id']): Promise<void> {
    await this.repo.softDelete(id);
  }
}
