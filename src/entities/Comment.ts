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
import { Donation } from './Donation';

@Entity('comments')
@Index(['campaignId'])
@Index(['donorId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column()
  campaignId: string;

  @ManyToOne(() => Campaign)
  @JoinColumn({ name: 'campaignId' })
  campaign: Campaign;

  @Column({ nullable: true })
  donorId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'donorId' })
  donor: User | null;

  @Column({ nullable: true })
  donationId: string;

  @ManyToOne(() => Donation, { nullable: true })
  @JoinColumn({ name: 'donationId' })
  donation: Donation;

  @Column({ default: false })
  isEdited: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  editedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
