import { Request, Response, NextFunction } from 'express';
import { creatorService } from '../services/creator.service';
import { sendSuccess } from '../utils/response';

export const creatorController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await creatorService.getDashboard(req.user!.id, req.query as never);
      sendSuccess(res, data, 'Creator dashboard fetched successfully');
    } catch (err) {
      next(err);
    }
  },
};
