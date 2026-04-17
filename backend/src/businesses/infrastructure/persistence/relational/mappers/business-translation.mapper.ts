import { BusinessTranslation } from '../../../../domain/business-translation';
import { BusinessTranslationEntity } from '../entities/business-translation.entity';

export class BusinessTranslationMapper {
  static toDomain(raw: BusinessTranslationEntity): BusinessTranslation {
    const domain = new BusinessTranslation();
    domain.id = raw.id;
    domain.businessId = raw.businessId;
    domain.locale = raw.locale;
    domain.field = raw.field as BusinessTranslation['field'];
    domain.value = raw.value;
    return domain;
  }

  static toPersistence(domain: BusinessTranslation): BusinessTranslationEntity {
    const entity = new BusinessTranslationEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.businessId = domain.businessId;
    entity.locale = domain.locale;
    entity.field = domain.field;
    entity.value = domain.value;
    return entity;
  }
}
