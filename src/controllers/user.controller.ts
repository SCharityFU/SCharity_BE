import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { campaignService } from '../services/campaign.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export const userController = {
  async getActiveUserCount(_req: Request, res: Response, next: NextFunction) {
    try {
      const count = await userService.getActiveUserCount();
      sendSuccess(res, count, 'Active user count fetched');
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getProfile(req.user!.id);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const avatarFile = req.file;
      const user = await userService.updateProfile(req.user!.id, req.body, avatarFile);
      sendSuccess(res, user, 'Profile updated');
    } catch (err) {
      next(err);
    }
  },

  async getBankAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await userService.getBankAccounts(req.user!.id);
      sendSuccess(res, accounts);
    } catch (err) {
      next(err);
    }
  },

  async addBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await userService.addBankAccount(req.user!.id, req.body);
      sendCreated(res, account, 'Bank account added');
    } catch (err) {
      next(err);
    }
  },

  async deleteBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      await userService.deleteBankAccount(req.params.id, req.user!.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },

  async setDefaultBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await userService.setDefaultBankAccount(req.params.id, req.user!.id);
      sendSuccess(res, account, 'Default bank account updated');
    } catch (err) {
      next(err);
    }
  },

  async reportCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const { reason, description, evidenceUrls } = req.body;
      const report = await campaignService.reportCampaign(
        campaignId,
        req.user!.id,
        reason,
        description,
        evidenceUrls,
      );
      sendCreated(res, report, 'Campaign reported successfully');
    } catch (err) {
      next(err);
    }
  },

  async verifyKyc(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.verifyKyc(req.user!.id, req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
