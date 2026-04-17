import { Redemption } from '../../../../domain/redemption';
import { RedemptionEntity } from '../entities/redemption.entity';

export class RedemptionMapper {
  static toDomain(raw: RedemptionEntity): Redemption {
    const domain = new Redemption();
    domain.id = raw.id;
    domain.cardId = raw.cardId;
    domain.rewardId = raw.rewardId;
    domain.code = raw.code;
    domain.qrData = raw.qrData;
    domain.pointsCost = raw.pointsCost;
    domain.status = raw.status;
    domain.expiresAt = raw.expiresAt;
    domain.confirmedAt = raw.confirmedAt;
    domain.cashierTelegramId = raw.cashierTelegramId
      ? Number(raw.cashierTelegramId)
      : null;
    domain.createdAt = raw.createdAt;
    return domain;
  }

  static toPersistence(domain: Redemption): RedemptionEntity {
    const entity = new RedemptionEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.cardId = domain.cardId;
    entity.rewardId = domain.rewardId;
    entity.code = domain.code;
    entity.qrData = domain.qrData;
    entity.pointsCost = domain.pointsCost;
    entity.status = domain.status;
    entity.expiresAt = domain.expiresAt;
    entity.confirmedAt = domain.confirmedAt;
    entity.cashierTelegramId = domain.cashierTelegramId;
    return entity;
  }
}
