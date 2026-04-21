import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({ type: Number })
  totalCustomers: number;

  @ApiProperty({ type: Number })
  transactionsToday: number;

  @ApiProperty({ type: Number })
  totalPointsIssuedAllTime: number;

  @ApiProperty({ type: Number })
  activeRewards: number;
}
