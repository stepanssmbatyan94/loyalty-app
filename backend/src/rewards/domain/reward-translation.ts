import { ApiProperty } from '@nestjs/swagger';

export class RewardTranslation {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  rewardId: string;

  @ApiProperty({ type: String, example: 'en' })
  locale: string;

  @ApiProperty({
    enum: ['name', 'description'],
    example: 'name',
  })
  field: 'name' | 'description';

  @ApiProperty({ type: String, example: 'Free Pint' })
  value: string;
}
