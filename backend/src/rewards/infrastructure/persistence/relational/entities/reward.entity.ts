import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'rewards' })
export class RewardEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String })
  businessId: string;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  description: string | null;

  @Column({ type: Number })
  pointsCost: number;

  @Column({ type: String, nullable: true })
  imageUrl: string | null;

  @Column({ type: Boolean, default: true })
  isActive: boolean;

  @Column({ type: Number, nullable: true })
  stock: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
