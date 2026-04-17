import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTransactionDto {
  @ApiPropertyOptional({ enum: ['earn', 'redeem'] })
  @IsOptional()
  @IsEnum(['earn', 'redeem'])
  type?: 'earn' | 'redeem';

  @ApiPropertyOptional({
    type: String,
    description: 'ISO 8601 date string (from)',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'ISO 8601 date string (to)',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ type: Number, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  limit?: number;

  @ApiPropertyOptional({ type: Number, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offset?: number;
}
