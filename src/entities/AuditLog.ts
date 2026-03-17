import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

export enum AuditAction {
  CAMPAIGN_APPROVED = 'campaign_approved',
  CAMPAIGN_REJECTED = 'campaign_rejected',
  CAMPAIGN_SUSPENDED = 'campaign_suspended',
  CAMPAIGN_UNSUSPENDED = 'campaign_unsuspended',
  CAMPAIGN_AUTO_COMPLETED = 'campaign_auto_completed',
  WITHDRAW_APPROVED = 'withdraw_approved',
  WITHDRAW_REJECTED = 'withdraw_rejected',
  USER_SUSPENDED = 'user_suspended',
  REPORT_RESOLVED = 'report_resolved',
  BANK_CHANGE_APPROVED = 'bank_change_approved',
  BANK_CHANGE_REJECTED = 'bank_change_rejected',
}

@Entity('audit_logs')
@Index(['actorId'])
@Index(['action'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ nullable: true })
  targetId: string;

  @Column({ nullable: true })
  targetType: string;

  @Column()
  actorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  actor: User;

  @CreateDateColumn()
  createdAt: Date;
}
