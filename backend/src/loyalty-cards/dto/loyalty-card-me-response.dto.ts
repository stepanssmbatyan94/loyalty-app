import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class NextRewardDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Free Pint' })
  name: string;

  @ApiProperty({ type: Number, example: 500 })
  pointsCost: number;

  @ApiProperty({ type: Number, example: 50 })
  ptsRemaining: number;
}

export class LoyaltyCardMeResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  businessId: string;

  @ApiProperty({ type: Number })
  customerId: number;

  @ApiProperty({ type: Number, example: 2450 })
  points: number;

  @ApiProperty({ type: Number, example: 3200 })
  totalPointsEarned: number;

  @ApiProperty({ type: String, example: 'https://api.example.com/qr/...' })
  qrCodeUrl: string;

  @ApiPropertyOptional({ type: NextRewardDto, nullable: true })
  nextReward: NextRewardDto | null;

  @ApiProperty({ type: Number, example: 85 })
  progressPercent: number;

  @ApiProperty({ type: Date })
  memberSince: Date;
}
