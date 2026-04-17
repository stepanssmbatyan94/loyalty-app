import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  cardId: string;

  @ApiProperty({ enum: ['earn', 'redeem'] })
  @IsEnum(['earn', 'redeem'])
  type: 'earn' | 'redeem';

  @ApiProperty({ type: Number, description: 'Must be positive' })
  @IsInt()
  @IsPositive()
  points: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  cashierTelegramId?: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  rewardId?: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  note?: string | null;
}
