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

@Entity('bank_accounts')
@Index(['userId'])
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bankName: string;

  @Column()
  accountNumber: string;

  @Column()
  accountHolderName: string;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  isBankInfoApproved: boolean;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.bankAccounts)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
