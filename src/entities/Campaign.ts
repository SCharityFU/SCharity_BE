import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Donation } from './Donation';
import { CampaignRequest } from './CampaignRequest';
import { WithdrawRequest } from './WithdrawRequest';
import { Report } from './Report';
import { CampaignUpdate } from './CampaignUpdate';

export enum CampaignStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  WITHDRAWN = 'withdrawn',
}

export enum CampaignCategory {
  DAVA = 'dava',
  EDUCATION = 'education',
  MEDICAL = 'medical',
  DISASTER = 'disaster',
  COMMUNITY = 'community',
  ENVIRONMENT = 'environment',
  OTHER = 'other',
}

@Entity('campaigns')
@Index(['status'])
@Index(['creatorId'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  story: string;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  goalAmount: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  raisedAmount: number;

  // Use to track how many money has been withdrawn from this campaign
  @Column({ type: 'decimal', precision: 15, scale: 0, default: 0 })
  withdrawnAmount: number;

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.PENDING })
  status: CampaignStatus;

  @Column({ type: 'enum', enum: CampaignCategory, default: CampaignCategory.OTHER })
  category: CampaignCategory;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  mediaUrls: string[];

  @Column({ nullable: true })
  suspendReason: string;

  @Column({ nullable: true, type: 'timestamp' })
  suspendedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  closedAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  approvedAt: Date;

  @Column()
  creatorId: string;

  @ManyToOne(() => User, (user) => user.campaigns)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => Donation, (donation) => donation.campaign)
  donations: Donation[];

  @OneToMany(() => WithdrawRequest, (wr) => wr.campaign)
  withdrawRequests: WithdrawRequest[];

  @OneToMany(() => Report, (report) => report.campaign)
  reports: Report[];

  @OneToMany(() => CampaignUpdate, (update) => update.campaign)
  updates: CampaignUpdate[];

  @OneToMany(() => CampaignRequest, (cr) => cr.campaign)
  requests: CampaignRequest[];

  @Column({ default: 0 })
  donorCount: number;

  @Column({ default: 0 })
  reportCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get progressPercent(): number {
    if (!this.goalAmount || this.goalAmount === 0) return 0;
    return Math.min(100, (this.raisedAmount / this.goalAmount) * 100);
  }

  get isDeadlineReached(): boolean {
    return new Date() >= this.deadline;
  }

  get canClose(): boolean {
    return this.progressPercent >= 50 || this.isDeadlineReached;
  }

  get canWithdraw(): boolean {
    return this.status === CampaignStatus.CLOSED && this.isKycVerifiedCreator();
  }

  private isKycVerifiedCreator(): boolean {
    return this.creator?.isKycVerified ?? false;
  }
}
