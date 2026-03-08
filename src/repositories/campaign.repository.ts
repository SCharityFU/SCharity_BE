import { AppDataSource } from '../config/database';
import { Campaign, CampaignStatus } from '../entities/Campaign';
import { CampaignRequest, CampaignRequestStatus } from '../entities/CampaignRequest';
import { CampaignUpdate } from '../entities/CampaignUpdate';

export const CampaignRepository = AppDataSource.getRepository(Campaign).extend({
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
});

export const CampaignUpdateRepository = AppDataSource.getRepository(CampaignUpdate).extend({
  async findByCampaignId(
    campaignId: string,
    page: number,
    limit: number,
  ): Promise<[CampaignUpdate[], number]> {
    return this.findAndCount({
      where: { campaignId, isDraft: false },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['creator'],
    });
  },
});
