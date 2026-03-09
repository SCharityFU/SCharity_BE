// ── Withdraw Response DTOs ───────────────────────────────────────────────────

import { WithdrawStatus } from '../../entities/WithdrawRequest';
import { UserPublicDto } from '../auth/response.dto';
import { CampaignDto } from '../campaign/response.dto';

export interface WithdrawRequestResponseDto {
  id: string;
  amount: number;
  status: WithdrawStatus;
  rejectReason: string | null;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  campaignId: string;
  campaign?: CampaignDto;
  requesterId: string;
  requester?: UserPublicDto;
  processedById: string | null;
  processedBy?: UserPublicDto;
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
