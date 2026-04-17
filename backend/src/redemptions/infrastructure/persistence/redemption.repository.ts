import { NullableType } from '../../../utils/types/nullable.type';
import { Redemption } from '../../domain/redemption';

export abstract class RedemptionRepository {
  abstract create(
    data: Omit<Redemption, 'id' | 'createdAt'>,
  ): Promise<Redemption>;

  abstract findById(id: string): Promise<NullableType<Redemption>>;

  abstract findByCode(code: string): Promise<NullableType<Redemption>>;

  abstract findPendingExpired(now: Date): Promise<Redemption[]>;

  abstract save(redemption: Redemption): Promise<Redemption>;
}
