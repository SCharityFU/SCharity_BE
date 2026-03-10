// ── DTO Mapper Utilities ─────────────────────────────────────────────────────
//
// Centralised functions that convert raw TypeORM entities into DTOs,
// stripping fields the caller should never see.

import type { User } from '../entities/User';
import type { Report } from '../entities/Report';
import type { UserPublicDto } from '../dtos/auth/response.dto';
import type { ReportResponseDto, ReportBriefDto } from '../dtos/user/response.dto';

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
    resolvedBy: report.resolvedBy ? toUserPublicDto(report.resolvedBy) : undefined,
    resolvedAt: report.resolvedAt ?? null,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
