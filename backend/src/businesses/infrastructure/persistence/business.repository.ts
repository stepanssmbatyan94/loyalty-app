import { NullableType } from '../../../utils/types/nullable.type';
import { Business } from '../../domain/business';

export abstract class BusinessRepository {
  abstract create(
    data: Omit<Business, 'id' | 'createdAt'>,
  ): Promise<Business>;

  abstract findById(id: Business['id']): Promise<NullableType<Business>>;

  abstract findByOwnerId(ownerId: number): Promise<NullableType<Business>>;

  abstract findByBotUsername(
    botUsername: string,
  ): Promise<NullableType<Business>>;

  abstract findAllActive(): Promise<Business[]>;

  abstract update(
    id: Business['id'],
    payload: Partial<Business>,
  ): Promise<Business>;
}
