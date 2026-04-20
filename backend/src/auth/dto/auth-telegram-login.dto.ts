import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class AuthTelegramLoginDto {
  @ApiProperty({
    description:
      'Raw Telegram initData string from WebApp.initData (URL-encoded key=value pairs)',
    example: 'query_id=AAH...&user=%7B...%7D&auth_date=1234567890&hash=abc123',
  })
  @IsString()
  @IsNotEmpty()
  initData: string;

  @ApiPropertyOptional({
    description:
      'Business ID — required when the app is opened via a web_app button URL (?startapp=<id>) where Telegram does not inject start_param into initData',
    example: 'uuid-of-business',
  })
  @IsString()
  @IsOptional()
  businessId?: string;
}
