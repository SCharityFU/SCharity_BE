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
import { BankAccount } from './BankAccount';

export enum BankChangeStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('bank_account_change_requests')
@Index(['bankAccountId'])
@Index(['status'])
export class BankAccountChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankAccountId: string;

  @ManyToOne(() => BankAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bankAccountId' })
  bankAccount: BankAccount;

  @Column()
  requesterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  // New values requested
  @Column()
  newBankName: string;

  @Column()
  newAccountNumber: string;

  @Column()
  newAccountHolderName: string;

  @Column({ type: 'enum', enum: BankChangeStatus, default: BankChangeStatus.PENDING })
  status: BankChangeStatus;

  @Column({ nullable: true, type: 'text' })
  rejectReason: string;

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
