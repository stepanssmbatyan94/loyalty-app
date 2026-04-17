import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Redemption {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  cardId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  rewardId: string;

  @ApiProperty({
    type: String,
    example: '459201',
    description: '6-digit numeric code',
  })
  code: string;

  @ApiProperty({
    type: String,
    description: 'URL encoding the code for QR display',
  })
  qrData: string;

  @ApiProperty({
    type: Number,
    description: 'Snapshot of reward.pointsCost at creation time',
  })
  pointsCost: number;

  @ApiProperty({ enum: ['pending', 'confirmed', 'expired', 'cancelled'] })
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';

  @ApiProperty({ type: Date, description: 'createdAt + 5 minutes' })
  expiresAt: Date;

  @ApiPropertyOptional({ type: Date, nullable: true })
  confirmedAt: Date | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  cashierTelegramId: number | null;

  @ApiProperty()
  createdAt: Date;
}
