import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCashierDto {
  @ApiProperty({ type: String, example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ type: String, example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ type: String, example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ type: String, example: '123456789' })
  @IsOptional()
  @IsString()
  telegramUserId?: string;
}
