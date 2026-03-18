import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Campaign } from './Campaign';
import { Donation } from './Donation';
import { Report } from './Report';
import { BankAccount } from './BankAccount';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         fullName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, user]
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         avatarUrl:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         isEmailVerified:
 *           type: boolean
 *         isKycVerified:
 *           type: boolean
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isKycVerified: boolean;

  @Column({ nullable: true })
  kycFullName: string;

  @Column({ nullable: true })
  kycIdNumber: string;

  @Column({ nullable: true, type: 'text' })
  faceEmbedding: string;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpires: Date;

  @OneToMany(() => Campaign, (campaign) => campaign.creator)
  campaigns: Campaign[];

  @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];

  @OneToMany(() => Report, (report) => report.reporter)
  reports: Report[];

  @OneToMany(() => BankAccount, (bankAccount) => bankAccount.user)
  bankAccounts: BankAccount[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
