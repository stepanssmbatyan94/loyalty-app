import { NullableType } from '../../../utils/types/nullable.type';
import { BusinessTranslation } from '../../domain/business-translation';

export abstract class BusinessTranslationRepository {
  abstract upsert(
    data: Omit<BusinessTranslation, 'id'>,
  ): Promise<BusinessTranslation>;

  abstract findByBusiness(businessId: string): Promise<BusinessTranslation[]>;

  abstract findByBusinessAndLocale(
    businessId: string,
    locale: string,
  ): Promise<BusinessTranslation[]>;

  abstract getField(
    businessId: string,
    locale: string,
    field: string,
  ): Promise<NullableType<string>>;
}
