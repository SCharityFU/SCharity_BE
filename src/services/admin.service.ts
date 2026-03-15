import { CampaignRepository, CampaignRequestRepository } from '../repositories/campaign.repository';
import { DonationRepository } from '../repositories/donation.repository';
import { WithdrawRepository } from '../repositories/withdraw.repository';
import { UserRepository, BankAccountRepository, BankAccountChangeRequestRepository } from '../repositories/user.repository';
import { ReportRepository } from '../repositories/report.repository';
import {
  toReportDetailDto,
  toAdminCampaignAnalyticsDto,
  toAdminCampaignDetailDto,
  toCampaignRequestResponseDto,
  toCampaignDonationAdminDto,
  toAdminCampaignListItemDto,
} from '../utils/dto-mapper';
import { Campaign, CampaignStatus } from '../entities/Campaign';
import { CampaignRequestStatus } from '../entities/CampaignRequest';
import { WithdrawStatus } from '../entities/WithdrawRequest';
import { BankChangeStatus } from '../entities/BankAccountChangeRequest';
import { ReportStatus } from '../entities/Report';
import { AuditLog, AuditAction } from '../entities/AuditLog';
import { AppDataSource } from '../config/database';
import { DashboardStats } from '../types';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { emailQueue } from '../queues/email.queue';
import { getVietnamDateString, getVietnamDayRangeUtc, getVietnamRecentDaysRange } from '../utils/timezone';

import { UserRole } from '../entities/User';
import { Donation } from '../entities/Donation';

const TOP_DONORS_PER_DAY = 5;

const AuditLogRepository = AppDataSource.getRepository(AuditLog);

const toDateKey = (value: string | Date): string => {
  return getVietnamDateString(value);
};

const buildDailyChartSeries = (
  dateKeys: string[],
  rawPoints: Array<{ date: string; amount: number; count: number }>,
  rawDonorBreakdowns: Array<{
    date: string;
    donorId: string;
    donorName: string;
    totalAmount: number;
    donationCount: number;
  }> = [],
): Array<{
  date: string;
  amount: number;
  count: number;
  donors: Array<{
    donorId: string;
    donorName: string;
    totalAmount: number;
    donationCount: number;
  }>;
}> => {
  const byDate = new Map<string, { amount: number; count: number }>();
  const donorsByDate = new Map<
    string,
    Array<{
      donorId: string;
      donorName: string;
      totalAmount: number;
      donationCount: number;
    }>
  >();

  for (const point of rawPoints) {
    const dateKey = toDateKey(point.date);
    const current = byDate.get(dateKey) ?? { amount: 0, count: 0 };
    byDate.set(dateKey, {
      amount: current.amount + Number(point.amount),
      count: current.count + Number(point.count),
    });
  }

  for (const donorRow of rawDonorBreakdowns) {
    const dateKey = toDateKey(donorRow.date);
    const currentRows = donorsByDate.get(dateKey) ?? [];

    currentRows.push({
      donorId: donorRow.donorId,
      donorName: donorRow.donorName,
      totalAmount: Number(donorRow.totalAmount),
      donationCount: Number(donorRow.donationCount),
    });

    donorsByDate.set(dateKey, currentRows);
  }

  const series: Array<{
    date: string;
    amount: number;
    count: number;
    donors: Array<{
      donorId: string;
      donorName: string;
      totalAmount: number;
      donationCount: number;
    }>;
  }> = [];
  for (const date of dateKeys) {
    const value = byDate.get(date);
    const donors = (donorsByDate.get(date) ?? [])
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, TOP_DONORS_PER_DAY);

    series.push({
      date,
      amount: value?.amount ?? 0,
      count: value?.count ?? 0,
      donors,
    });
  }

  return series;
};

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [campaignStats, donationStats, paidStats, totalUsers, totalCampaignCreators, totalDonors] = await Promise.all(
      [
        CampaignRepository.getDashboardStats(),
        DonationRepository.getTotalDonationStats(),
        WithdrawRepository.getTotalPaidAmount(),
        UserRepository.count({ where: { role: UserRole.USER } }),
        CampaignRepository.createQueryBuilder('c')
          .select('COUNT(DISTINCT c.creatorId)', 'count')
          .getRawOne()
          .then((r) => parseInt(r?.count || '0')),
        AppDataSource.getRepository(Donation)
          .createQueryBuilder('d')
          .where('d.donorId IS NOT NULL')
          .select('COUNT(DISTINCT d.donorId)', 'count')
          .getRawOne()
          .then((r) => parseInt(r?.count || '0')),
      ],
    );

    return {
      totalCampaigns: campaignStats.total,
      successfulCampaigns: campaignStats.completed + campaignStats.withdrawn,
      suspendedCampaigns: campaignStats.suspended,
      totalDonationReceived: donationStats.totalReceived,
      totalDonationPaid: paidStats,
      adminBalance: donationStats.totalReceived - paidStats,
      totalCampaignCreators,
      totalDonors,
      totalUsers,
    };
  }

  async getDonationChartData(interval: 'day' | 'week' | 'month' = 'day', days = 30) {
    return DonationRepository.getSystemChartData(interval, days);
  }

  async listCampaignRequests(page: number, limit: number, status?: CampaignRequestStatus) {
    const [requests, total] = await CampaignRequestRepository.findWithPagination(page, limit, status);
    return [requests.map(toCampaignRequestResponseDto), total] as const;
  }

  async getCampaignRequestById(id: string) {
    const request = await CampaignRequestRepository.findOne({
      where: { id },
      relations: ['requester', 'reviewedBy'],
    });
    if (!request) throw new NotFoundError('Campaign request not found');
    return toCampaignRequestResponseDto(request);
  }

  async reviewCampaignRequest(id: string, adminId: string, action: 'approve' | 'reject', rejectReason?: string) {
    const request = await CampaignRequestRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundError('Campaign request not found');

    if (request.status !== CampaignRequestStatus.PENDING) {
      throw new ConflictError('Request already processed');
    }

    const now = new Date();
    request.reviewedById = adminId;
    request.reviewedAt = now;

    if (action === 'approve') {
      request.status = CampaignRequestStatus.APPROVED;

      // Create actual campaign
      const campaign = CampaignRepository.create({
        title: request.title,
        story: request.story,
        goalAmount: request.goalAmount,
        deadline: request.deadline,
        category: request.category as Campaign['category'],
        thumbnailUrl: request.thumbnailUrl,
        mediaUrls: request.mediaUrls,
        status: CampaignStatus.ACTIVE,
        creatorId: request.requesterId,
        approvedAt: now,
      });

      const savedCampaign = await CampaignRepository.save(campaign);
      request.campaignId = savedCampaign.id;

      const requester = await UserRepository.findOne({
        where: { id: request.requesterId },
      });
      await emailQueue.add('sendCampaignApprovedEmail', {
        email: requester?.email,
        creatorName: requester?.fullName,
        campaignTitle: request.title,
      });
    } else {
      if (!rejectReason) throw new BadRequestError('Reject reason is required');
      request.status = CampaignRequestStatus.REJECTED;
      request.rejectReason = rejectReason;

      const requester = await UserRepository.findOne({
        where: { id: request.requesterId },
      });
      await emailQueue.add('sendCampaignRejectedEmail', {
        email: requester?.email,
        creatorName: requester?.fullName,
        campaignTitle: request.title,
        reason: rejectReason,
      });
    }

    await CampaignRequestRepository.save(request);

    const savedRequest = await CampaignRequestRepository.findOne({
      where: { id: request.id },
      relations: ['requester', 'reviewedBy'],
    });

    // Audit log
    await AuditLogRepository.save({
      action: action === 'approve' ? AuditAction.CAMPAIGN_APPROVED : AuditAction.CAMPAIGN_REJECTED,
      actorId: adminId,
      targetId: id,
      targetType: 'CampaignRequest',
      metadata: { action, rejectReason },
    });

    return toCampaignRequestResponseDto(savedRequest ?? request);
  }

  async listCampaigns(
    page: number,
    limit: number,
    filters: {
      status?: CampaignStatus;
      search?: string;
      category?: string;
    },
  ) {
    const [campaigns, total] = await CampaignRepository.findWithPagination(page, limit, filters, 'createdAt', 'DESC');

    return [campaigns.map(toAdminCampaignListItemDto), total] as const;
  }

  async getCampaignDetails(id: string) {
    const campaign = await CampaignRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!campaign) throw new NotFoundError('Campaign not found');
    return toAdminCampaignDetailDto(campaign);
  }

  async getCampaignAnalytics(id: string, days = 30) {
    const campaign = await CampaignRepository.findOne({
      where: { id },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    const { startUtc, endUtc, dateKeys } = getVietnamRecentDaysRange(days);

    const [rawChartData, rawDonorBreakdowns] = await Promise.all([
      DonationRepository.getDonationChartData(id, days, startUtc, endUtc),
      DonationRepository.getCampaignDailyDonorBreakdown(id, days, startUtc, endUtc),
    ]);
    const chartData = buildDailyChartSeries(dateKeys, rawChartData, rawDonorBreakdowns);

    return toAdminCampaignAnalyticsDto(id, days, chartData);
  }

  async suspendCampaign(id: string, adminId: string, reason: string) {
    const campaign = await CampaignRepository.findOne({ where: { id } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (campaign.status === CampaignStatus.SUSPENDED) {
      throw new ConflictError('Campaign is already suspended');
    }

    if (campaign.status !== CampaignStatus.ACTIVE && campaign.status !== CampaignStatus.CLOSED) {
      throw new BadRequestError('Only active or closed campaigns can be suspended');
    }

    campaign.status = CampaignStatus.SUSPENDED;
    campaign.suspendReason = reason;
    campaign.suspendedAt = new Date();
    await CampaignRepository.save(campaign);

    // Cancel pending withdraw requests
    await WithdrawRepository.createQueryBuilder()
      .update()
      .set({
        status: WithdrawStatus.REJECTED,
        rejectReason: 'Campaign suspended by admin',
      })
      .where('campaignId = :id AND status = :status', {
        id,
        status: WithdrawStatus.PENDING,
      })
      .execute();

    await AuditLogRepository.save({
      action: AuditAction.CAMPAIGN_SUSPENDED,
      actorId: adminId,
      targetId: id,
      targetType: 'Campaign',
      metadata: { reason },
    });

    // Notify campaign creator
    const creator = await UserRepository.findOne({
      where: { id: campaign.creatorId },
    });
    if (creator) {
      await emailQueue.add('sendCampaignSuspendedEmail', {
        email: creator.email,
        creatorName: creator.fullName,
        campaignTitle: campaign.title,
        reason,
      });
    }

    return campaign;
  }

  async unsuspendCampaign(id: string, adminId: string) {
    const campaign = await CampaignRepository.findOne({ where: { id } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (campaign.status !== CampaignStatus.SUSPENDED) {
      throw new BadRequestError('Campaign is not suspended');
    }

    campaign.status = campaign.isDeadlineReached ? CampaignStatus.CLOSED : CampaignStatus.ACTIVE;
    campaign.suspendReason = null as unknown as string;
    campaign.suspendedAt = null as unknown as Date;
    await CampaignRepository.save(campaign);

    await AuditLogRepository.save({
      action: AuditAction.CAMPAIGN_UNSUSPENDED,
      actorId: adminId,
      targetId: id,
      targetType: 'Campaign',
      metadata: { restoredStatus: campaign.status },
    });

    // Notify campaign creator
    const creator = await UserRepository.findOne({
      where: { id: campaign.creatorId },
    });
    if (creator) {
      await emailQueue.add('sendCampaignUnsuspendedEmail', {
        email: creator.email,
        creatorName: creator.fullName,
        campaignTitle: campaign.title,
        restoredStatus: campaign.status,
      });
    }

    return campaign;
  }

  async listWithdrawRequests(page: number, limit: number, status?: WithdrawStatus) {
    return WithdrawRepository.findWithPagination(page, limit, status ? { status } : undefined);
  }

  async processWithdrawRequest(id: string, adminId: string, action: 'approve' | 'reject', rejectReason?: string) {
    const request = await WithdrawRepository.findOne({
      where: { id },
      relations: ['campaign', 'requester'],
    });
    if (!request) throw new NotFoundError('Withdraw request not found');

    if (request.status !== WithdrawStatus.PENDING) {
      throw new ConflictError('Withdraw request already processed');
    }

    request.processedById = adminId;
    request.processedAt = new Date();

    if (action === 'approve') {
      request.status = WithdrawStatus.APPROVED;
      // TODO: Actual bank transfer logic
      // In production, trigger actual bank transfer here
      request.status = WithdrawStatus.COMPLETED;

      // Update campaign status
      request.campaign.status = CampaignStatus.WITHDRAWN;
      await CampaignRepository.save(request.campaign);

      await emailQueue.add('sendWithdrawApprovedEmail', {
        email: request.requester.email,
        creatorName: request.requester.fullName,
        campaignTitle: request.campaign.title,
        amount: request.amount,
      });
    } else {
      if (!rejectReason) throw new BadRequestError('Reject reason required');
      request.status = WithdrawStatus.REJECTED;
      request.rejectReason = rejectReason;

      await emailQueue.add('sendWithdrawRejectedEmail', {
        email: request.requester.email,
        creatorName: request.requester.fullName,
        campaignTitle: request.campaign.title,
        reason: rejectReason,
      });
    }

    await WithdrawRepository.save(request);

    await AuditLogRepository.save({
      action: action === 'approve' ? AuditAction.WITHDRAW_APPROVED : AuditAction.WITHDRAW_REJECTED,
      actorId: adminId,
      targetId: id,
      targetType: 'WithdrawRequest',
      metadata: { action, rejectReason },
    });

    return request;
  }

  async listReports(page: number, limit: number, status?: ReportStatus) {
    const [reports, total] = await ReportRepository.findWithPagination(page, limit, status);
    return [reports.map(toReportDetailDto), total] as const;
  }

  async resolveReport(id: string, adminId: string) {
    const report = await ReportRepository.findOne({
      where: { id },
      relations: ['campaign', 'reporter', 'resolvedBy'],
    });
    if (!report) throw new NotFoundError('Report not found');

    report.status = ReportStatus.RESOLVED;
    report.resolvedById = adminId;
    report.resolvedAt = new Date();
    await ReportRepository.save(report);

    await AuditLogRepository.save({
      action: AuditAction.REPORT_RESOLVED,
      actorId: adminId,
      targetId: id,
      targetType: 'Report',
      metadata: { campaignId: report.campaignId },
    });

    // Reload to get resolvedBy relation
    const saved = await ReportRepository.findOne({
      where: { id },
      relations: ['campaign', 'reporter', 'resolvedBy'],
    });

    return toReportDetailDto(saved!);
  }

  async listAllTransactions(page: number, limit: number, search?: string, sortOrder: 'ASC' | 'DESC' = 'DESC') {
    const [donations, total] = await DonationRepository.findAllWithPagination(page, limit, search, sortOrder);
    return [donations.map(toCampaignDonationAdminDto), total] as const;
  }

  async getCampaignTransactions(
    campaignId: string,
    page: number,
    limit: number,
    search?: string,
    sortBy = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    startDate?: string,
    endDate?: string,
  ) {
    const campaign = await CampaignRepository.findOne({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    const startBoundary = startDate ? getVietnamDayRangeUtc(startDate).startUtc : undefined;
    const endBoundary = endDate ? getVietnamDayRangeUtc(endDate).endUtc : undefined;

    const [donations, total] = await DonationRepository.findByCampaignId(
      campaignId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      startBoundary,
      endBoundary,
    );
    return [donations.map(toCampaignDonationAdminDto), total] as const;
  }

  async getWithdrawRequestById(id: string) {
    const request = await WithdrawRepository.findOne({
      where: { id },
      relations: ['campaign', 'requester'],
    });
    if (!request) throw new NotFoundError('Withdraw request not found');
    return request;
  }

  // ── Bank account change requests ────────────────────────────────────────

  async listBankChangeRequests(page: number, limit: number) {
    return BankAccountChangeRequestRepository.findAndCount({
      where: { status: BankChangeStatus.PENDING },
      relations: ['requester', 'bankAccount'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async processBankChangeRequest(
    id: string,
    adminId: string,
    action: 'approve' | 'reject',
    rejectReason?: string,
  ) {
    const changeRequest = await BankAccountChangeRequestRepository.findOne({
      where: { id },
      relations: ['requester', 'bankAccount'],
    });
    if (!changeRequest) throw new NotFoundError('Bank change request not found');

    if (changeRequest.status !== BankChangeStatus.PENDING) {
      throw new ConflictError('Bank change request already processed');
    }

    changeRequest.processedById = adminId;
    changeRequest.processedAt = new Date();

    if (action === 'approve') {
      changeRequest.status = BankChangeStatus.APPROVED;

      // Update actual bank account with new info
      await BankAccountRepository.update(changeRequest.bankAccountId, {
        bankName: changeRequest.newBankName,
        accountNumber: changeRequest.newAccountNumber,
        accountHolderName: changeRequest.newAccountHolderName,
        isBankInfoApproved: true,
      });

      await emailQueue.add('sendBankChangeApprovedEmail', {
        email: changeRequest.requester.email,
        userName: changeRequest.requester.fullName,
        bankName: changeRequest.newBankName,
        accountNumber: changeRequest.newAccountNumber,
      });
    } else {
      if (!rejectReason) throw new BadRequestError('Reject reason is required');
      changeRequest.status = BankChangeStatus.REJECTED;
      changeRequest.rejectReason = rejectReason;

      // Re-enable bank account since request was rejected (keep old info)
      await BankAccountRepository.update(changeRequest.bankAccountId, {
        isBankInfoApproved: true,
      });

      await emailQueue.add('sendBankChangeRejectedEmail', {
        email: changeRequest.requester.email,
        userName: changeRequest.requester.fullName,
        reason: rejectReason,
      });
    }

    await BankAccountChangeRequestRepository.save(changeRequest);

    await AuditLogRepository.save({
      action:
        action === 'approve'
          ? AuditAction.BANK_CHANGE_APPROVED
          : AuditAction.BANK_CHANGE_REJECTED,
      actorId: adminId,
      targetId: id,
      targetType: 'BankAccountChangeRequest',
      metadata: { action, rejectReason },
    });

    return changeRequest;
  }
}

export const adminService = new AdminService();
