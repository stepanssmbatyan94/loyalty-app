import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Transaction {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  cardId: string;

  @ApiProperty({ enum: ['earn', 'redeem'] })
  type: 'earn' | 'redeem';

  @ApiProperty({
    type: Number,
    description: 'Always positive; type determines direction',
  })
  points: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  cashierTelegramId: number | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid' })
  rewardId: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  note: string | null;

  @ApiProperty()
  createdAt: Date;
}
