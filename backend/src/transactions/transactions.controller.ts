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
import { Transaction } from './domain/transaction';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Transactions')
@Controller({ path: 'transactions', version: '1' })
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Customer: get their own transaction history
  @Roles(RoleEnum.user)
  @ApiOkResponse({ type: [Transaction] })
  @Get()
  @HttpCode(HttpStatus.OK)
  findMany(
    @Request() request,
    @Query() query: QueryTransactionDto,
  ): Promise<Transaction[]> {
    const cardId: string = request.user.cardId;
    return this.transactionsService.findManyByCardId(cardId, query);
  }
}
