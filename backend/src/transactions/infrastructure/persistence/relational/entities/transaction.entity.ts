import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'transactions' })
export class TransactionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String })
  cardId: string;

  @Column({ type: String })
  type: 'earn' | 'redeem';

  @Column({ type: Number })
  points: number;

  @Column({ type: 'bigint', nullable: true })
  cashierTelegramId: number | null;

  @Index()
  @Column({ type: String, nullable: true })
  rewardId: string | null;

  @Column({ type: String, nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
