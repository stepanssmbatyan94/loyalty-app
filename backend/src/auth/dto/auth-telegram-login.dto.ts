import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AuthTelegramLoginDto {
  @ApiProperty({
    description:
      'Raw Telegram initData string from WebApp.initData (URL-encoded key=value pairs)',
    example: 'query_id=AAH...&user=%7B...%7D&auth_date=1234567890&hash=abc123',
  })
  @IsString()
  @IsNotEmpty()
  initData: string;
}
