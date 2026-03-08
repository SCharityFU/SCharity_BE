import { AppDataSource } from '../config/database';
import { Report, ReportStatus } from '../entities/Report';

export const ReportRepository = AppDataSource.getRepository(Report).extend({
  async findWithPagination(
    page: number,
    limit: number,
    status?: ReportStatus,
  ): Promise<[Report[], number]> {
    const query = this.createQueryBuilder('report')
      .leftJoinAndSelect('report.campaign', 'campaign')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('report.status = :status', { status });
    }

    return query.getManyAndCount();
  },

  async findByCampaignId(
    campaignId: string,
    page: number,
    limit: number,
  ): Promise<[Report[], number]> {
    return this.findAndCount({
      where: { campaignId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['reporter'],
    });
  },

  async hasUserReportedCampaign(userId: string, campaignId: string): Promise<boolean> {
    const count = await this.count({ where: { reporterId: userId, campaignId } });
    return count > 0;
  },
});
