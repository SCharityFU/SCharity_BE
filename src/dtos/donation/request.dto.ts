// ── Donation Request DTOs ────────────────────────────────────────────────────

import { PaymentMethod } from '../../entities/Donation';

export interface CreateDonationRequestDto {
  campaignId: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
  paymentMethod?: PaymentMethod;
}

export interface DonationHistoryQueryDto {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateCommentRequestDto {
  campaignId: string;
  content: string;
  emoji?: string;
  isAnonymous?: boolean;
  donationId?: string;
}

export interface CampaignDonationsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CommentsQueryDto {
  page?: number;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'highest_donation';
}
