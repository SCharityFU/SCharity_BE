// ── User Response DTOs ───────────────────────────────────────────────────────

import { UserPublicDto } from '../auth/response.dto';
import { ReportReason, ReportStatus } from '../../entities/Report';

// Re-export UserPublicDto as the primary user response shape
export { UserPublicDto } from '../auth/response.dto';

export interface BankAccountResponseDto {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportResponseDto {
  id: string;
  reason: ReportReason;
  description: string | null;
  evidenceUrls: string[] | null;
  status: ReportStatus;
  campaignId: string;
  campaign?: { id: string; title: string; thumbnailUrl: string | null };
  reporterId: string;
  reporter?: UserPublicDto;
  resolvedById: string | null;
  resolvedBy?: UserPublicDto;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
