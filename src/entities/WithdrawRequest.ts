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

export enum WithdrawStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

@Entity('withdraw_requests')
@Index(['status'])
@Index(['campaignId'])
export class WithdrawRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  amount: number;

  @Column({ type: 'enum', enum: WithdrawStatus, default: WithdrawStatus.PENDING })
  status: WithdrawStatus;

  @Column({ nullable: true, type: 'text' })
  rejectReason: string;

  @Column({ type: 'jsonb' })
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.withdrawRequests)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column({ nullable: true })
  processedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'processedById' })
  processedBy: User;

  @Column({ nullable: true, type: 'timestamp' })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
