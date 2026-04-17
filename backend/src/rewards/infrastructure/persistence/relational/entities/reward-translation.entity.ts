import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'reward_translation' })
@Unique('UQ_rt_reward_locale_field', ['rewardId', 'locale', 'field'])
export class RewardTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String })
  rewardId: string;

  @Index()
  @Column({ type: String })
  locale: string;

  @Column({ type: String })
  field: string;

  @Column({ type: String })
  value: string;

  @CreateDateColumn()
  createdAt: Date;
}
