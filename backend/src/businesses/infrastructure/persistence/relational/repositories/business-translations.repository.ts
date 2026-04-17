import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { BusinessTranslation } from '../../../../domain/business-translation';
import { BusinessTranslationRepository } from '../../business-translation.repository';
import { BusinessTranslationEntity } from '../entities/business-translation.entity';
import { BusinessTranslationMapper } from '../mappers/business-translation.mapper';

@Injectable()
export class BusinessTranslationsRelationalRepository implements BusinessTranslationRepository {
  constructor(
    @InjectRepository(BusinessTranslationEntity)
    private readonly repo: Repository<BusinessTranslationEntity>,
  ) {}

  async upsert(
    data: Omit<BusinessTranslation, 'id'>,
  ): Promise<BusinessTranslation> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(BusinessTranslationEntity)
      .values(
        BusinessTranslationMapper.toPersistence(data as BusinessTranslation),
      )
      .orUpdate(['value'], ['businessId', 'locale', 'field'])
      .execute();

    const saved = await this.repo.findOne({
      where: {
        businessId: data.businessId,
        locale: data.locale,
        field: data.field,
      },
    });

    return BusinessTranslationMapper.toDomain(saved!);
  }

  async findByBusiness(businessId: string): Promise<BusinessTranslation[]> {
    const entities = await this.repo.find({ where: { businessId } });
    return entities.map((e) => BusinessTranslationMapper.toDomain(e));
  }

  async findByBusinessAndLocale(
    businessId: string,
    locale: string,
  ): Promise<BusinessTranslation[]> {
    const entities = await this.repo.find({ where: { businessId, locale } });
    return entities.map((e) => BusinessTranslationMapper.toDomain(e));
  }

  async getField(
    businessId: string,
    locale: string,
    field: string,
  ): Promise<NullableType<string>> {
    const entity = await this.repo.findOne({
      where: { businessId, locale, field },
    });
    return entity ? entity.value : null;
  }
}
