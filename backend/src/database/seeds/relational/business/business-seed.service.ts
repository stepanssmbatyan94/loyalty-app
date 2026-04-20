import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { BusinessEntity } from '../../../../businesses/infrastructure/persistence/relational/entities/business.entity';
import { RoleEnum } from '../../../../roles/roles.enum';
import { StatusEnum } from '../../../../statuses/statuses.enum';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class BusinessSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(BusinessEntity)
    private readonly businessRepo: Repository<BusinessEntity>,
  ) {}

  async run(): Promise<void> {
    // TODO [B-27b]: Remove env-based bot token injection once multi-tenant bot provisioning
    // is implemented. Real flow: owner submits token via PATCH /api/v1/businesses/me/bot-settings
    // → backend validates via Telegram getMe, generates webhookSecret, calls setWebhook,
    // registers bot in BotRegistry, sets isActive: true. Seed is dev-only scaffolding.
    const botToken = process.env.TELEGRAM_BOT_TOKEN ?? null;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? null;

    // Ensure the owner account exists
    let owner = await this.userRepo.findOne({
      where: { email: 'owner@beerhouse.am' },
    });

    if (!owner) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      owner = await this.userRepo.save(
        this.userRepo.create({
          firstName: 'Beer House',
          lastName: 'Owner',
          email: 'owner@beerhouse.am',
          password,
          role: { id: RoleEnum.owner, name: 'Owner' },
          status: { id: StatusEnum.active, name: 'Active' },
        }),
      );
    }

    // Ensure the Beer House business exists
    const existing = await this.businessRepo.findOne({
      where: { ownerId: owner.id },
    });

    if (!existing) {
      await this.businessRepo.save(
        this.businessRepo.create({
          name: 'Beer House',
          ownerId: owner.id,
          logoUrl: null,
          earnRateMode: 'per_amd_spent',
          earnRateValue: 100,
          botToken,
          botUsername,
          webhookSecret: null,
          telegramGroupChatId: null,
          supportedLocales: ['en', 'ru', 'hy'],
          defaultLocale: 'en',
          isActive: !!botToken,
        }),
      );
    } else if (botToken && !existing.botToken) {
      // Patch existing record with bot credentials from env
      await this.businessRepo.update(existing.id, {
        botToken,
        botUsername,
        isActive: true,
      });
    }
  }
}
