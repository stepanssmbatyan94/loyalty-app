import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'business_translation' })
@Unique('UQ_bt_business_locale_field', ['businessId', 'locale', 'field'])
export class BusinessTranslationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: String })
  businessId: string;

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
