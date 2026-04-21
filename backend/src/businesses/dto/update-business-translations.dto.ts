import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';

class TranslationEntryDto {
  @ApiProperty({ type: String, example: 'en' })
  @IsString()
  locale: string;

  @ApiProperty({ enum: ['name', 'welcomeMessage', 'pointsLabel'] })
  @IsEnum(['name', 'welcomeMessage', 'pointsLabel'])
  field: 'name' | 'welcomeMessage' | 'pointsLabel';

  @ApiProperty({ type: String })
  @IsString()
  value: string;
}

export class UpdateBusinessTranslationsDto {
  @ApiProperty({ type: [TranslationEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TranslationEntryDto)
  translations: TranslationEntryDto[];
}
