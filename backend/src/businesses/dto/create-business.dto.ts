import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ type: String, example: 'Beer House' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'User ID of the owner',
  })
  @IsNumber()
  ownerId: number;

  @ApiPropertyOptional({
    enum: ['per_amd_spent', 'fixed_per_visit'],
    default: 'per_amd_spent',
  })
  @IsOptional()
  @IsEnum(['per_amd_spent', 'fixed_per_visit'])
  earnRateMode?: 'per_amd_spent' | 'fixed_per_visit';

  @ApiPropertyOptional({ type: Number, example: 100, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  earnRateValue?: number;

  @ApiPropertyOptional({ type: String, example: 'en' })
  @IsOptional()
  @IsString()
  @IsIn(['en', 'ru', 'hy', 'fr', 'de', 'es', 'ar'])
  defaultLocale?: string;
}
