import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateBusinessAdminDto {
  @ApiProperty({ example: 'Beer House Yerevan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: 'owner@beerhouse.am' })
  @IsEmail()
  ownerEmail: string;

  @ApiPropertyOptional({ example: '+37400000000' })
  @IsOptional()
  @IsString()
  ownerPhone?: string;

  @ApiProperty({ example: '123456789:AABBccDDeeFFggHHiiJJkkLLmmNNooP-QQ' })
  @IsString()
  @Matches(/^\d+:[A-Za-z0-9_-]{35}$/, {
    message: 'Invalid bot token format (expected: 123456789:AABBcc...)',
  })
  botToken: string;

  @ApiProperty({ example: '-1001234567890' })
  @IsString()
  @Matches(/^-?\d+$/, { message: 'Must be a numeric chat ID' })
  telegramGroupChatId: string;

  @ApiProperty({ example: 'beer_house_bot' })
  @IsString()
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]{4,}$/, {
    message: 'Must be a valid Telegram username without @',
  })
  botUsername: string;
}
