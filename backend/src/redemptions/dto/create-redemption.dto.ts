import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateRedemptionDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  rewardId: string;
}
