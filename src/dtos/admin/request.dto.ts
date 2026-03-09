// ── Admin Request DTOs ───────────────────────────────────────────────────────

import { CampaignRequestStatus } from '../../entities/CampaignRequest';
import { CampaignCategory, CampaignStatus } from '../../entities/Campaign';
import { WithdrawStatus } from '../../entities/WithdrawRequest';
import { ReportStatus } from '../../entities/Report';

export interface ReviewCampaignRequestDto {
  action: 'approve' | 'reject';
  rejectReason?: string;
}

export interface SuspendCampaignRequestDto {
  reason: string;
}

export interface ProcessWithdrawRequestDto {
  action: 'approve' | 'reject';
  rejectReason?: string;
}

export interface DonationChartQueryDto {
  interval?: 'day' | 'week' | 'month';
  days?: number;
}

export interface AdminCampaignRequestsQueryDto {
  page?: number;
  limit?: number;
  status?: CampaignRequestStatus;
}

export interface AdminCampaignsQueryDto {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  category?: CampaignCategory | string;
  search?: string;
}

export interface AdminWithdrawRequestsQueryDto {
  page?: number;
  limit?: number;
  status?: WithdrawStatus;
}

export interface AdminReportsQueryDto {
  page?: number;
  limit?: number;
  status?: ReportStatus;
}

export interface AdminTransactionsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AdminCampaignTransactionsQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'ASC' | 'DESC';
}
