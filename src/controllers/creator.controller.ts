import { Request, Response, NextFunction } from 'express';
import { creatorService } from '../services/creator.service';

class CreatorController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const campaignLimit = parseInt(req.query.campaignLimit as string) || 3;
      const donationLimit = parseInt(req.query.donationLimit as string) || 5;

      const dashboardData = await creatorService.getDashboard(userId, {
        campaignLimit,
        donationLimit,
      });

      res.status(200).json({
        success: true,
        message: 'Creator dashboard retrieved successfully',
        data: dashboardData,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const creatorController = new CreatorController();
