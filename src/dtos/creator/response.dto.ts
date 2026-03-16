export interface CreatorDashboardSummaryDto {
  totalRaisedAmount: number;
  activeCampaignCount: number;
  pendingRequestCount: number;
  totalDonorCount: number;
  daysSinceJoined: number;
}

export interface CreatorDashboardKycDto {
  isKycVerified: boolean;
  kycStatus: 'verified' | 'unverified';
}

export interface CreatorDashboardQuickNavDto {
  myRequestsTotal: number;
  myRequestsPending: number;
  myCampaignsTotal: number;
  myCampaignsActive: number;
}

export interface CreatorDashboardRecentDonationDto {
  id: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  createdAt: Date;
  relativeTimeLabel: string;
  isAnonymous: boolean;
  donorDisplayName: string;
  status: string;
}

export interface CreatorDashboardCampaignPreviewDto {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  status: string;
  raisedAmount: number;
  goalAmount: number;
  progressPercent: number;
  donorCount: number;
  daysLeft: number;
  deadline: Date;
}

export interface CreatorDashboardAlertsDto {
  needKyc: boolean;
  hasOverdueCampaigns: boolean;
  hasRejectedRequests: boolean;
}

export interface CreatorDashboardCursorPaginationDto {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface CreatorDashboardResponseDto {
  summary: CreatorDashboardSummaryDto;
  kyc: CreatorDashboardKycDto;
  quickNav: CreatorDashboardQuickNavDto;
  recentDonationsToMyCampaigns: CreatorDashboardRecentDonationDto[];
  recentDonationsPagination: CreatorDashboardCursorPaginationDto;
  myCampaignsPreview: CreatorDashboardCampaignPreviewDto[];
  myCampaignsPreviewPagination: CreatorDashboardCursorPaginationDto;
  alerts: CreatorDashboardAlertsDto;
  updatedAt: Date;
}
