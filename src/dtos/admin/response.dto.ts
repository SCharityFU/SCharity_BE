// ── Admin Response DTOs ──────────────────────────────────────────────────────

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

// Admin-specific list/detail responses reuse these DTOs:
// - CampaignRequestResponseDto   (from campaign)
// - CampaignDto                  (from campaign)
// - WithdrawRequestResponseDto   (from withdraw)
// - ReportResponseDto            (from user)
// - DonationResponseDto          (from donation)
