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

export enum CampaignRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('campaign_requests')
@Index(['status'])
@Index(['requesterId'])
export class CampaignRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  story: string;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  goalAmount: number;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  mediaUrls: string[];

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'enum', enum: CampaignRequestStatus, default: CampaignRequestStatus.PENDING })
  status: CampaignRequestStatus;

  @Column({ nullable: true, type: 'text' })
  rejectReason: string;

  @Column({ nullable: true, type: 'jsonb' })
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  proofDocuments: string[];

  @Column()
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @Column({ nullable: true })
  reviewedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ nullable: true, type: 'timestamp' })
  reviewedAt: Date;

  @Column({ nullable: true })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.requests)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
