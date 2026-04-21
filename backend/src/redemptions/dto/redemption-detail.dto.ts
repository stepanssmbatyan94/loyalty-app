import { ApiProperty } from '@nestjs/swagger';

import { Redemption } from '../domain/redemption';

export class RedemptionDetailDto extends Redemption {
  @ApiProperty({
    type: String,
    description: 'Name of the reward being redeemed',
  })
  rewardName: string;
}
