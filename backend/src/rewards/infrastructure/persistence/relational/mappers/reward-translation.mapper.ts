import { RewardTranslation } from '../../../../domain/reward-translation';
import { RewardTranslationEntity } from '../entities/reward-translation.entity';

export class RewardTranslationMapper {
  static toDomain(raw: RewardTranslationEntity): RewardTranslation {
    const domain = new RewardTranslation();
    domain.id = raw.id;
    domain.rewardId = raw.rewardId;
    domain.locale = raw.locale;
    domain.field = raw.field as RewardTranslation['field'];
    domain.value = raw.value;
    return domain;
  }

  static toPersistence(domain: RewardTranslation): RewardTranslationEntity {
    const entity = new RewardTranslationEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.rewardId = domain.rewardId;
    entity.locale = domain.locale;
    entity.field = domain.field;
    entity.value = domain.value;
    return entity;
  }
}
