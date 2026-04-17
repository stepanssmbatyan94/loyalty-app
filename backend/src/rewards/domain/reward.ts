import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Reward {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  businessId: string;

  @ApiProperty({ type: String, example: 'Free Pint' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Number, example: 500 })
  pointsCost: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiPropertyOptional({ type: Number, nullable: true })
  stock: number | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  deletedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
