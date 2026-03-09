import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Campaign } from './Campaign';

export enum DonationStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  VNPAY = 'vnpay',
  MOMO = 'momo',
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer',
}

@Entity('donations')
@Index(['campaignId'])
@Index(['donorId'])
@Index(['status'])
@Index(['createdAt'])
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  amount: number;

  @Column({ type: 'enum', enum: DonationStatus, default: DonationStatus.PENDING })
  status: DonationStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  transactionRef: string;

  @Column({ nullable: true, type: 'text' })
  message: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccount: string;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.donations)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ nullable: true })
  donorId: string;

  @ManyToOne(() => User, (user) => user.donations, { nullable: true })
  @JoinColumn({ name: 'donorId' })
  donor: User;

  // This column is not used, because user id can get the name and isAnoymous can determine whether to show the name or not
  // @Column({ nullable: true })
  // donorName: string;

  @Column({ nullable: true, type: 'jsonb' })
  paymentMetadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
