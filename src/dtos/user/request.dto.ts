// ── User Request DTOs ────────────────────────────────────────────────────────

export interface UpdateUserProfileRequestDto {
  fullName?: string;
  phoneNumber?: string;
  // Avatar handled via multipart/form-data
}

export interface AddBankAccountRequestDto {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault?: boolean;
}

export interface ReportCampaignRequestDto {
  campaignId: string;
  reason: 'false_information' | 'fake_image' | 'no_update' | 'fraud' | 'other';
  description?: string;
  evidenceUrls?: string[];
}
