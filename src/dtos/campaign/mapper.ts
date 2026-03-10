import { Campaign } from '../../entities/Campaign';
import { CampaignUpdate } from '../../entities/CampaignUpdate';
import { Comment } from '../../entities/Comment';
import { Donation } from '../../entities/Donation';
import { User } from '../../entities/User';
import {
  CampaignCommentPublicDto,
  CampaignDonationPublicDto,
  CampaignUpdateResponseDto,
  PublicCampaignDetailResponseDto,
  PublicCampaignDto,
} from './response.dto';
import { UserPublicDto } from '../auth/response.dto';

type CampaignDetailSource = Campaign & {
  donations?: Donation[];
  updates?: CampaignUpdate[];
  comments?: Comment[];
};

const maskBankAccount = (bankAccount?: string | null): string | null => {
  if (!bankAccount) return null;
  const normalized = String(bankAccount);
  if (normalized.length <= 3) return `${normalized}*****`;
  return `${normalized.slice(0, 3)}*****`;
};

const mapUserPublicDto = (user?: User | null): UserPublicDto | undefined => {
  if (!user) return undefined;
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
};

const mapDonationPublicDto = (donation: Donation): CampaignDonationPublicDto => {
  const donorName = donation.donor?.fullName ?? 'Anonymous';
  return {
    id: donation.id,
    amount: Number(donation.amount),
    status: donation.status,
    paymentMethod: donation.paymentMethod ?? null,
    transactionRef: donation.transactionRef ?? null,
    message: donation.message ?? null,
    isAnonymous: donation.isAnonymous,
    donorDisplayName: donation.isAnonymous ? 'Nhà hảo tâm ẩn danh' : donorName,
    bankName: donation.bankName ?? null,
    bankAccount: maskBankAccount(donation.bankAccount),
    campaignId: donation.campaignId,
    donorId: donation.donorId ?? null,
    donor: mapUserPublicDto(donation.donor),
    paymentMetadata: donation.paymentMetadata ?? null,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
  };
};

const mapCampaignUpdateDto = (update: CampaignUpdate): CampaignUpdateResponseDto => ({
  id: update.id,
  title: update.title,
  content: update.content,
  category: update.category,
  mediaUrls: update.mediaUrls ?? null,
  isEdited: update.isEdited,
  editedAt: update.editedAt ?? null,
  isDraft: update.isDraft,
  campaignId: update.campaignId,
  creatorId: update.creatorId,
  creator: mapUserPublicDto(update.creator),
  createdAt: update.createdAt,
  updatedAt: update.updatedAt,
});

const mapCommentPublicDto = (comment: Comment): CampaignCommentPublicDto => ({
  id: comment.id,
  content: comment.content,
  emoji: comment.emoji ?? null,
  isAnonymous: comment.isAnonymous,
  campaignId: comment.campaignId,
  donorId: comment.donorId,
  donor: mapUserPublicDto(comment.donor),
  donationId: comment.donationId ?? null,
  donation: comment.donation
    ? {
        id: comment.donation.id,
        amount: Number(comment.donation.amount),
        status: comment.donation.status,
        createdAt: comment.donation.createdAt,
      }
    : undefined,
  isEdited: comment.isEdited,
  editedAt: comment.editedAt ?? null,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const mapCampaignDto = (campaign: Campaign): PublicCampaignDto => ({
  id: campaign.id,
  title: campaign.title,
  story: campaign.story,
  goalAmount: Number(campaign.goalAmount),
  raisedAmount: Number(campaign.raisedAmount),
  progressPercent: campaign.progressPercent,
  deadline: campaign.deadline,
  status: campaign.status,
  category: campaign.category,
  thumbnailUrl: campaign.thumbnailUrl ?? null,
  mediaUrls: campaign.mediaUrls ?? null,
  suspendReason: campaign.suspendReason ?? null,
  suspendedAt: campaign.suspendedAt ?? null,
  closedAt: campaign.closedAt ?? null,
  approvedAt: campaign.approvedAt ?? null,
  donorCount: campaign.donorCount,
  creatorId: campaign.creatorId,
  creator: mapUserPublicDto(campaign.creator),
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt,
});

export const mapCampaignDetailDto = (campaign: CampaignDetailSource): PublicCampaignDetailResponseDto => ({
  ...mapCampaignDto(campaign),
  donations: (campaign.donations ?? []).map(mapDonationPublicDto),
  updates: (campaign.updates ?? []).map(mapCampaignUpdateDto),
  comments: (campaign.comments ?? []).map(mapCommentPublicDto),
});
