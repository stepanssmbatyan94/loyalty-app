import { Reward } from '../../../../domain/reward';
import { RewardEntity } from '../entities/reward.entity';

export class RewardMapper {
  static toDomain(raw: RewardEntity): Reward {
    const domain = new Reward();
    domain.id = raw.id;
    domain.businessId = raw.businessId;
    domain.name = raw.name;
    domain.description = raw.description;
    domain.pointsCost = raw.pointsCost;
    domain.imageUrl = raw.imageUrl;
    domain.isActive = raw.isActive;
    domain.stock = raw.stock;
    domain.deletedAt = raw.deletedAt;
    domain.createdAt = raw.createdAt;
    return domain;
  }

  static toPersistence(domain: Reward): RewardEntity {
    const entity = new RewardEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.businessId = domain.businessId;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.pointsCost = domain.pointsCost;
    entity.imageUrl = domain.imageUrl;
    entity.isActive = domain.isActive;
    entity.stock = domain.stock;
    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }
    if (domain.deletedAt !== undefined) {
      entity.deletedAt = domain.deletedAt;
    }
    return entity;
  }
}
