export interface CreatorDashboardQueryDto {
  campaignLimit?: number;
  donationLimit?: number;
  campaignCursor?: string;
  donationCursor?: string;
  timezone?: string;
}
