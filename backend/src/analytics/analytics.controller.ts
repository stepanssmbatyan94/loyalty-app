import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { AnalyticsService, TopCustomerRow } from './analytics.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { TopCustomersQueryDto } from './dto/top-customers-query.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.owner)
@ApiTags('Analytics')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOkResponse({ type: DashboardResponseDto })
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  getDashboard(@Request() request): Promise<DashboardResponseDto> {
    return this.analyticsService.getDashboard(request.user.id);
  }

  @ApiOkResponse({
    schema: {
      properties: {
        data: { type: 'array' },
        meta: {
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            hasNextPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  @Get('top-customers')
  @HttpCode(HttpStatus.OK)
  getTopCustomers(
    @Request() request,
    @Query() query: TopCustomersQueryDto,
  ): Promise<{
    data: TopCustomerRow[];
    meta: { page: number; limit: number; total: number; hasNextPage: boolean };
  }> {
    return this.analyticsService.getTopCustomers(
      request.user.id,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
