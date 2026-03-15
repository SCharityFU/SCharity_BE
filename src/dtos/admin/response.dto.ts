// ── Admin Response DTOs ──────────────────────────────────────────────────────

import { CampaignCategory, CampaignStatus } from '../../entities/Campaign';
import { DonationStatus } from '../../entities/Donation';

export interface DashboardStatsResponseDto {
  totalCampaigns: number;
  successfulCampaigns: number;
  suspendedCampaigns: number;
  totalDonationReceived: number;
  totalDonationPaid: number;
  adminBalance: number;
  totalCampaignCreators: number;
  totalDonors: number;
  totalUsers: number;
}

export interface DonationChartDataPointDto {
  date: string;
  amount: number;
  count: number;
}

export interface AdminCampaignAnalyticsPointDto {
  date: string;
  amount: number;
  count: number;
  donors?: AdminCampaignDailyTopDonorDto[];
}

export interface AdminCampaignDailyTopDonorDto {
  donorId: string;
  donorName: string;
  totalAmount: number;
  donationCount: number;
}

/**
 * UC 2.1.4 – Admin: Campaign list row
 *
 * This is the table projection used by admin campaign management screens.
 */
export interface AdminCampaignListItemDto {
  id: string;
  title: string;
  organizer: {
    id: string;
    fullName: string;
  };
  /** Campaign lifecycle status (active/closed/suspended/...) */
  status: CampaignStatus;
  /** Progress percentage in range [0, 100] */
  progressPercent: number;
  /** Current raised amount in VND */
  raisedAmount: number;
  /** Funding goal in VND */
  goalAmount: number;
  /** Convenience label for UI rendering, e.g. "2000000 / 5000000" */
  fundingProgress: string;
  /** Used by frontend action button to open details endpoint */
  viewDetails: {
    campaignId: string;
    endpoint: string;
  };
  deadline: Date;
  createdAt: Date;
}

/**
 * UC 2.1.5 – Admin: Campaign basic detail tab
 */
export interface AdminCampaignDetailDto {
  id: string;
  title: string;
  story: string;
  status: CampaignStatus;
  category: CampaignCategory;
  progressPercent: number;
  raisedAmount: number;
  goalAmount: number;
  donorCount: number;
  reportCount: number;
  deadline: Date;
  thumbnailUrl: string | null;
  mediaUrls: string[] | null;
  suspendReason: string | null;
  suspendedAt: Date | null;
  closedAt: Date | null;
  approvedAt: Date | null;
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  publicView: {
    campaignId: string;
    endpoint: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * UC 2.1.5 – Admin: Campaign analytics for charts
 */
export interface AdminCampaignAnalyticsResponseDto {
  campaignId: string;
  days: number;
  chartData: AdminCampaignAnalyticsPointDto[];
}

/**
 * UC 2.1.6 – Admin: View campaign donations table row
 *
 * Business rules enforced here (at the DTO level):
 *  - donorDisplayName : "Nhà hảo tâm ẩn danh" when isAnonymous == true
 *  - bankAccount      : only first 3 digits shown, remainder replaced with '*'
 *                       e.g. "1234567890" → "123*******"
 *  - Immutability     : Admin receives a read-only projection; no mutable fields
 *                       are exposed so accidental writes are structurally impossible.
 */
export interface AdminCampaignDonationResponseDto {
  id: string;
  /** Masked display name: "Nhà hảo tâm ẩn danh" when isAnonymous == true */
  donorDisplayName: string;
  /** Transaction timestamp */
  createdAt: Date;
  /** Optional donor message attached to the donation */
  message: string | null;
  /** Donation amount in VND */
  amount: number;
  /** Bank name used for the transfer (nullable) */
  bankName: string | null;
  /**
   * Masked bank account number.
   * Only the first 3 digits are visible; the rest are replaced with '*'.
   * Example: "123*******"
   * null when no bank account was recorded.
   */
  bankAccount: string | null;
  /** Processing status of the donation */
  status: DonationStatus;
}

// Admin-specific list/detail responses reuse these DTOs:
// - CampaignRequestResponseDto   (from campaign)
// - CampaignDto                  (from campaign)
// - WithdrawRequestResponseDto   (from withdraw)
// - ReportResponseDto            (from user)
// - DonationResponseDto          (from donation)  ← UC 2.1.8 all-transactions
// - AdminCampaignDonationResponseDto              ← UC 2.1.6 campaign donations table
