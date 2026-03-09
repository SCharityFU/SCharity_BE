// ── Campaign Response DTOs ───────────────────────────────────────────────────

import { CampaignStatus, CampaignCategory } from '../../entities/Campaign';
import { CampaignRequestStatus } from '../../entities/CampaignRequest';
import { UpdateCategory } from '../../entities/CampaignUpdate';
import { UserPublicDto } from '../auth/response.dto';
import type { DonationResponseDto } from '../donation/response.dto';

export interface CampaignDto {
  id: string;
  title: string;
  story: string;
  goalAmount: number;
  raisedAmount: number;
  /** Computed: min(100, raisedAmount / goalAmount * 100) */
  progressPercent: number;
  deadline: Date;
  status: CampaignStatus;
  category: CampaignCategory;
  thumbnailUrl: string | null;
  mediaUrls: string[] | null;
  suspendReason: string | null;
  suspendedAt: Date | null;
  closedAt: Date | null;
  approvedAt: Date | null;
  donorCount: number;
  reportCount: number;
  creatorId: string;
  creator?: UserPublicDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignRequestResponseDto {
  id: string;
  title: string;
  story: string;
  goalAmount: number;
  deadline: Date;
  thumbnailUrl: string | null;
  mediaUrls: string[] | null;
  category: string | null;
  status: CampaignRequestStatus;
  rejectReason: string | null;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  } | null;
  proofDocuments: string[] | null;
  requesterId: string;
  requester?: UserPublicDto;
  reviewedById: string | null;
  reviewedBy?: UserPublicDto;
  reviewedAt: Date | null;
  campaignId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignUpdateResponseDto {
  id: string;
  title: string;
  content: string;
  category: UpdateCategory;
  mediaUrls: string[] | null;
  isEdited: boolean;
  editedAt: Date | null;
  isDraft: boolean;
  campaignId: string;
  creatorId: string;
  creator?: UserPublicDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface DonationChartDataPointDto {
  date: string;
  amount: number;
  count: number;
}

export interface CampaignAnalyticsResponseDto {
  campaign: CampaignDto;
  chartData: DonationChartDataPointDto[];
  recentDonations: DonationResponseDto[];
  totalDonors: number;
}
