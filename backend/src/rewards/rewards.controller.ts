import {
  Body,
  Controller,
  Delete,
  forwardRef,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { LoyaltyCardsService } from '../loyalty-cards/loyalty-cards.service';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Reward } from './domain/reward';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { RewardsService } from './rewards.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Rewards')
@Controller({ path: 'rewards', version: '1' })
export class RewardsController {
  constructor(
    private readonly rewardsService: RewardsService,
    @Inject(forwardRef(() => LoyaltyCardsService))
    private readonly loyaltyCardsService: LoyaltyCardsService,
  ) {}

  // Customer: browse active rewards for their business
  @Roles(RoleEnum.user)
  @ApiOkResponse({ type: [Reward] })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getCatalog(
    @Request() request,
  ): ReturnType<RewardsService['findActiveWithEligibility']> {
    const businessId: string = request.user.businessId;
    const cardId: string | undefined = request.user.cardId;
    let points = 0;
    if (cardId) {
      const card = await this.loyaltyCardsService.findById(cardId);
      points = card?.points ?? 0;
    }
    return this.rewardsService.findActiveWithEligibility(businessId, points);
  }

  // Owner: create a reward for their business
  @Roles(RoleEnum.owner)
  @ApiCreatedResponse({ type: Reward })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() request, @Body() dto: CreateRewardDto): Promise<Reward> {
    const businessId: string = request.user.businessId;
    return this.rewardsService.create({
      businessId,
      name: dto.name,
      description: dto.description ?? null,
      pointsCost: dto.pointsCost,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? true,
      stock: dto.stock ?? null,
    });
  }

  // Owner: update a reward
  @Roles(RoleEnum.owner)
  @ApiOkResponse({ type: Reward })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() dto: UpdateRewardDto,
  ): Promise<Reward> {
    const businessId: string = request.user.businessId;
    return this.rewardsService.update(id, businessId, dto);
  }

  // Owner: soft-delete a reward
  @Roles(RoleEnum.owner)
  @ApiNoContentResponse()
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() request, @Param('id') id: string): Promise<void> {
    const businessId: string = request.user.businessId;
    return this.rewardsService.softDelete(id, businessId);
  }
}
