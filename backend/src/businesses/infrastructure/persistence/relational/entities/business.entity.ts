import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'business' })
export class BusinessEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Index()
  @Column({ type: Number })
  ownerId: number;

  @Column({ type: String, nullable: true })
  logoUrl: string | null;

  @Column({
    type: 'enum',
    enum: ['per_amd_spent', 'fixed_per_visit'],
    default: 'per_amd_spent',
  })
  earnRateMode: 'per_amd_spent' | 'fixed_per_visit';

  @Column({ type: Number, default: 100 })
  earnRateValue: number;

  @Column({ type: String, nullable: true })
  botToken: string | null;

  @Index()
  @Column({ type: String, nullable: true, unique: true })
  botUsername: string | null;

  @Column({ type: String, nullable: true })
  webhookSecret: string | null;

  @Column({ type: String, nullable: true })
  telegramGroupChatId: string | null;

  @Column('text', { array: true, default: ['en'] })
  supportedLocales: string[];

  @Column({ type: String, default: 'en' })
  defaultLocale: string;

  @Column({ type: Boolean, default: false })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
