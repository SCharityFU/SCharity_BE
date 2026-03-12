// ── Admin Response DTOs ──────────────────────────────────────────────────────

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
