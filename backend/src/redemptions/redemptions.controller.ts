import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Redemption } from './domain/redemption';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { RedemptionsService } from './redemptions.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Redemptions')
@Controller({ path: 'redemptions', version: '1' })
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  // Customer: initiate a redemption (pre-deducts points)
  @Roles(RoleEnum.user)
  @ApiCreatedResponse({ type: Redemption })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Request() request,
    @Body() dto: CreateRedemptionDto,
  ): Promise<Redemption> {
    const customerId: number = request.user.id;
    const businessId: string = request.user.businessId;
    return this.redemptionsService.create(customerId, businessId, dto.rewardId);
  }

  // Cashier: confirm a redemption by code
  @Roles(RoleEnum.cashier)
  @ApiOkResponse({ type: Redemption })
  @Patch(':code/confirm')
  @HttpCode(HttpStatus.OK)
  confirm(
    @Request() request,
    @Param('code') code: string,
  ): Promise<Redemption> {
    const cashierTelegramId: number = request.user.telegramId;
    return this.redemptionsService.confirm(code, cashierTelegramId);
  }

  // Customer: cancel their own pending redemption
  @Roles(RoleEnum.user)
  @ApiOkResponse({ type: Redemption })
  @Patch(':code/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('code') code: string): Promise<Redemption> {
    return this.redemptionsService.cancel(code);
  }
}
