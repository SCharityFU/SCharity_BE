import { AppDataSource } from '../config/database';
import { WithdrawRequest, WithdrawStatus } from '../entities/WithdrawRequest';

export const WithdrawRepository = AppDataSource.getRepository(WithdrawRequest).extend({
  async findWithPagination(
    page: number,
    limit: number,
    filters?: { status?: WithdrawStatus; creatorId?: string },
  ): Promise<[WithdrawRequest[], number]> {
    const query = this.createQueryBuilder('wr')
      .leftJoinAndSelect('wr.campaign', 'campaign')
      .leftJoinAndSelect('wr.requester', 'requester')
      .leftJoinAndSelect('wr.processedBy', 'processedBy')
      .orderBy('wr.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.status) {
      query.andWhere('wr.status = :status', { status: filters.status });
    }

    if (filters?.creatorId) {
      query.andWhere('wr.requesterId = :creatorId', { creatorId: filters.creatorId });
    }

    return query.getManyAndCount();
  },

  async findByCampaignId(campaignId: string): Promise<WithdrawRequest[]> {
    return this.find({
      where: { campaignId, status: WithdrawStatus.PENDING },
      relations: ['campaign', 'requester'],
    });
  },

  async getTotalPaidAmount(campaignId?: string): Promise<number> {
    const query = this.createQueryBuilder('wr')
      .select('SUM(wr.amount)', 'total')
      .where('wr.status = :status', { status: WithdrawStatus.COMPLETED });

    if (campaignId) {
      query.andWhere('wr.campaignId = :campaignId', { campaignId });
    }

    const result = await query.getRawOne();
    return parseFloat(result?.total || '0');
  },
});
