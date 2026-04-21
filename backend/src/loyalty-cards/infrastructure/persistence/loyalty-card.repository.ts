import { NullableType } from '../../../utils/types/nullable.type';
import { LoyaltyCard } from '../../domain/loyalty-card';

export interface CustomerSearchResult {
  cardId: string;
  firstName: string | null;
  lastName: string | null;
  points: number;
  totalPointsEarned: number;
}

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

  abstract searchCustomers(
    businessId: string,
    query: string,
  ): Promise<CustomerSearchResult[]>;
}
