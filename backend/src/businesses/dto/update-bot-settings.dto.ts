import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateBotSettingsDto {
  @ApiProperty({ type: String, description: 'Telegram Bot API token' })
  @IsString()
  @IsNotEmpty()
  botToken: string;

  @ApiProperty({ type: String, example: '-1001234567890' })
  @IsString()
  @IsNotEmpty()
  telegramGroupChatId: string;
}
