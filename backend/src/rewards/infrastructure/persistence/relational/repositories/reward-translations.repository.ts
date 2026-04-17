import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NullableType } from '../../../../../utils/types/nullable.type';
import { RewardTranslation } from '../../../../domain/reward-translation';
import { RewardTranslationRepository } from '../../reward-translation.repository';
import { RewardTranslationEntity } from '../entities/reward-translation.entity';
import { RewardTranslationMapper } from '../mappers/reward-translation.mapper';

@Injectable()
export class RewardTranslationsRelationalRepository implements RewardTranslationRepository {
  constructor(
    @InjectRepository(RewardTranslationEntity)
    private readonly repo: Repository<RewardTranslationEntity>,
  ) {}

  async upsert(
    data: Omit<RewardTranslation, 'id'>,
  ): Promise<RewardTranslation> {
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(RewardTranslationEntity)
      .values(RewardTranslationMapper.toPersistence(data as RewardTranslation))
      .orUpdate(['value'], ['rewardId', 'locale', 'field'])
      .execute();

    const saved = await this.repo.findOne({
      where: {
        rewardId: data.rewardId,
        locale: data.locale,
        field: data.field,
      },
    });

    return RewardTranslationMapper.toDomain(saved!);
  }

  async findByReward(rewardId: string): Promise<RewardTranslation[]> {
    const entities = await this.repo.find({ where: { rewardId } });
    return entities.map((e) => RewardTranslationMapper.toDomain(e));
  }

  async findByRewardAndLocale(
    rewardId: string,
    locale: string,
  ): Promise<RewardTranslation[]> {
    const entities = await this.repo.find({ where: { rewardId, locale } });
    return entities.map((e) => RewardTranslationMapper.toDomain(e));
  }

  async getField(
    rewardId: string,
    locale: string,
    field: string,
  ): Promise<NullableType<string>> {
    const entity = await this.repo.findOne({
      where: { rewardId, locale, field },
    });
    return entity ? entity.value : null;
  }
}
