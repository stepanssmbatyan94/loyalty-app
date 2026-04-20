import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Request,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { LoyaltyCardMeResponseDto } from './dto/loyalty-card-me-response.dto';
import { LoyaltyCardsService } from './loyalty-cards.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('LoyaltyCards')
@Controller({ path: 'loyalty-cards', version: '1' })
export class LoyaltyCardsController {
  constructor(private readonly loyaltyCardsService: LoyaltyCardsService) {}

  @ApiOkResponse({ type: LoyaltyCardMeResponseDto })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(
    @Request() request: { user: JwtPayloadType },
  ): Promise<LoyaltyCardMeResponseDto> {
    const customerId = request.user.id as number;
    const businessId: string | undefined = request.user.businessId;

    if (!businessId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { businessId: 'missingInToken' },
      });
    }

    return this.loyaltyCardsService.getCardWithProgress(customerId, businessId);
  }
}
