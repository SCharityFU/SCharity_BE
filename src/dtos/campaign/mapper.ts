import { Campaign } from '../../entities/Campaign';
import { CampaignUpdate } from '../../entities/CampaignUpdate';
import { Comment } from '../../entities/Comment';
import { Donation } from '../../entities/Donation';
import { User } from '../../entities/User';
import {
  CampaignCommentPublicDto,
  CampaignDonationPublicDto,
  PublicUserBasicDto,
  CampaignUpdateResponseDto,
  PublicCampaignDetailResponseDto,
  PublicCampaignDto,
} from './response.dto';

type CampaignDetailSource = Campaign & {
  donations?: Donation[];
  updates?: CampaignUpdate[];
  comments?: Comment[];
};

const mapPublicUserBasicDto = (user?: User | null): PublicUserBasicDto | null => {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl ?? null,
  };
};

const mapDonationPublicDto = (donation: Donation): CampaignDonationPublicDto => {
  const donorName = donation.donor?.fullName ?? 'Nhà hảo tâm ẩn danh';
  const maskedDonor = donation.isAnonymous ? null : mapPublicUserBasicDto(donation.donor);

  return {
    id: donation.id,
    amount: Number(donation.amount),
    message: donation.message ?? null,
    donorDisplayName: donation.isAnonymous ? 'Nhà hảo tâm ẩn danh' : donorName,
    donor: maskedDonor,
    createdAt: donation.createdAt,
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
  creator: mapPublicUserBasicDto(update.creator),
  createdAt: update.createdAt,
  updatedAt: update.updatedAt,
});

const mapCommentPublicDto = (comment: Comment): CampaignCommentPublicDto => ({
  id: comment.id,
  content: comment.content,
  emoji: comment.emoji ?? null,
  isAnonymous: comment.isAnonymous,
  donor: comment.isAnonymous ? null : mapPublicUserBasicDto(comment.donor),
  createdAt: comment.createdAt,
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
  bankInfo: campaign.bankInfo
    ? {
      bankName: campaign.bankInfo.bankName,
      accountNumber: campaign.bankInfo.accountNumber,
      accountHolderName: campaign.bankInfo.accountHolderName,
    }
    : null,
  suspendReason: campaign.suspendReason ?? null,
  suspendedAt: campaign.suspendedAt ?? null,
  closedAt: campaign.closedAt ?? null,
  approvedAt: campaign.approvedAt ?? null,
  donorCount: campaign.donorCount,
  creatorId: campaign.creatorId,
  creator: mapPublicUserBasicDto(campaign.creator),
  createdAt: campaign.createdAt,
  updatedAt: campaign.updatedAt,
});

export const mapCampaignDetailDto = (campaign: CampaignDetailSource): PublicCampaignDetailResponseDto => ({
  ...mapCampaignDto(campaign),
  donations: (campaign.donations ?? []).map(mapDonationPublicDto),
  updates: (campaign.updates ?? []).map(mapCampaignUpdateDto),
  comments: (campaign.comments ?? []).map(mapCommentPublicDto),
});
