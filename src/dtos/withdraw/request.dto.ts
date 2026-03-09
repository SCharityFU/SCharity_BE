// ── Withdraw Request DTOs ────────────────────────────────────────────────────

export interface CreateWithdrawRequestDto {
  campaignId: string;
  amount: number;
  bankAccountId: string;
}
