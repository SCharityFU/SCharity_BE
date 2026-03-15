// ── Campaign Request DTOs ────────────────────────────────────────────────────

import { CampaignCategory } from '../../entities/Campaign';
import { UpdateCategory } from '../../entities/CampaignUpdate';

export interface BankInfoDto {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface SubmitCampaignRequestDto {
  title: string;
  story: string;
  goalAmount: number;
  deadline: string; // ISO datetime
  category?: CampaignCategory;
  bankInfo: BankInfoDto;
  // Files handled via multipart/form-data (thumbnail, media, proofDocuments)
}

export interface UpdateCampaignRequestDto {
  story?: string;
}

export interface CampaignQueryRequestDto {
  page?: number;
  limit?: number;
  status?: string;
  category?: CampaignCategory;
  search?: string;
  sortBy?: 'createdAt' | 'raisedAmount' | 'deadline' | 'goalAmount';
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateCampaignUpdateRequestDto {
  title: string;
  content: string;
  category?: UpdateCategory;
  isDraft?: boolean;
  // Files handled via multipart/form-data
}

export interface CloseCampaignRequestDto {
  confirm: boolean;
}

export interface CampaignAnalyticsQueryDto {
  days?: number;
}
