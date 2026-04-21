import { NullableType } from '../../../utils/types/nullable.type';
import { Reward } from '../../domain/reward';

export abstract class RewardRepository {
  abstract create(
    data: Omit<Reward, 'id' | 'createdAt' | 'deletedAt'>,
  ): Promise<Reward>;

  abstract findById(id: Reward['id']): Promise<NullableType<Reward>>;

  abstract findAllActiveByBusinessId(businessId: string): Promise<Reward[]>;

  abstract findAllByBusinessId(businessId: string): Promise<Reward[]>;

  abstract update(id: Reward['id'], payload: Partial<Reward>): Promise<Reward>;

  abstract softDelete(id: Reward['id']): Promise<void>;
}
