import { ApiProperty } from '@nestjs/swagger';

export class LoyaltyCard {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Number, example: 1 })
  customerId: number;

  @ApiProperty({ type: String, format: 'uuid' })
  businessId: string;

  @ApiProperty({ type: Number, example: 0 })
  points: number;

  @ApiProperty({ type: Number, example: 0 })
  totalPointsEarned: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
