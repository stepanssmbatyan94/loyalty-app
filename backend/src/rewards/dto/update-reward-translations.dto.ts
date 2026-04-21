import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

class RewardTranslationEntryDto {
  @ApiProperty({ type: String, example: 'en' })
  @IsString()
  locale: string;

  @ApiProperty({ enum: ['name', 'description'] })
  @IsEnum(['name', 'description'])
  field: 'name' | 'description';

  @ApiProperty({ type: String })
  @IsString()
  value: string;
}

export class UpdateRewardTranslationsDto {
  @ApiProperty({ type: [RewardTranslationEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RewardTranslationEntryDto)
  translations: RewardTranslationEntryDto[];
}
