import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateRewardDto {
  @ApiProperty({ type: String, example: 'Free Pint' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ type: Number, example: 500 })
  @IsInt()
  @IsPositive()
  @Min(1)
  pointsCost: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  stock?: number | null;
}
