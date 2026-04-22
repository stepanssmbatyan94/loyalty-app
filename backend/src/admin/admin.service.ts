import crypto from 'crypto';

import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot } from 'grammy';

import { AllConfigType } from '../config/config.type';
import { MailService } from '../mail/mail.service';
import { BusinessesService } from '../businesses/businesses.service';
import { Business } from '../businesses/domain/business';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { CreateBusinessAdminDto } from './dto/create-business-admin.dto';
import { UpdateBusinessAdminDto } from './dto/update-business-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async findAllBusinesses(
    paginationOptions: IPaginationOptions,
  ): Promise<{ data: Business[]; meta: { page: number; total: number; totalPages: number } }> {
    const { data, total } =
      await this.businessesService.findAllWithPagination(paginationOptions);
    return {
      data,
      meta: {
        page: paginationOptions.page,
        total,
        totalPages: Math.ceil(total / paginationOptions.limit),
      },
    };
  }

  async findBusinessById(id: string): Promise<Business> {
    const business = await this.businessesService.findById(id);
    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }
    return business;
  }

  async provisionBusiness(dto: CreateBusinessAdminDto): Promise<{ business: Business }> {
    const existingUser = await this.usersService.findByEmail(dto.ownerEmail);
    if (existingUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { ownerEmail: 'emailAlreadyExists' },
      });
    }

    const bot = new Bot(dto.botToken);
    try {
      await bot.api.getMe();
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { botToken: 'invalidBotToken' },
      });
    }

    const webhookSecret = crypto.randomBytes(32).toString('hex');
    const tempPassword = crypto.randomBytes(10).toString('base64url').slice(0, 12);

    const business = await this.businessesService.createForAdmin({
      name: dto.name,
      logoUrl: dto.logoUrl ?? null,
      botToken: dto.botToken,
      botUsername: dto.botUsername,
      webhookSecret,
      telegramGroupChatId: dto.telegramGroupChatId,
      earnRateMode: 'per_amd_spent',
      earnRateValue: 100,
      supportedLocales: ['en'],
      defaultLocale: 'en',
      isActive: true,
    });

    const [firstName, ...lastParts] = dto.ownerName.trim().split(' ');
    const lastName = lastParts.join(' ') || '';

    const owner = await this.usersService.createOwner({
      firstName,
      lastName,
      email: dto.ownerEmail,
      tempPassword,
      businessId: business.id as string,
    });

    await this.businessesService.update(business.id, { ownerId: Number(owner.id) });

    await this.telegramService.registerBot({
      id: business.id as string,
      botToken: dto.botToken,
      botUsername: dto.botUsername,
      webhookSecret,
    });

    const adminUrl =
      this.configService.get('app.frontendDomain', { infer: true }) ??
      'http://localhost:3001';

    await this.mailService
      .sendOwnerWelcome({
        to: dto.ownerEmail,
        data: {
          name: dto.ownerName,
          businessName: dto.name,
          loginUrl: `${adminUrl}/login`,
          tempPassword,
        },
      })
      .catch(() => {
        // Email failure is non-fatal — business is provisioned successfully
      });

    return { business };
  }

  async updateBusiness(id: string, dto: UpdateBusinessAdminDto): Promise<Business> {
    await this.findBusinessById(id);
    return this.businessesService.update(id, dto);
  }

  async reregisterWebhook(id: string): Promise<{ ok: boolean }> {
    const business = await this.findBusinessById(id);

    if (!business.botToken) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { botToken: 'botTokenNotConfigured' },
      });
    }

    await this.telegramService.registerBot({
      id: business.id as string,
      botToken: business.botToken,
      botUsername: business.botUsername,
      webhookSecret: business.webhookSecret,
    });

    return { ok: true };
  }
}
