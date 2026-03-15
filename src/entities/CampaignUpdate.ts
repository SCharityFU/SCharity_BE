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

export enum UpdateCategory {
  PROGRESS = 'progress',
  FINANCIAL = 'financial',
  THANK_YOU = 'thank_you',
  OTHER = 'other',
  AFTER_CAMPAIGN = 'after_campaign',
  COMPLETION = 'completion',
}

@Entity('campaign_updates')
@Index(['campaignId'])
export class CampaignUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: UpdateCategory, default: UpdateCategory.PROGRESS })
  category: UpdateCategory;

  @Column({ type: 'simple-array', nullable: true })
  mediaUrls: string[];

  @Column({ default: false })
  isEdited: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  editedAt: Date;

  @Column({ nullable: true, type: 'boolean', default: false })
  isDraft: boolean;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.updates)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column()
  creatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
