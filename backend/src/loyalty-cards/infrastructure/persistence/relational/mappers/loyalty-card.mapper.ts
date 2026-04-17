import { LoyaltyCard } from '../../../../domain/loyalty-card';
import { LoyaltyCardEntity } from '../entities/loyalty-card.entity';

export class LoyaltyCardMapper {
  static toDomain(raw: LoyaltyCardEntity): LoyaltyCard {
    const domain = new LoyaltyCard();
    domain.id = raw.id;
    domain.customerId = raw.customerId;
    domain.businessId = raw.businessId;
    domain.points = raw.points;
    domain.totalPointsEarned = raw.totalPointsEarned;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    return domain;
  }

  static toPersistence(domain: LoyaltyCard): LoyaltyCardEntity {
    const entity = new LoyaltyCardEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.customerId = domain.customerId;
    entity.businessId = domain.businessId;
    entity.points = domain.points;
    entity.totalPointsEarned = domain.totalPointsEarned;
    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }
    if (domain.updatedAt) {
      entity.updatedAt = domain.updatedAt;
    }
    return entity;
  }
}
