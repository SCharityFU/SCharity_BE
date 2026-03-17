import { AppDataSource } from '../config/database';
import { Campaign, CampaignStatus } from '../entities/Campaign';
import { CampaignRequestStatus } from '../entities/CampaignRequest';
import { Donation, DonationStatus } from '../entities/Donation';
import { UserRepository } from '../repositories/user.repository';
import { CampaignRepository, CampaignRequestRepository } from '../repositories/campaign.repository';
import { NotFoundError } from '../utils/errors';

export class CreatorService {
  /**
   * UC: View Creator Dashboard Stats
   * Fetches summary statistics, recent campaigns, recent donations, and notifications.
   */
  async getDashboard(
    userId: string,
    options: {
      campaignLimit: number;
      donationLimit: number;
    },
  ) {
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { campaignLimit, donationLimit } = options;

    // --- 1. Summary Stats ---

    // Total Raised Amount from all created campaigns
    const totalRaisedResult = await AppDataSource.createQueryBuilder()
      .select('SUM(campaign.raisedAmount)', 'total')
      .from(Campaign, 'campaign')
      .where('campaign.creatorId = :userId', { userId })
      .getRawOne();

    // Active Campaigns
    const activeCampaignCount = await CampaignRepository.count({
      where: { creatorId: userId, status: CampaignStatus.ACTIVE },
    });

    // Pending Requests
    const pendingRequestCount = await CampaignRequestRepository.count({
      where: { requesterId: userId, status: CampaignRequestStatus.PENDING },
    });

    // Total Donors directly supporting this creator's campaigns
    const totalDonorsResult = await AppDataSource.createQueryBuilder()
      .select('COUNT(DISTINCT donation.donorId)', 'count')
      .from(Donation, 'donation')
      .innerJoin('donation.campaign', 'campaign')
      .where('campaign.creatorId = :userId', { userId })
      .andWhere('donation.status = :status', { status: DonationStatus.SUCCESS })
      .getRawOne();

    // Days since joined
    const daysSinceJoined = Math.max(
      0,
      Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    const summary = {
      totalRaisedAmount: Number(totalRaisedResult?.total || 0),
      activeCampaignCount,
      pendingRequestCount,
      totalDonorCount: Number(totalDonorsResult?.count || 0),
      daysSinceJoined,
    };

    // --- 2. KYC ---
    const kyc = {
      isKycVerified: user.isKycVerified,
      kycStatus: user.isKycVerified ? 'verified' : 'unverified',
    };

    // --- 3. Quick Nav Navigations ---
    const myRequestsTotal = await CampaignRequestRepository.count({
      where: { requesterId: userId },
    });

    const myCampaignsTotal = await CampaignRepository.count({
      where: { creatorId: userId },
    });

    const quickNav = {
      myRequestsTotal,
      myRequestsPending: pendingRequestCount,
      myCampaignsTotal,
      myCampaignsActive: activeCampaignCount,
    };

    // --- 4. Recent Donations to My Campaigns ---
    const [recentDonationsList] = await AppDataSource.createQueryBuilder()
      .select('donation')
      .from(Donation, 'donation')
      .leftJoinAndSelect('donation.donor', 'donor')
      .innerJoinAndSelect('donation.campaign', 'campaign')
      .where('campaign.creatorId = :userId', { userId })
      .andWhere('donation.status = :status', { status: DonationStatus.SUCCESS })
      .orderBy('donation.createdAt', 'DESC')
      .take(donationLimit)
      .getManyAndCount();

    const recentDonationsToMyCampaigns = recentDonationsList.map((d) => ({
      id: d.id,
      campaignId: d.campaign.id,
      campaignTitle: d.campaign.title,
      amount: d.amount,
      createdAt: d.createdAt.toISOString(),
      isAnonymous: d.isAnonymous,
      donorDisplayName: d.isAnonymous ? 'Nhà hảo tâm ẩn danh' : d.donor?.fullName || 'Người dùng',
      status: d.status,
    }));

    // --- 5. My Campaigns Preview ---
    const [recentCampaignsList] = await CampaignRepository.findAndCount({
      where: { creatorId: userId },
      order: { createdAt: 'DESC' },
      take: campaignLimit,
    });

    const myCampaignsPreview = recentCampaignsList.map((c) => {
      const daysLeft = Math.max(
        0,
        Math.ceil((c.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

      const progressPercent = c.goalAmount > 0 ? (c.raisedAmount / c.goalAmount) * 100 : 0;

      return {
        id: c.id,
        title: c.title,
        thumbnailUrl: c.thumbnailUrl,
        status: c.status,
        raisedAmount: c.raisedAmount,
        goalAmount: c.goalAmount,
        progressPercent: Math.min(100, progressPercent),
        donorCount: c.donorCount,
        daysLeft,
        deadline: c.deadline.toISOString(),
      };
    });

    // --- 6. Alerts ---
    // Check for rejected requests recently
    const hasRejectedRequests = await CampaignRequestRepository.exist({
      where: { requesterId: userId, status: CampaignRequestStatus.REJECTED },
    });

    // Check for overdue active campaigns
    const hasOverdueCampaigns = await CampaignRepository.exist({
      where: {
        creatorId: userId,
        status: CampaignStatus.ACTIVE,
      },
    }).then(async (hasActive) => {
      if (!hasActive) return false;
      const count = await AppDataSource.createQueryBuilder()
        .from(Campaign, 'campaign')
        .where('campaign.creatorId = :userId', { userId })
        .andWhere('campaign.status = :status', { status: CampaignStatus.ACTIVE })
        .andWhere('campaign.deadline < NOW()')
        .getCount();
      return count > 0;
    });

    const alerts = {
      needKyc: !user.isKycVerified,
      hasOverdueCampaigns,
      hasRejectedRequests,
    };

    return {
      summary,
      kyc,
      quickNav,
      recentDonationsToMyCampaigns,
      recentDonationsPagination: {
        limit: donationLimit,
        hasMore: false, // pagination cursor logic can be added later if scale demands
        nextCursor: null,
      },
      myCampaignsPreview,
      myCampaignsPreviewPagination: {
        limit: campaignLimit,
        hasMore: false,
        nextCursor: null,
      },
      alerts,
      updatedAt: new Date().toISOString(),
    };
  }
}

export const creatorService = new CreatorService();
