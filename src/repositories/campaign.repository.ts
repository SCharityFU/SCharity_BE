import { AppDataSource } from '../config/database';
import { Campaign, CampaignStatus } from '../entities/Campaign';
import { CampaignRequest, CampaignRequestStatus } from '../entities/CampaignRequest';
import { CampaignUpdate } from '../entities/CampaignUpdate';

export const CampaignRepository = AppDataSource.getRepository(Campaign).extend({
  async findPublicWithPagination(
    page: number,
    limit: number,
    filters: {
      status?: CampaignStatus;
      category?: string;
      search?: string;
    },
    useAccentInsensitiveSearch = true,
  ): Promise<[Campaign[], number]> {
    const publicStatuses = [
      CampaignStatus.ACTIVE,
      CampaignStatus.SUSPENDED,
      CampaignStatus.COMPLETED,
      CampaignStatus.WITHDRAWN,
    ];

    const query = this.createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.creator', 'creator')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.status && publicStatuses.includes(filters.status)) {
      query.andWhere('campaign.status = :status', { status: filters.status });
    } else {
      query.andWhere('campaign.status IN (:...publicStatuses)', { publicStatuses });
    }

    if (filters.category) {
      query.andWhere('campaign.category = :category', { category: filters.category });
    }

    if (filters.search) {
      if (useAccentInsensitiveSearch) {
        query.andWhere('(campaign.title ILIKE :search OR unaccent(campaign.title) ILIKE unaccent(:search))', {
          search: `%${filters.search}%`,
        });
      } else {
        query.andWhere('campaign.title ILIKE :search', {
          search: `%${filters.search}%`,
        });
      }
    }

    query
      .addSelect(
        `CASE
          WHEN campaign.status = :activeStatus THEN 1
          WHEN campaign.status = :suspendedStatus THEN 2
          WHEN campaign.status = :completedStatus THEN 3
          WHEN campaign.status = :withdrawnStatus THEN 4
          ELSE 5
        END`,
        'statuspriority',
      )
      .setParameters({
        activeStatus: CampaignStatus.ACTIVE,
        suspendedStatus: CampaignStatus.SUSPENDED,
        completedStatus: CampaignStatus.COMPLETED,
        withdrawnStatus: CampaignStatus.WITHDRAWN,
      })
      .orderBy('statuspriority', 'ASC')
      .addOrderBy('campaign.createdAt', 'DESC');

    return query.getManyAndCount();
  },

  async findByIdWithCreator(id: string): Promise<Campaign | null> {
    return this.findOne({
      where: { id },
      relations: ['creator'],
    });
  },

  async findWithPagination(
    page: number,
    limit: number,
    filters: {
      status?: CampaignStatus;
      category?: string;
      search?: string;
      creatorId?: string;
    },
    sortBy = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[Campaign[], number]> {
    const query = this.createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.creator', 'creator')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters.status) {
      query.andWhere('campaign.status = :status', { status: filters.status });
    }
    if (filters.category) {
      query.andWhere('campaign.category = :category', { category: filters.category });
    }
    if (filters.search) {
      query.andWhere('campaign.title ILIKE :search', { search: `%${filters.search}%` });
    }
    if (filters.creatorId) {
      query.andWhere('campaign.creatorId = :creatorId', { creatorId: filters.creatorId });
    }

    const validSortColumns = ['createdAt', 'raisedAmount', 'deadline', 'goalAmount'];
    const column = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`campaign.${column}`, sortOrder);

    return query.getManyAndCount();
  },

  async getDashboardStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    completed: number;
    withdrawn: number;
  }> {
    const results = await this.createQueryBuilder('campaign')
      .select('campaign.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('campaign.status')
      .getRawMany();

    const stats = { total: 0, active: 0, suspended: 0, completed: 0, withdrawn: 0 };
    results.forEach((r) => {
      const count = parseInt(r.count);
      stats.total += count;
      if (r.status === CampaignStatus.ACTIVE) stats.active = count;
      if (r.status === CampaignStatus.SUSPENDED) stats.suspended = count;
      if (r.status === CampaignStatus.COMPLETED) stats.completed = count;
      if (r.status === CampaignStatus.WITHDRAWN) stats.withdrawn = count;
    });
    return stats;
  },

  async updateRaisedAmount(campaignId: string, amount: number): Promise<void> {
    await this.createQueryBuilder()
      .update(Campaign)
      .set({
        raisedAmount: () => `"raisedAmount" + ${amount}`,
        donorCount: () => `"donorCount" + 1`,
      })
      .where('id = :id', { id: campaignId })
      .execute();
  },

  async getCreatorSummaryStats(
    creatorId: string,
  ): Promise<{
    totalRaisedAmount: number;
    totalCampaignCount: number;
    activeCampaignCount: number;
    totalDonorCount: number;
    overdueCampaignCount: number;
  }> {
    const raw = await this.createQueryBuilder('campaign')
      .select('COALESCE(SUM(campaign.raisedAmount), 0)', 'totalRaisedAmount')
      .addSelect('COUNT(*)', 'totalCampaignCount')
      .addSelect(
        `COUNT(*) FILTER (WHERE campaign.status = '${CampaignStatus.ACTIVE}')`,
        'activeCampaignCount',
      )
      .addSelect('COALESCE(SUM(campaign.donorCount), 0)', 'totalDonorCount')
      .addSelect(
        `COUNT(*) FILTER (WHERE campaign.status = '${CampaignStatus.ACTIVE}' AND campaign.deadline < NOW())`,
        'overdueCampaignCount',
      )
      .where('campaign.creatorId = :creatorId', { creatorId })
      .getRawOne();

    return {
      totalRaisedAmount: Number(raw?.totalRaisedAmount ?? 0),
      totalCampaignCount: Number(raw?.totalCampaignCount ?? 0),
      activeCampaignCount: Number(raw?.activeCampaignCount ?? 0),
      totalDonorCount: Number(raw?.totalDonorCount ?? 0),
      overdueCampaignCount: Number(raw?.overdueCampaignCount ?? 0),
    };
  },

  async findCreatorPreview(
    creatorId: string,
    limit: number,
  ): Promise<Campaign[]> {
    return this.createQueryBuilder('campaign')
      .where('campaign.creatorId = :creatorId', { creatorId })
      .orderBy('campaign.createdAt', 'DESC')
      .take(limit)
      .getMany();
  },

  async findCreatorPreviewWithCursor(
    creatorId: string,
    limit: number,
    cursor?: { createdAt: Date; id: string },
  ): Promise<{ items: Campaign[]; hasMore: boolean }> {
    const query = this.createQueryBuilder('campaign')
      .where('campaign.creatorId = :creatorId', { creatorId })
      .orderBy('campaign.createdAt', 'DESC')
      .addOrderBy('campaign.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      query.andWhere(
        '(campaign.createdAt < :cursorCreatedAt OR (campaign.createdAt = :cursorCreatedAt AND campaign.id < :cursorId))',
        {
          cursorCreatedAt: cursor.createdAt,
          cursorId: cursor.id,
        },
      );
    }

    const rows = await query.getMany();
    const hasMore = rows.length > limit;
    return {
      items: hasMore ? rows.slice(0, limit) : rows,
      hasMore,
    };
  },
});

export const CampaignRequestRepository = AppDataSource.getRepository(CampaignRequest).extend({
  async findWithPagination(
    page: number,
    limit: number,
    status?: CampaignRequestStatus,
  ): Promise<[CampaignRequest[], number]> {
    const query = this.createQueryBuilder('request')
      .leftJoinAndSelect('request.requester', 'requester')
      .leftJoinAndSelect('request.reviewedBy', 'reviewedBy')
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('request.status = :status', { status });
    }

    return query.getManyAndCount();
  },

  async getCreatorRequestStats(
    requesterId: string,
  ): Promise<{
    total: number;
    pending: number;
    rejected: number;
  }> {
    const raw = await this.createQueryBuilder('request')
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE request.status = '${CampaignRequestStatus.PENDING}')`,
        'pending',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE request.status = '${CampaignRequestStatus.REJECTED}')`,
        'rejected',
      )
      .where('request.requesterId = :requesterId', { requesterId })
      .getRawOne();

    return {
      total: Number(raw?.total ?? 0),
      pending: Number(raw?.pending ?? 0),
      rejected: Number(raw?.rejected ?? 0),
    };
  },
});

export const CampaignUpdateRepository = AppDataSource.getRepository(CampaignUpdate).extend({
  async findByCampaignId(
    campaignId: string,
    page: number,
    limit: number,
    where?: { isDraft?: boolean },
  ): Promise<[CampaignUpdate[], number]> {
    // If where is provided, merge it with campaignId; otherwise default to published updates only
    const whereClause = where
      ? { ...where, campaignId }
      : { campaignId, isDraft: false };

    return this.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['creator'],
    });
  },
});
