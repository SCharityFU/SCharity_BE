// ── DTO Mapper Utilities ─────────────────────────────────────────────────────
//
// Centralised functions that convert raw TypeORM entities into DTOs,
// stripping fields the caller should never see.

import type { User } from '../entities/User';
import type { Report } from '../entities/Report';
import type { Donation } from '../entities/Donation';
import type { Campaign } from '../entities/Campaign';
import type { CampaignRequest } from '../entities/CampaignRequest';
import type { UserPublicDto } from '../dtos/auth/response.dto';
import type { CampaignRequestResponseDto } from '../dtos/campaign/response.dto';
import type {
  ReportResponseDto,
  ReportBriefDto,
} from '../dtos/user/response.dto';
import type {
  AdminCampaignAnalyticsResponseDto,
  AdminCampaignAnalyticsPointDto,
  AdminCampaignDetailDto,
  AdminCampaignDonationResponseDto,
  AdminCampaignListItemDto,
} from '../dtos/admin/response.dto';
import { maskAccountNumber } from './pagination';

// ── User ────────────────────────────────────────────────────────────────────

export function toUserPublicDto(user: User): UserPublicDto {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
    phoneNumber: user.phoneNumber ?? null,
    googleId: user.googleId ?? null,
    isEmailVerified: user.isEmailVerified,
    isKycVerified: user.isKycVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ── Report (brief – returned to the user who created the report) ────────────

export function toReportBriefDto(report: Report): ReportBriefDto {
  return {
    id: report.id,
    reason: report.reason,
    description: report.description ?? null,
    evidenceUrls: report.evidenceUrls ?? null,
    status: report.status,
    campaignId: report.campaignId,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

// ── Report (detail – returned to admin, includes sanitised relations) ───────

export function toReportDetailDto(report: Report): ReportResponseDto {
  return {
    id: report.id,
    reason: report.reason,
    description: report.description ?? null,
    evidenceUrls: report.evidenceUrls ?? null,
    status: report.status,
    campaignId: report.campaignId,
    campaign: report.campaign
      ? {
        id: report.campaign.id,
        title: report.campaign.title,
        thumbnailUrl: report.campaign.thumbnailUrl ?? null,
      }
      : undefined,
    reporterId: report.reporterId,
    reporter: report.reporter ? toUserPublicDto(report.reporter) : undefined,
    resolvedById: report.resolvedById ?? null,
    resolvedBy: report.resolvedBy
      ? toUserPublicDto(report.resolvedBy)
      : undefined,
    resolvedAt: report.resolvedAt ?? null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

export function toCampaignRequestResponseDto(
  request: CampaignRequest,
): CampaignRequestResponseDto {
  return {
    id: request.id,
    title: request.title,
    story: request.story,
    goalAmount: Number(request.goalAmount),
    deadline: request.deadline,
    thumbnailUrl: request.thumbnailUrl ?? null,
    mediaUrls: request.mediaUrls ?? null,
    category: request.category ?? null,
    status: request.status,
    rejectReason: request.rejectReason ?? null,
    bankInfo: request.bankInfo ?? null,
    proofDocuments: request.proofDocuments ?? null,
    requesterId: request.requesterId,
    requester: request.requester ? toUserPublicDto(request.requester) : undefined,
    reviewedById: request.reviewedById ?? null,
    reviewedBy: request.reviewedBy ? toUserPublicDto(request.reviewedBy) : undefined,
    reviewedAt: request.reviewedAt ?? null,
    campaignId: request.campaignId ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

// ── Donation (admin campaign view – UC 2.1.6) ────────────────────────────────
//
// Business rules applied:
//  1. Anonymity  — when isAnonymous == true the donor's real name is replaced
//                  with "Nhà hảo tâm ẩn danh" regardless of the donor relation.
//  2. Bank acct  — only the first 3 digits of bankAccount are exposed; the
//                  remainder is masked with '*' (via maskAccountNumber util).
//  3. Immutability — the returned DTO is a read-only projection; no editable or
//                    sensitive payment fields (PAN, CVV, paymentMetadata) are
//                    included, satisfying the audit-trail business rule.

export function toCampaignDonationAdminDto(
  donation: Donation,
): AdminCampaignDonationResponseDto {
  const donorDisplayName = donation.isAnonymous
    ? 'Nhà hảo tâm ẩn danh'
    : (donation.donor?.fullName ?? 'Người dùng');

  return {
    id: donation.id,
    donorDisplayName,
    createdAt: donation.createdAt,
    message: donation.message ?? null,
    amount: Number(donation.amount),
    bankName: donation.bankName ?? null,
    bankAccount: donation.bankAccount
      ? maskAccountNumber(donation.bankAccount)
      : null,
    status: donation.status,
  };
}

export function toAdminCampaignListItemDto(
  campaign: Campaign,
): AdminCampaignListItemDto {
  const raisedAmount = Number(campaign.raisedAmount);
  const goalAmount = Number(campaign.goalAmount);

  return {
    id: campaign.id,
    title: campaign.title,
    organizer: {
      id: campaign.creatorId,
      fullName: campaign.creator?.fullName ?? 'Unknown organizer',
    },
    status: campaign.status,
    progressPercent: campaign.progressPercent,
    raisedAmount,
    goalAmount,
    fundingProgress: `${raisedAmount} / ${goalAmount}`,
    viewDetails: {
      campaignId: campaign.id,
      endpoint: `/api/v1/admin/campaigns/${campaign.id}`,
    },
    deadline: campaign.deadline,
    createdAt: campaign.createdAt,
  };
}

export function toAdminCampaignDetailDto(
  campaign: Campaign,
): AdminCampaignDetailDto {
  return {
    id: campaign.id,
    title: campaign.title,
    story: campaign.story,
    status: campaign.status,
    category: campaign.category,
    progressPercent: campaign.progressPercent,
    raisedAmount: Number(campaign.raisedAmount),
    goalAmount: Number(campaign.goalAmount),
    donorCount: campaign.donorCount,
    reportCount: campaign.reportCount,
    deadline: campaign.deadline,
    thumbnailUrl: campaign.thumbnailUrl ?? null,
    mediaUrls: campaign.mediaUrls ?? null,
    suspendReason: campaign.suspendReason ?? null,
    suspendedAt: campaign.suspendedAt ?? null,
    closedAt: campaign.closedAt ?? null,
    approvedAt: campaign.approvedAt ?? null,
    creator: {
      id: campaign.creatorId,
      fullName: campaign.creator?.fullName ?? 'Unknown organizer',
      avatarUrl: campaign.creator?.avatarUrl ?? null,
    },
    publicView: {
      campaignId: campaign.id,
      endpoint: `/api/v1/campaigns/${campaign.id}`,
    },
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

export function toAdminCampaignAnalyticsDto(
  campaignId: string,
  days: number,
  chartData: AdminCampaignAnalyticsPointDto[],
): AdminCampaignAnalyticsResponseDto {
  return {
    campaignId,
    days,
    chartData,
  };
}
