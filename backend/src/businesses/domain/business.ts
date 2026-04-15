import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export class Business {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Beer House' })
  name: string;

  @ApiProperty({ type: Number, example: 1 })
  ownerId: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  logoUrl: string | null;

  @ApiProperty({
    enum: ['per_amd_spent', 'fixed_per_visit'],
    example: 'per_amd_spent',
  })
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';

  @ApiProperty({ type: Number, example: 100 })
  earnRateValue: number;

  @Exclude({ toPlainOnly: true })
  botToken: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'beer_house_bot' })
  botUsername: string | null;

  @Exclude({ toPlainOnly: true })
  webhookSecret: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  telegramGroupChatId: string | null;

  @ApiProperty({ type: [String], example: ['en'] })
  supportedLocales: string[];

  @ApiProperty({ type: String, example: 'en' })
  defaultLocale: string;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;
}
