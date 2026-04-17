import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'redemptions' })
export class RedemptionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String })
  cardId: string;

  @Index()
  @Column({ type: String })
  rewardId: string;

  @Index({ unique: true })
  @Column({ type: String, length: 6 })
  code: string;

  @Column({ type: String })
  qrData: string;

  @Column({ type: Number })
  pointsCost: number;

  @Column({ type: String, default: 'pending' })
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';

  @Index()
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt: Date | null;

  @Column({ type: 'bigint', nullable: true })
  cashierTelegramId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
