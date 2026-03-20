// ── Withdraw Request DTOs ────────────────────────────────────────────────────

export interface CreateWithdrawRequestDto {
  campaignId: string;
  // Legacy optional field for backward compatibility. Ignored by service.
  bankAccountId?: string;
}
