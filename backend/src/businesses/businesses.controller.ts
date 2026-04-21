import {
  Body,
  Controller,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Patch,
  Put,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { TelegramService } from '../telegram/telegram.service';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Business } from './domain/business';
import { BusinessTranslation } from './domain/business-translation';
import { BusinessesService } from './businesses.service';
import { UpdateBotSettingsDto } from './dto/update-bot-settings.dto';
import { UpdateBusinessSettingsDto } from './dto/update-business-settings.dto';
import { UpdateLanguagesDto } from './dto/update-languages.dto';
import { UpdateBusinessTranslationsDto } from './dto/update-business-translations.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Businesses')
@Controller({ path: 'businesses', version: '1' })
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    @Inject(forwardRef(() => TelegramService))
    private readonly telegramService: TelegramService,
  ) {}

  @Roles(RoleEnum.user)
  @ApiOkResponse({
    schema: {
      properties: {
        botUsername: { type: 'string' },
      },
    },
  })
  @Get('customer-info')
  @HttpCode(HttpStatus.OK)
  async getCustomerBusinessInfo(
    @Request() request,
  ): Promise<{ botUsername: string }> {
    const businessId: string | undefined = request.user.businessId;
    if (!businessId) return { botUsername: '' };
    const business = await this.businessesService.findById(businessId);
    return { botUsername: business?.botUsername ?? '' };
  }

  @Roles(RoleEnum.owner)
  @SerializeOptions({ excludeExtraneousValues: false })
  @ApiOkResponse({ type: Business })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMyBusiness(@Request() request): Promise<Business> {
    const business = await this.businessesService.findByOwnerId(
      request.user.id,
    );

    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }

    return business;
  }

  @Roles(RoleEnum.owner)
  @ApiOkResponse({
    schema: {
      properties: {
        webhookRegistered: { type: 'boolean' },
        botUsername: { type: 'string' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @Patch('me/bot-settings')
  @HttpCode(HttpStatus.OK)
  async updateBotSettings(
    @Request() request,
    @Body() dto: UpdateBotSettingsDto,
  ): Promise<{
    webhookRegistered: boolean;
    botUsername: string;
    isActive: boolean;
  }> {
    const business = await this.businessesService.findByOwnerId(
      request.user.id,
    );

    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }

    const result = await this.businessesService.updateBotSettings(
      business.id,
      dto,
    );

    const updated = await this.businessesService.findById(business.id);
    if (updated) {
      await this.telegramService.registerBot({
        id: updated.id,
        botToken: updated.botToken!,
        botUsername: updated.botUsername,
        webhookSecret: updated.webhookSecret,
      });
    }

    return result;
  }

  @Roles(RoleEnum.owner)
  @ApiOkResponse({ type: Business })
  @Patch('me/settings')
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @Request() request,
    @Body() dto: UpdateBusinessSettingsDto,
  ): Promise<Business> {
    const business = await this.businessesService.findByOwnerId(
      request.user.id,
    );

    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }

    return this.businessesService.update(business.id, dto);
  }

  @Roles(RoleEnum.owner)
  @ApiOkResponse({
    schema: {
      properties: {
        supportedLocales: { type: 'array', items: { type: 'string' } },
        defaultLocale: { type: 'string' },
      },
    },
  })
  @Get('me/languages')
  @HttpCode(HttpStatus.OK)
  async getLanguages(
    @Request() request,
  ): Promise<{ supportedLocales: string[]; defaultLocale: string }> {
    const business = await this.businessesService.findByOwnerId(
      request.user.id,
    );

    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }

    return {
      supportedLocales: business.supportedLocales,
      defaultLocale: business.defaultLocale,
    };
  }

  @Roles(RoleEnum.owner)
  @ApiOkResponse({ type: Business })
  @Patch('me/languages')
  @HttpCode(HttpStatus.OK)
  async updateLanguages(
    @Request() request,
    @Body() dto: UpdateLanguagesDto,
  ): Promise<Business> {
    const business = await this.businessesService.findByOwnerId(
      request.user.id,
    );

    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }

    return this.businessesService.updateLanguages(business.id, dto);
  }

  @Roles(RoleEnum.owner)
  @ApiOkResponse({ type: [BusinessTranslation] })
  @Get('me/translations')
  @HttpCode(HttpStatus.OK)
  async getTranslations(
    @Request() request,
  ): Promise<{ translations: BusinessTranslation[] }> {
    const business = await this.businessesService.findByOwnerId(
      request.user.id,
    );

    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }

    const translations = await this.businessesService.getTranslations(
      business.id,
    );

    return { translations };
  }

  @Roles(RoleEnum.owner)
  @ApiOkResponse({ schema: { properties: { updated: { type: 'number' } } } })
  @Put('me/translations')
  @HttpCode(HttpStatus.OK)
  async updateTranslations(
    @Request() request,
    @Body() dto: UpdateBusinessTranslationsDto,
  ): Promise<{ updated: number }> {
    const business = await this.businessesService.findByOwnerId(
      request.user.id,
    );

    if (!business) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        errors: { business: 'notFound' },
      });
    }

    return this.businessesService.updateTranslations(
      business.id,
      dto.translations,
    );
  }
}
