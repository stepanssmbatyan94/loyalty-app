import { Business } from '../../../../domain/business';
import { BusinessEntity } from '../entities/business.entity';

export class BusinessMapper {
  static toDomain(raw: BusinessEntity): Business {
    const domain = new Business();
    domain.id = raw.id;
    domain.name = raw.name;
    domain.ownerId = raw.ownerId;
    domain.logoUrl = raw.logoUrl;
    domain.earnRateMode = raw.earnRateMode;
    domain.earnRateValue = raw.earnRateValue;
    domain.botToken = raw.botToken;
    domain.botUsername = raw.botUsername;
    domain.webhookSecret = raw.webhookSecret;
    domain.telegramGroupChatId = raw.telegramGroupChatId;
    domain.supportedLocales = raw.supportedLocales;
    domain.defaultLocale = raw.defaultLocale;
    domain.isActive = raw.isActive;
    domain.createdAt = raw.createdAt;
    return domain;
  }

  static toPersistence(domain: Business): BusinessEntity {
    const entity = new BusinessEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.name = domain.name;
    entity.ownerId = domain.ownerId;
    entity.logoUrl = domain.logoUrl;
    entity.earnRateMode = domain.earnRateMode;
    entity.earnRateValue = domain.earnRateValue;
    entity.botToken = domain.botToken;
    entity.botUsername = domain.botUsername;
    entity.webhookSecret = domain.webhookSecret;
    entity.telegramGroupChatId = domain.telegramGroupChatId;
    entity.supportedLocales = domain.supportedLocales;
    entity.defaultLocale = domain.defaultLocale;
    entity.isActive = domain.isActive;
    if (domain.createdAt) {
      entity.createdAt = domain.createdAt;
    }
    return entity;
  }
}
