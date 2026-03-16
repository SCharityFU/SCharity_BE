import { CampaignRequestRepository, CampaignRepository } from '../repositories/campaign.repository';
import { DonationRepository } from '../repositories/donation.repository';
import { UserRepository } from '../repositories/user.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';
import type { CreatorDashboardQueryDto } from '../validators/creator.validator';
import type { CreatorDashboardResponseDto } from '../dtos/creator/response.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildRelativeTimeLabel = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 1) return 'Vua xong';
  if (diffMinutes < 60) return `${diffMinutes} phut truoc`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} gio truoc`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngay truoc`;
};

const calculateDaysLeft = (deadline: Date): number => {
  const diffMs = deadline.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / DAY_MS);
};

const encodeCursor = (createdAt: Date, id: string): string =>
  Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url');

const decodeCursor = (cursor: string, fieldName: string): { createdAt: Date; id: string } => {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const [createdAtIso, id] = decoded.split('|');
    if (!createdAtIso || !id) {
      throw new Error('Invalid cursor format');
    }

    const createdAt = new Date(createdAtIso);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Invalid cursor timestamp');
    }

    return { createdAt, id };
  } catch {
    throw new BadRequestError(`${fieldName} is invalid`);
  }
};

export class CreatorService {
  async getDashboard(userId: string, query: CreatorDashboardQueryDto): Promise<CreatorDashboardResponseDto> {
    const campaignLimit = query.campaignLimit ?? 3;
    const donationLimit = query.donationLimit ?? 5;
    const campaignCursor = query.campaignCursor
      ? decodeCursor(query.campaignCursor, 'campaignCursor')
      : undefined;
    const donationCursor = query.donationCursor
      ? decodeCursor(query.donationCursor, 'donationCursor')
      : undefined;
    const timezone = query.timezone ?? 'Asia/Ho_Chi_Minh';

    if (timezone !== 'Asia/Ho_Chi_Minh') {
      throw new BadRequestError('Only Asia/Ho_Chi_Minh timezone is currently supported');
    }

    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const [campaignStats, requestStats, previewCampaignsResult, recentDonationsResult] = await Promise.all([
      CampaignRepository.getCreatorSummaryStats(userId),
      CampaignRequestRepository.getCreatorRequestStats(userId),
      CampaignRepository.findCreatorPreviewWithCursor(userId, campaignLimit, campaignCursor),
      DonationRepository.findRecentByCreatorCampaignsWithCursor(userId, donationLimit, donationCursor),
    ]);

    const previewCampaigns = previewCampaignsResult.items;
    const recentDonations = recentDonationsResult.items;

    const myCampaignsPreview = previewCampaigns.map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      thumbnailUrl: campaign.thumbnailUrl ?? null,
      status: campaign.status,
      raisedAmount: Number(campaign.raisedAmount),
      goalAmount: Number(campaign.goalAmount),
      progressPercent: campaign.progressPercent,
      donorCount: campaign.donorCount,
      daysLeft: calculateDaysLeft(campaign.deadline),
      deadline: campaign.deadline,
    }));

    const recentDonationsToMyCampaigns = recentDonations.map((donation) => ({
      id: donation.id,
      campaignId: donation.campaignId,
      campaignTitle: donation.campaign?.title ?? 'Unknown campaign',
      amount: Number(donation.amount),
      createdAt: donation.createdAt,
      relativeTimeLabel: buildRelativeTimeLabel(donation.createdAt),
      isAnonymous: donation.isAnonymous,
      donorDisplayName: donation.isAnonymous
        ? 'Nha hao tam an danh'
        : (donation.donor?.fullName ?? 'Guest donor'),
      status: donation.status,
    }));

    const nextCampaignCursor = previewCampaignsResult.hasMore && previewCampaigns.length > 0
      ? encodeCursor(previewCampaigns[previewCampaigns.length - 1].createdAt, previewCampaigns[previewCampaigns.length - 1].id)
      : null;

    const nextDonationCursor = recentDonationsResult.hasMore && recentDonations.length > 0
      ? encodeCursor(recentDonations[recentDonations.length - 1].createdAt, recentDonations[recentDonations.length - 1].id)
      : null;

    const daysSinceJoined = Math.max(
      0,
      Math.floor((Date.now() - user.createdAt.getTime()) / DAY_MS),
    );

    return {
      summary: {
        totalRaisedAmount: campaignStats.totalRaisedAmount,
        activeCampaignCount: campaignStats.activeCampaignCount,
        pendingRequestCount: requestStats.pending,
        totalDonorCount: campaignStats.totalDonorCount,
        daysSinceJoined,
      },
      kyc: {
        isKycVerified: user.isKycVerified,
        kycStatus: user.isKycVerified ? 'verified' : 'unverified',
      },
      quickNav: {
        myRequestsTotal: requestStats.total,
        myRequestsPending: requestStats.pending,
        myCampaignsTotal: campaignStats.totalCampaignCount,
        myCampaignsActive: campaignStats.activeCampaignCount,
      },
      recentDonationsToMyCampaigns,
      recentDonationsPagination: {
        limit: donationLimit,
        hasMore: recentDonationsResult.hasMore,
        nextCursor: nextDonationCursor,
      },
      myCampaignsPreview,
      myCampaignsPreviewPagination: {
        limit: campaignLimit,
        hasMore: previewCampaignsResult.hasMore,
        nextCursor: nextCampaignCursor,
      },
      alerts: {
        needKyc: !user.isKycVerified,
        hasOverdueCampaigns: campaignStats.overdueCampaignCount > 0,
        hasRejectedRequests: requestStats.rejected > 0,
      },
      updatedAt: new Date(),
    };
  }
}

export const creatorService = new CreatorService();
