import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Business } from '../../domain/business';

export abstract class BusinessRepository {
  abstract create(data: Omit<Business, 'id' | 'createdAt'>): Promise<Business>;

  abstract findById(id: Business['id']): Promise<NullableType<Business>>;

  abstract findByOwnerId(ownerId: number): Promise<NullableType<Business>>;

  abstract findByBotUsername(
    botUsername: string,
  ): Promise<NullableType<Business>>;

  abstract findAllActive(): Promise<Business[]>;

  abstract findAllWithPagination(
    paginationOptions: IPaginationOptions,
  ): Promise<{ data: Business[]; total: number }>;

  abstract update(
    id: Business['id'],
    payload: Partial<Business>,
  ): Promise<Business>;
}
