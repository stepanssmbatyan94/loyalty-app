import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
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
import { RedemptionDetailDto } from './dto/redemption-detail.dto';
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

  // Cashier: validate a redemption by code (for bot scan flow)
  @Roles(RoleEnum.cashier)
  @ApiOkResponse()
  @Get('validate/:code')
  @HttpCode(HttpStatus.OK)
  async validateByCode(@Param('code') code: string) {
    const result = await this.redemptionsService.findByCodeForValidation(code);
    if (!result) throw new NotFoundException();
    return result;
  }

  // Customer: get redemption details by id (polled by Mini App)
  @Roles(RoleEnum.user)
  @ApiOkResponse({ type: RedemptionDetailDto })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string): Promise<RedemptionDetailDto> {
    const result = await this.redemptionsService.findByIdWithDetails(id);
    if (!result) throw new NotFoundException();
    return result;
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
