import { ApiProperty } from '@nestjs/swagger';

export class ScanToken {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  cardId: string;

  @ApiProperty({ type: String })
  businessId: string;

  @ApiProperty({ type: String })
  token: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ nullable: true })
  usedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
