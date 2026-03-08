import { Request, Response, NextFunction } from 'express';
import { donationService } from '../services/donation.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';

const getPages = (query: Record<string, unknown>) =>
  getPaginationParams(query.page as string, query.limit as string);

export const donationController = {
  // Authenticated or guest donate
  async donate(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = req.user?.id;
      const donation = await donationService.createDonation(req.body, donorId);
      sendCreated(res, donation, 'Donation created successfully');
    } catch (err) {
      next(err);
    }
  },

  // Authenticated user: get own donation history
  async getMyDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const { status, startDate, endDate } = req.query as Record<string, string>;
      const [data, total] = await donationService.getDonationHistory(req.user!.id, page, limit, {
        status,
        startDate,
        endDate,
      });
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  // Get single donation
  async getDonation(req: Request, res: Response, next: NextFunction) {
    try {
      const donation = await donationService.getDonationById(req.params.id, req.user?.id);
      sendSuccess(res, donation);
    } catch (err) {
      next(err);
    }
  },

  // Public: get campaign donations
  async getCampaignDonations(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const { search, sortBy, sortOrder } = req.query as Record<string, string>;
      const [data, total] = await donationService.getCampaignDonations(
        req.params.campaignId,
        page,
        limit,
        search,
        sortBy,
        sortOrder as 'ASC' | 'DESC',
      );
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  // Authenticated: create comment (must have donated)
  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      const donorId = req.user?.id;
      const comment = await donationService.createComment(req.params.campaignId, req.body, donorId);
      sendCreated(res, comment, 'Comment posted');
    } catch (err) {
      next(err);
    }
  },

  // Public: get campaign comments
  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const [data, total] = await donationService.getComments(req.params.campaignId, page, limit);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  // Authenticated: delete own comment
  async deleteComment(req: Request, res: Response, next: NextFunction) {
    try {
      await donationService.deleteComment(req.params.commentId, req.user!.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
};
