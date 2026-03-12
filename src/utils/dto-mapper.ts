// ── DTO Mapper Utilities ─────────────────────────────────────────────────────
//
// Centralised functions that convert raw TypeORM entities into DTOs,
// stripping fields the caller should never see.

import type { User } from '../entities/User';
import type { Report } from '../entities/Report';
import type { Donation } from '../entities/Donation';
import type { UserPublicDto } from '../dtos/auth/response.dto';
import type {
  ReportResponseDto,
  ReportBriefDto,
} from '../dtos/user/response.dto';
import type { AdminCampaignDonationResponseDto } from '../dtos/admin/response.dto';
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
