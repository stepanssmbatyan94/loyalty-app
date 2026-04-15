import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';

import { NullableType } from '../utils/types/nullable.type';
import { Business } from './domain/business';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessRepository } from './infrastructure/persistence/business.repository';

@Injectable()
export class BusinessesService {
  constructor(private readonly businessesRepository: BusinessRepository) {}

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

  async update(
    id: Business['id'],
    dto: UpdateBusinessDto,
  ): Promise<Business> {
    return this.businessesRepository.update(id, dto);
  }
}
