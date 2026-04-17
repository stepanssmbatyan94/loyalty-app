import { NullableType } from '../../../utils/types/nullable.type';
import { LoyaltyCard } from '../../domain/loyalty-card';

export abstract class LoyaltyCardRepository {
  abstract create(
    data: Omit<LoyaltyCard, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<LoyaltyCard>;

  abstract findById(id: LoyaltyCard['id']): Promise<NullableType<LoyaltyCard>>;

  abstract findByCustomerAndBusiness(
    customerId: number,
    businessId: string,
  ): Promise<NullableType<LoyaltyCard>>;

  abstract save(card: LoyaltyCard): Promise<LoyaltyCard>;
}
