import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'loyalty_cards' })
@Unique(['customerId', 'businessId'])
export class LoyaltyCardEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: Number })
  customerId: number;

  @Index()
  @Column({ type: String })
  businessId: string;

  @Column({ type: Number, default: 0 })
  points: number;

  @Column({ type: Number, default: 0 })
  totalPointsEarned: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
