import { ScanToken } from '../../../../domain/scan-token';
import { ScanTokenEntity } from '../entities/scan-token.entity';

export class ScanTokenMapper {
  static toDomain(raw: ScanTokenEntity): ScanToken {
    const domain = new ScanToken();
    domain.id = raw.id;
    domain.cardId = raw.cardId;
    domain.businessId = raw.businessId;
    domain.token = raw.token;
    domain.expiresAt = raw.expiresAt;
    domain.usedAt = raw.usedAt;
    domain.createdAt = raw.createdAt;
    return domain;
  }

  static toPersistence(domain: ScanToken): ScanTokenEntity {
    const entity = new ScanTokenEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.cardId = domain.cardId;
    entity.businessId = domain.businessId;
    entity.token = domain.token;
    entity.expiresAt = domain.expiresAt;
    entity.usedAt = domain.usedAt;
    return entity;
  }
}
