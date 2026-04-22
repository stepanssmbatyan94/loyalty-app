import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Business } from '../../../../domain/business';
import { BusinessRepository } from '../../business.repository';
import { BusinessEntity } from '../entities/business.entity';
import { BusinessMapper } from '../mappers/business.mapper';

@Injectable()
export class BusinessesRelationalRepository implements BusinessRepository {
  constructor(
    @InjectRepository(BusinessEntity)
    private readonly repo: Repository<BusinessEntity>,
  ) {}

  async create(data: Omit<Business, 'id' | 'createdAt'>): Promise<Business> {
    const entity = this.repo.create(
      BusinessMapper.toPersistence(data as Business),
    );
    const saved = await this.repo.save(entity);
    return BusinessMapper.toDomain(saved);
  }

  async findById(id: Business['id']): Promise<NullableType<Business>> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? BusinessMapper.toDomain(entity) : null;
  }

  async findByOwnerId(ownerId: number): Promise<NullableType<Business>> {
    const entity = await this.repo.findOne({ where: { ownerId } });
    return entity ? BusinessMapper.toDomain(entity) : null;
  }

  async findByBotUsername(
    botUsername: string,
  ): Promise<NullableType<Business>> {
    const entity = await this.repo.findOne({ where: { botUsername } });
    return entity ? BusinessMapper.toDomain(entity) : null;
  }

  async findAllActive(): Promise<Business[]> {
    const entities = await this.repo.find({ where: { isActive: true } });
    return entities.map((e) => BusinessMapper.toDomain(e));
  }

  async findAllWithPagination(
    paginationOptions: IPaginationOptions,
  ): Promise<{ data: Business[]; total: number }> {
    const [entities, total] = await this.repo.findAndCount({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: { createdAt: 'DESC' },
    });
    return { data: entities.map((e) => BusinessMapper.toDomain(e)), total };
  }

  async update(
    id: Business['id'],
    payload: Partial<Business>,
  ): Promise<Business> {
    const entity = await this.repo.findOne({ where: { id } });

    if (!entity) {
      throw new Error('Business not found');
    }

    const updated = await this.repo.save(
      this.repo.create(
        BusinessMapper.toPersistence({
          ...BusinessMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return BusinessMapper.toDomain(updated);
  }
}
