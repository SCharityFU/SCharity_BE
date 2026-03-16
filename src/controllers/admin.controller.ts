import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { CampaignRequestStatus } from '../entities/CampaignRequest';
import { WithdrawStatus } from '../entities/WithdrawRequest';
import { ReportStatus } from '../entities/Report';
import { CampaignStatus } from '../entities/Campaign';

const getPages = (query: Record<string, unknown>) => getPaginationParams(query.page as string, query.limit as string);

export const adminController = {
  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  },

  async getDonationChartData(req: Request, res: Response, next: NextFunction) {
    try {
      const days = Number(req.query.days) || 30;
      const interval = (req.query.interval as 'day' | 'week' | 'month') || 'day';
      const data = await adminService.getDonationChartData(interval, days);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async listCampaignRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const status = (req.query.status as CampaignRequestStatus | undefined) ?? CampaignRequestStatus.PENDING;
      const [data, total] = await adminService.listCampaignRequests(page, limit, status);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  async getCampaignRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await adminService.getCampaignRequestById(req.params.id);
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  },

  async reviewCampaignRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, rejectReason } = req.body as {
        action: 'approve' | 'reject';
        rejectReason?: string;
      };
      const result = await adminService.reviewCampaignRequest(req.params.id, req.user!.id, action, rejectReason);
      sendSuccess(res, result, 'Campaign request reviewed');
    } catch (err) {
      next(err);
    }
  },

  async listCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const { category, search } = req.query as Record<string, string>;
      const status = req.query.status as CampaignStatus | undefined;
      const [data, total] = await adminService.listCampaigns(page, limit, {
        status,
        category,
        search,
      });
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  async getCampaignDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await adminService.getCampaignDetails(req.params.id);
      sendSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },

  async getCampaignAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = Number(req.query.days) || 30;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const data = await adminService.getCampaignAnalytics(req.params.id, days, startDate, endDate);
      sendSuccess(res, data, 'Campaign analytics fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  async suspendCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await adminService.suspendCampaign(req.params.id, req.user!.id, req.body.reason);
      sendSuccess(res, campaign, 'Campaign suspended');
    } catch (err) {
      next(err);
    }
  },

  async unsuspendCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await adminService.unsuspendCampaign(req.params.id, req.user!.id);
      sendSuccess(res, campaign, 'Campaign unsuspended');
    } catch (err) {
      next(err);
    }
  },

  async listWithdrawRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const status = req.query.status as WithdrawStatus | undefined;
      const [data, total] = await adminService.listWithdrawRequests(page, limit, status);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  async getWithdrawRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await adminService.getWithdrawRequestById(req.params.id);
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  },

  async processWithdrawRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, rejectReason } = req.body;
      const result = await adminService.processWithdrawRequest(
        req.params.id,
        req.user!.id,
        action,
        rejectReason,
      );
      sendSuccess(res, result, `Withdraw request ${action}ed successfully`);
    } catch (err) {
      next(err);
    }
  },

  async listBankChangeRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const [data, total] = await adminService.listBankChangeRequests(page, limit);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  async processBankChangeRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, rejectReason } = req.body;
      const result = await adminService.processBankChangeRequest(
        req.params.id,
        req.user!.id,
        action,
        rejectReason,
      );
      sendSuccess(res, result, `Bank change request ${action}ed successfully`);
    } catch (err) {
      next(err);
    }
  },

  async listReports(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const status = req.query.status as ReportStatus | undefined;
      const [data, total] = await adminService.listReports(page, limit, status);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await adminService.resolveReport(req.params.id, req.user!.id);
      sendSuccess(res, report, 'Report resolved');
    } catch (err) {
      next(err);
    }
  },

  async listAllTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const search = req.query.search as string | undefined;
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';
      const [data, total] = await adminService.listAllTransactions(page, limit, search, sortOrder);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  async getCampaignTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const search = req.query.search as string | undefined;
      const sortBy = (req.query.sortBy as 'createdAt' | 'amount') || 'createdAt';
      const sortOrder = (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const [data, total] = await adminService.getCampaignTransactions(
        req.params.id,
        page,
        limit,
        search,
        sortBy,
        sortOrder,
        startDate,
        endDate,
      );
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },
};
