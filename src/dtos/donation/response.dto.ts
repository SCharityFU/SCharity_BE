// ── Donation Response DTOs ───────────────────────────────────────────────────

import { DonationStatus, PaymentMethod } from '../../entities/Donation';
import { UserPublicDto } from '../auth/response.dto';
import { CampaignDto } from '../campaign/response.dto';

export interface DonationResponseDto {
  id: string;
  amount: number;
  status: DonationStatus;
  paymentMethod: PaymentMethod | null;
  transactionRef: string | null;
  message: string | null;
  isAnonymous: boolean;
  /** Masked display name: "Nhà hảo tâm ẩn danh" when isAnonymous==true */
  donorDisplayName: string;
  bankName: string | null;
  /** Masked: only first 3 digits visible (e.g. "123*****") */
  bankAccount: string | null;
  campaignId: string;
  campaign?: CampaignDto;
  donorId: string | null;
  donor?: UserPublicDto;
  paymentMetadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentResponseDto {
  id: string;
  content: string;
  emoji: string | null;
  isAnonymous: boolean;
  campaignId: string;
  donorId: string;
  donor?: UserPublicDto;
  donationId: string | null;
  donation?: DonationResponseDto;
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
