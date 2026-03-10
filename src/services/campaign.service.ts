import {
  CampaignRepository,
  CampaignRequestRepository,
  CampaignUpdateRepository,
} from '../repositories/campaign.repository';
import { DonationRepository } from '../repositories/donation.repository';
import { ReportRepository } from '../repositories/report.repository';
import { toReportBriefDto } from '../utils/dto-mapper';
import { CampaignStatus } from '../entities/Campaign';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors';
import {
  CreateCampaignRequestDto,
  CampaignQueryDto,
  CreateCampaignUpdateDto,
} from '../validators/campaign.validator';
import { emailQueue } from '../queues/email.queue';
import redisClient from '../config/redis';
import { UserRepository } from '../repositories/user.repository';

const CAMPAIGN_CACHE_TTL = 300; // 5 minutes

export class CampaignService {
  async createRequest(dto: CreateCampaignRequestDto, creatorId: string) {
    const creator = await UserRepository.findOne({ where: { id: creatorId } });
    if (!creator?.isKycVerified) {
      throw new ForbiddenError('You must complete KYC verification before creating a campaign');
    }

    const request = CampaignRequestRepository.create({
      ...dto,
      deadline: new Date(dto.deadline),
      requesterId: creatorId,
      bankInfo: dto.bankInfo,
    });

    await CampaignRequestRepository.save(request);

    // Notify admins
    await emailQueue.add('sendNewCampaignRequestEmail', {
      campaignTitle: dto.title,
      requesterName: creator.fullName,
    });

    return request;
  }

  async getMyRequests(creatorId: string, page: number, limit: number) {
    return CampaignRequestRepository.findAndCount({
      where: { requesterId: creatorId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async listCampaigns(query: CampaignQueryDto) {
    const cacheKey = `campaigns:${JSON.stringify(query)}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [campaigns, total] = await CampaignRepository.findWithPagination(
      query.page,
      query.limit,
      {
        status: query.status as CampaignStatus,
        category: query.category,
        search: query.search,
      },
      query.sortBy,
      query.sortOrder,
    );

    const result = { campaigns, total };
    await redisClient.setex(cacheKey, CAMPAIGN_CACHE_TTL, JSON.stringify(result));
    return result;
  }

  async getCampaignById(id: string) {
    const cacheKey = `campaign:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const campaign = await CampaignRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    await redisClient.setex(cacheKey, CAMPAIGN_CACHE_TTL, JSON.stringify(campaign));
    return campaign;
  }

  async updateCampaign(
    id: string,
    creatorId: string,
    data: { story?: string; thumbnailUrl?: string },
  ) {
    const campaign = await CampaignRepository.findOne({ where: { id, creatorId } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (campaign.status !== CampaignStatus.PENDING) {
      throw new ForbiddenError('Campaign can only be updated when in pending status');
    }

    await CampaignRepository.update(id, data);
    await redisClient.del(`campaign:${id}`);

    return CampaignRepository.findOne({ where: { id } });
  }

  async closeCampaign(id: string, creatorId: string) {
    const campaign = await CampaignRepository.findOne({
      where: { id, creatorId },
      relations: ['creator'],
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (!campaign.canClose) {
      throw new BadRequestError(
        'Campaign can only be closed when funding reaches 50% or deadline has passed',
      );
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new ConflictError('Campaign is not active');
    }

    campaign.status = CampaignStatus.CLOSED;
    campaign.closedAt = new Date();
    await CampaignRepository.save(campaign);
    await redisClient.del(`campaign:${id}`);

    return campaign;
  }

  async getCampaignAnalytics(id: string, creatorId: string, days = 30) {
    const campaign = await CampaignRepository.findOne({ where: { id, creatorId } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    const [chartData, recentDonations, totalDonors] = await Promise.all([
      DonationRepository.getDonationChartData(id, days),
      DonationRepository.findByCampaignId(id, 1, 10, undefined, 'createdAt', 'DESC'),
      DonationRepository.count({ where: { campaignId: id } }),
    ]);

    return {
      campaign,
      chartData,
      recentDonations: recentDonations[0],
      totalDonors,
    };
  }

  async getPublicActiveCampaigns(query: CampaignQueryDto) {
    return this.listCampaigns({
      ...query,
      status: CampaignStatus.ACTIVE as string,
    } as typeof query);
  }

  async getCampaignUpdates(campaignId: string, page: number, limit: number) {
    const campaign = await CampaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    return CampaignUpdateRepository.findByCampaignId(campaignId, page, limit);
  }

  async createCampaignUpdate(
    campaignId: string,
    creatorId: string,
    dto: CreateCampaignUpdateDto,
    mediaUrls?: string[],
  ) {
    const campaign = await CampaignRepository.findOne({
      where: { id: campaignId, creatorId },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    const allowedStatuses = [
      CampaignStatus.ACTIVE,
      CampaignStatus.CLOSED,
      CampaignStatus.WITHDRAWN,
    ];
    if (!allowedStatuses.includes(campaign.status)) {
      throw new ForbiddenError('Cannot post updates for this campaign in its current status');
    }

    if (campaign.status === CampaignStatus.SUSPENDED) {
      throw new ForbiddenError('Cannot post updates for a suspended campaign');
    }

    const update = CampaignUpdateRepository.create({
      ...dto,
      isDraft: dto.isDraft === 'true',
      campaignId,
      creatorId,
      mediaUrls,
    });

    await CampaignUpdateRepository.save(update);

    // Notify donors if not a draft
    if (!dto.isDraft) {
      const donors = await DonationRepository.find({
        where: { campaignId, status: 'success' as never },
        relations: ['donor'],
        select: ['donor'],
      });

      const uniqueDonorEmails = [...new Set(donors.map((d) => d.donor?.email).filter(Boolean))];
      if (uniqueDonorEmails.length > 0) {
        await emailQueue.add('sendCampaignUpdateNotification', {
          emails: uniqueDonorEmails,
          campaignTitle: campaign.title,
          updateTitle: dto.title,
          campaignId,
        });
      }
    }

    return update;
  }

  async reportCampaign(
    campaignId: string,
    reporterId: string,
    reason: string,
    description?: string,
    evidenceUrls?: string[],
  ) {
    const campaign = await CampaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    const alreadyReported = await ReportRepository.hasUserReportedCampaign(reporterId, campaignId);
    if (alreadyReported) {
      throw new ConflictError('You have already reported this campaign');
    }

    const report = ReportRepository.create({
      campaignId,
      reporterId,
      reason: reason as never,
      description,
      evidenceUrls,
    });

    await ReportRepository.save(report);

    // Increment report count
    await CampaignRepository.increment({ id: campaignId }, 'reportCount', 1);

    return toReportBriefDto(report);
  }

  async getMyCampaigns(creatorId: string, page: number, limit: number) {
    return CampaignRepository.findWithPagination(page, limit, { creatorId });
  }
}

export const campaignService = new CampaignService();
