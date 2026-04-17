import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { Redemption } from '../../../../domain/redemption';
import { RedemptionRepository } from '../../redemption.repository';
import { RedemptionEntity } from '../entities/redemption.entity';
import { RedemptionMapper } from '../mappers/redemption.mapper';

@Injectable()
export class RedemptionsRelationalRepository implements RedemptionRepository {
  constructor(
    @InjectRepository(RedemptionEntity)
    private readonly repo: Repository<RedemptionEntity>,
  ) {}

  async create(
    data: Omit<Redemption, 'id' | 'createdAt'>,
  ): Promise<Redemption> {
    const entity = this.repo.create(
      RedemptionMapper.toPersistence(data as Redemption),
    );
    const saved = await this.repo.save(entity);
    return RedemptionMapper.toDomain(saved);
  }

  async findById(id: string): Promise<NullableType<Redemption>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? RedemptionMapper.toDomain(entity) : null;
  }

  async findByCode(code: string): Promise<NullableType<Redemption>> {
    const entity = await this.repo.findOne({ where: { code } });
    return entity ? RedemptionMapper.toDomain(entity) : null;
  }

  async findPendingExpired(now: Date): Promise<Redemption[]> {
    const entities = await this.repo.find({
      where: { status: 'pending', expiresAt: LessThan(now) },
    });
    return entities.map((e) => RedemptionMapper.toDomain(e));
  }

  async save(redemption: Redemption): Promise<Redemption> {
    const entity = RedemptionMapper.toPersistence(redemption);
    const saved = await this.repo.save(entity);
    return RedemptionMapper.toDomain(saved);
  }
}
