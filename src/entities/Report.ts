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

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

export enum ReportReason {
  FALSE_INFORMATION = 'false_information',
  FAKE_IMAGE = 'fake_image',
  NO_UPDATE = 'no_update',
  FRAUD = 'fraud',
  OTHER = 'other',
}

@Entity('reports')
@Index(['status'])
@Index(['campaignId'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  evidenceUrls: string[];

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.reports)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  reporterId: string;

  @ManyToOne(() => User, (user) => user.reports)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @Column({ nullable: true })
  resolvedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy: User;

  @Column({ nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
