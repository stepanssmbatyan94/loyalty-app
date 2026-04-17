import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpsertBusinessTranslationDto {
  @ApiProperty({ type: String, example: 'en' })
  @IsString()
  @IsNotEmpty()
  locale: string;

  @ApiProperty({ enum: ['name', 'welcomeMessage', 'pointsLabel'] })
  @IsEnum(['name', 'welcomeMessage', 'pointsLabel'])
  field: 'name' | 'welcomeMessage' | 'pointsLabel';

  @ApiProperty({ type: String, example: 'Welcome to Beer House!' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
