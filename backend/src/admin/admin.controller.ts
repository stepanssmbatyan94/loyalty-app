import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { AdminService } from './admin.service';
import { CreateBusinessAdminDto } from './dto/create-business-admin.dto';
import { UpdateBusinessAdminDto } from './dto/update-business-admin.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(RoleEnum.superadmin)
@ApiTags('Admin')
@Controller({ path: 'admin/businesses', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.adminService.findAllBusinesses({
      page: Number(page),
      limit: Math.min(Number(limit), 100),
    });
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  findOne(@Param('id') id: string) {
    return this.adminService.findBusinessById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse()
  create(@Body() dto: CreateBusinessAdminDto) {
    return this.adminService.provisionBusiness(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  update(@Param('id') id: string, @Body() dto: UpdateBusinessAdminDto) {
    return this.adminService.updateBusiness(id, dto);
  }

  @Post(':id/webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse()
  reregisterWebhook(@Param('id') id: string) {
    return this.adminService.reregisterWebhook(id);
  }
}
