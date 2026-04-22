import { NullableType } from '../../../utils/types/nullable.type';
import { RewardTranslation } from '../../domain/reward-translation';

export abstract class RewardTranslationRepository {
  abstract upsert(
    data: Omit<RewardTranslation, 'id'>,
  ): Promise<RewardTranslation>;

  abstract findByReward(rewardId: string): Promise<RewardTranslation[]>;

  abstract findByRewardIds(rewardIds: string[]): Promise<RewardTranslation[]>;

  abstract findByRewardAndLocale(
    rewardId: string,
    locale: string,
  ): Promise<RewardTranslation[]>;

  abstract getField(
    rewardId: string,
    locale: string,
    field: string,
  ): Promise<NullableType<string>>;
}
