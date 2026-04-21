import crypto from 'crypto';

import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { AllConfigType } from '../config/config.type';
import { NullableType } from '../utils/types/nullable.type';
import { Business } from './domain/business';
import { BusinessTranslation } from './domain/business-translation';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateBotSettingsDto } from './dto/update-bot-settings.dto';
import { UpdateLanguagesDto } from './dto/update-languages.dto';
import { BusinessRepository } from './infrastructure/persistence/business.repository';
import { BusinessTranslationRepository } from './infrastructure/persistence/business-translation.repository';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly businessesRepository: BusinessRepository,
    private readonly businessTranslationRepository: BusinessTranslationRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async create(dto: CreateBusinessDto): Promise<Business> {
    const existing = await this.businessesRepository.findByOwnerId(dto.ownerId);
    if (existing) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { ownerId: 'ownerAlreadyHasBusiness' },
      });
    }

    return this.businessesRepository.create({
      name: dto.name,
      ownerId: dto.ownerId,
      logoUrl: null,
      earnRateMode: dto.earnRateMode ?? 'per_amd_spent',
      earnRateValue: dto.earnRateValue ?? 100,
      botToken: null,
      botUsername: null,
      webhookSecret: null,
      telegramGroupChatId: null,
      supportedLocales: [dto.defaultLocale ?? 'en'],
      defaultLocale: dto.defaultLocale ?? 'en',
      isActive: false,
    });
  }

  findById(id: Business['id']): Promise<NullableType<Business>> {
    return this.businessesRepository.findById(id);
  }

  findByOwnerId(ownerId: number): Promise<NullableType<Business>> {
    return this.businessesRepository.findByOwnerId(ownerId);
  }

  findByBotUsername(botUsername: string): Promise<NullableType<Business>> {
    return this.businessesRepository.findByBotUsername(botUsername);
  }

  findAllActive(): Promise<Business[]> {
    return this.businessesRepository.findAllActive();
  }

  async update(id: Business['id'], dto: UpdateBusinessDto): Promise<Business> {
    return this.businessesRepository.update(id, dto);
  }

  async updateBotSettings(
    id: Business['id'],
    dto: UpdateBotSettingsDto,
  ): Promise<{
    webhookRegistered: boolean;
    botUsername: string;
    isActive: boolean;
  }> {
    const bot = new Bot(dto.botToken);

    let botInfo: { username: string };
    try {
      botInfo = await bot.api.getMe();
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { botToken: 'invalidBotToken' },
      });
    }

    const webhookSecret = crypto.randomBytes(32).toString('hex');

    const webhookBaseUrl = this.configService.get(
      'auth.telegramWebhookBaseUrl',
      {
        infer: true,
      },
    );

    let webhookRegistered = false;
    if (webhookBaseUrl) {
      await bot.api.setWebhook(
        `${webhookBaseUrl}/api/v1/telegram/${id}/webhook`,
        { secret_token: webhookSecret },
      );
      webhookRegistered = true;
    }

    await this.businessesRepository.update(id, {
      botToken: dto.botToken,
      botUsername: botInfo.username,
      webhookSecret,
      telegramGroupChatId: dto.telegramGroupChatId,
      isActive: true,
    });

    return { webhookRegistered, botUsername: botInfo.username, isActive: true };
  }

  async updateLanguages(
    id: Business['id'],
    dto: UpdateLanguagesDto,
  ): Promise<Business> {
    if (!dto.supportedLocales.includes(dto.defaultLocale)) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { defaultLocale: 'mustBeInSupportedLocales' },
      });
    }
    return this.businessesRepository.update(id, {
      supportedLocales: dto.supportedLocales,
      defaultLocale: dto.defaultLocale,
    });
  }

  async updateTranslations(
    businessId: string,
    translations: Array<{
      locale: string;
      field: 'name' | 'welcomeMessage' | 'pointsLabel';
      value: string;
    }>,
  ): Promise<{ updated: number }> {
    for (const t of translations) {
      await this.upsertTranslation({ businessId, ...t });
    }
    return { updated: translations.length };
  }

  upsertTranslation(
    data: Omit<BusinessTranslation, 'id'>,
  ): Promise<BusinessTranslation> {
    return this.businessTranslationRepository.upsert(data);
  }

  getTranslations(businessId: string): Promise<BusinessTranslation[]> {
    return this.businessTranslationRepository.findByBusiness(businessId);
  }

  async getTranslatedField(
    businessId: string,
    locale: string,
    field: 'name' | 'welcomeMessage' | 'pointsLabel',
    defaultLocale: string,
  ): Promise<NullableType<string>> {
    const value = await this.businessTranslationRepository.getField(
      businessId,
      locale,
      field,
    );
    if (value) return value;
    if (locale !== defaultLocale) {
      return this.businessTranslationRepository.getField(
        businessId,
        defaultLocale,
        field,
      );
    }
    return null;
  }
}
