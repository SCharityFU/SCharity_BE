import { Request, Response, NextFunction } from 'express';
import { withdrawService } from '../services/withdraw.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

const getPages = (query: Record<string, unknown>) => getPaginationParams(query.page as string, query.limit as string);

export const withdrawController = {
  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await withdrawService.createRequest(req.body, req.user!.id);
      sendCreated(res, request, 'Withdrawal request submitted');
    } catch (err) {
      next(err);
    }
  },

  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const [data, total] = await withdrawService.getMyRequests(req.user!.id, page, limit);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  async getRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await withdrawService.getRequestById(req.params.id, req.user!.id);
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  },

  async getRequestsByCampaignId(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await withdrawService.getRequestsByCampaignId(
        req.params.campaignId,
        req.user!.id,
        req.user!.role,
      );
      sendSuccess(res, data, 'Withdrawal requests fetched');
    } catch (err) {
      next(err);
    }
  },
};
