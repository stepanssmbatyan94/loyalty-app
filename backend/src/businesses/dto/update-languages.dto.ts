import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const SUPPORTED = ['en', 'ru', 'hy', 'fr', 'de', 'es', 'ar'];

@ValidatorConstraint({ name: 'defaultLocaleInList', async: false })
class DefaultLocaleInSupportedLocales implements ValidatorConstraintInterface {
  validate(defaultLocale: string, args: ValidationArguments): boolean {
    const obj = args.object as UpdateLanguagesDto;
    return obj.supportedLocales?.includes(defaultLocale) ?? false;
  }

  defaultMessage(): string {
    return 'defaultLocale must be in supportedLocales';
  }
}

export class UpdateLanguagesDto {
  @ApiProperty({ type: [String], example: ['en', 'ru'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(SUPPORTED, { each: true })
  supportedLocales: string[];

  @ApiProperty({ type: String, example: 'en' })
  @IsString()
  @IsIn(SUPPORTED)
  @Validate(DefaultLocaleInSupportedLocales)
  defaultLocale: string;
}
