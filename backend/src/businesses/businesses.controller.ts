import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Business } from './domain/business';
import { BusinessesService } from './businesses.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Businesses')
@Controller({ path: 'businesses', version: '1' })
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

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
}
