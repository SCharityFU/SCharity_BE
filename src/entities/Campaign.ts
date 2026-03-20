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

// No pending because it is only pending when the campaign creator submit the campaign request, after admin approve it, the campaign is active immediately
export enum CampaignStatus {
  REJECTED = 'rejected',
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

const CAMPAIGN_STATUS_MESSAGES: Record<CampaignStatus, string> = {
  [CampaignStatus.REJECTED]: 'Chiến dịch không hợp lệ.',
  [CampaignStatus.ACTIVE]: 'Chiến dịch đang mở. Hãy cùng chung tay lan tỏa yêu thương!',
  [CampaignStatus.CLOSED]: 'Chiến dịch đã đóng.',
  [CampaignStatus.SUSPENDED]: 'Chiến dịch tạm dừng để xác minh thông tin minh bạch.',
  [CampaignStatus.COMPLETED]: 'Chiến dịch thành công! Nguồn lực đang được chuẩn bị giải ngân.',
  [CampaignStatus.WITHDRAWN]: 'Sứ mệnh hoàn thành! Toàn bộ số tiền đã được trao tận tay.',
};

export const MAXIMUM_WITHDRAWAL_REQUESTS_AMOUNT = 3;

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

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.ACTIVE })
  status: CampaignStatus;

  @Column({ type: 'enum', enum: CampaignCategory, default: CampaignCategory.OTHER })
  category: CampaignCategory;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  mediaUrls: string[];

  @Column({ nullable: true, type: 'jsonb' })
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };

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
    const goalAmount = Number(this.goalAmount ?? 0);
    if (!Number.isFinite(goalAmount) || goalAmount <= 0) return 0;

    const raisedAmount = Number(this.raisedAmount ?? 0);
    const safeRaisedAmount = Number.isFinite(raisedAmount) ? raisedAmount : 0;

    return Math.min(100, (safeRaisedAmount / goalAmount) * 100);
  }

  get availableAmount(): number {
    const raisedAmount = Number(this.raisedAmount ?? 0);
    const withdrawnAmount = Number(this.withdrawnAmount ?? 0);
    const safeRaisedAmount = Number.isFinite(raisedAmount) ? raisedAmount : 0;
    const safeWithdrawnAmount = Number.isFinite(withdrawnAmount) ? withdrawnAmount : 0;
    return safeRaisedAmount - safeWithdrawnAmount;
  }

  get progressPercentage(): number {
    return this.progressPercent;
  }

  get statusMessage(): string {
    return CAMPAIGN_STATUS_MESSAGES[this.status] ?? 'Trạng thái chiến dịch chưa xác định.';
  }

  get isDeadlineReached(): boolean {
    return new Date() > this.deadline;
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
