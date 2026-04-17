import { ApiProperty } from '@nestjs/swagger';

export class BusinessTranslation {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  businessId: string;

  @ApiProperty({ type: String, example: 'en' })
  locale: string;

  @ApiProperty({
    enum: ['name', 'welcomeMessage', 'pointsLabel'],
    example: 'welcomeMessage',
  })
  field: 'name' | 'welcomeMessage' | 'pointsLabel';

  @ApiProperty({ type: String, example: 'Welcome to Beer House!' })
  value: string;
}
