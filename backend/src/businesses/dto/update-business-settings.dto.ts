import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';

export class UpdateBusinessSettingsDto {
  @ApiProperty({ enum: ['per_amd_spent', 'fixed_per_visit'] })
  @IsEnum(['per_amd_spent', 'fixed_per_visit'])
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';

  @ApiProperty({ type: Number, minimum: 1, example: 100 })
  @IsNumber()
  @Min(1)
  earnRateValue: number;
}
