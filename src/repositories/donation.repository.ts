import { AppDataSource } from '../config/database';
import { Donation, DonationStatus } from '../entities/Donation';
import { Comment } from '../entities/Comment';

export const DonationRepository = AppDataSource.getRepository(Donation).extend({
  async findByDonorId(
    donorId: string,
    page: number,
    limit: number,
    filters?: { status?: DonationStatus; startDate?: Date; endDate?: Date },
  ): Promise<[Donation[], number]> {
    const query = this.createQueryBuilder('donation')
      .leftJoinAndSelect('donation.campaign', 'campaign')
      .where('donation.donorId = :donorId', { donorId })
      .orderBy('donation.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.status) {
      query.andWhere('donation.status = :status', { status: filters.status });
    }
    if (filters?.startDate) {
      query.andWhere('donation.createdAt >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      query.andWhere('donation.createdAt <= :endDate', { endDate: filters.endDate });
    }

    return query.getManyAndCount();
  },

  async findByCampaignId(
    campaignId: string,
    page: number,
    limit: number,
    search?: string,
    sortBy = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: Date,
    endDate?: Date,
  ): Promise<[Donation[], number]> {
    const query = this.createQueryBuilder('donation')
      .leftJoinAndSelect('donation.donor', 'donor')
      .where('donation.campaignId = :campaignId', { campaignId })
      .andWhere('donation.status = :status', { status: DonationStatus.SUCCESS })
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere('donor.fullName ILIKE :search', { search: `%${search}%` });
    }

    if (startDate) {
      query.andWhere('donation.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('donation.createdAt <= :endDate', { endDate });
    }

    const validSortColumns = ['createdAt', 'amount'];
    const column = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`donation.${column}`, sortOrder);

    return query.getManyAndCount();
  },

  async findAllWithPagination(
    page: number,
    limit: number,
    search?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[Donation[], number]> {
    const query = this.createQueryBuilder('donation')
      .leftJoinAndSelect('donation.campaign', 'campaign')
      .leftJoinAndSelect('donation.donor', 'donor')
      .orderBy('donation.createdAt', sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      query.andWhere('donor.fullName ILIKE :search', { search: `%${search}%` });
    }

    return query.getManyAndCount();
  },

  async getTotalDonationStats(): Promise<{
    totalReceived: number;
    totalPaid: number;
  }> {
    const result = await this.createQueryBuilder('donation')
      .select('SUM(donation.amount)', 'totalReceived')
      .where('donation.status = :status', { status: DonationStatus.SUCCESS })
      .getRawOne();

    return {
      totalReceived: parseFloat(result?.totalReceived || '0'),
      totalPaid: 0, // This would come from withdraw requests
    };
  },

  async getDonationChartData(
    campaignId: string,
    days = 30,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ date: string; amount: number; count: number }>> {
    const query = this.createQueryBuilder('donation')
      .select("TO_CHAR(DATE_TRUNC('day', donation.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(donation.amount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .where('donation.campaignId = :campaignId', { campaignId })
      .andWhere('donation.status = :status', { status: DonationStatus.SUCCESS });

    if (startDate && endDate) {
      query
        .andWhere('donation.createdAt >= :startDate', { startDate })
        .andWhere('donation.createdAt <= :endDate', { endDate });
    } else {
      query.andWhere(`donation.createdAt >= NOW() - INTERVAL '${days} days'`);
    }

    return query
      .groupBy("TO_CHAR(DATE_TRUNC('day', donation.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(DATE_TRUNC('day', donation.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD')", 'ASC')
      .getRawMany();
  },

  async getCampaignDailyDonorBreakdown(
    campaignId: string,
    days = 30,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    Array<{
      date: string;
      donorId: string;
      donorName: string;
      totalAmount: number;
      donationCount: number;
    }>
  > {
    const query = this.createQueryBuilder('donation')
      .leftJoin('donation.donor', 'donor')
      .select("TO_CHAR(DATE_TRUNC('day', donation.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD')", 'date')
      .addSelect("COALESCE(CAST(donation.donorId AS text), 'guest')", 'donorId')
      .addSelect("COALESCE(donor.fullName, 'Guest donor')", 'donorName')
      .addSelect('SUM(donation.amount)', 'totalAmount')
      .addSelect('COUNT(*)', 'donationCount')
      .where('donation.campaignId = :campaignId', { campaignId })
      .andWhere('donation.status = :status', { status: DonationStatus.SUCCESS });

    if (startDate && endDate) {
      query
        .andWhere('donation.createdAt >= :startDate', { startDate })
        .andWhere('donation.createdAt <= :endDate', { endDate });
    } else {
      query.andWhere(`donation.createdAt >= NOW() - INTERVAL '${days} days'`);
    }

    return query
      .groupBy("TO_CHAR(DATE_TRUNC('day', donation.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD')")
      .addGroupBy('donation.donorId')
      .addGroupBy('donor.fullName')
      .orderBy("TO_CHAR(DATE_TRUNC('day', donation.createdAt AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYY-MM-DD')", 'ASC')
      .addOrderBy('SUM(donation.amount)', 'DESC')
      .getRawMany();
  },

  async getSystemChartData(
    interval: 'day' | 'week' | 'month' = 'day',
    days = 30,
  ): Promise<Array<{ date: string; amount: number; count: number }>> {
    return this.createQueryBuilder('donation')
      .select(`DATE_TRUNC('${interval}', donation.createdAt)`, 'date')
      .addSelect('SUM(donation.amount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .where('donation.status = :status', { status: DonationStatus.SUCCESS })
      .andWhere(`donation.createdAt >= NOW() - INTERVAL '${days} days'`)
      .groupBy(`DATE_TRUNC('${interval}', donation.createdAt)`)
      .orderBy(`DATE_TRUNC('${interval}', donation.createdAt)`, 'ASC')
      .getRawMany();
  },
});

export const CommentRepository = AppDataSource.getRepository(Comment).extend({
  async findByCampaignId(
    campaignId: string,
    page: number,
    limit: number,
    sortBy = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<[Comment[], number]> {
    const query = this.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.donor', 'donor')
      .where('comment.campaignId = :campaignId', { campaignId })
      .skip((page - 1) * limit)
      .take(limit);

    const validSortColumns = ['createdAt'];
    const column = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`comment.${column}`, sortOrder);

    return query.getManyAndCount();
  },

  async hasUserDonatedToCampaign(userId: string, campaignId: string): Promise<boolean> {
    const count = await this.createQueryBuilder('comment')
      .innerJoin('comment.donation', 'donation')
      .where('comment.donorId = :userId', { userId })
      .andWhere('comment.campaignId = :campaignId', { campaignId })
      .andWhere('donation.status = :status', { status: 'success' })
      .getCount();
    return count > 0;
  },
});
