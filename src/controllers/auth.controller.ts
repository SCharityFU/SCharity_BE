import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { UserRepository } from '../repositories/user.repository';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendCreated(res, result, 'Registration successful. Please check your email to verify your account.');
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.googleLoginWithToken(req.body.idToken);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(req.user!.id);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, 'If the email exists, a password reset link has been sent');
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.verifyEmail(req.query.token as string);
      sendSuccess(res, null, 'Email verified successfully');
    } catch (err) {
      next(err);
    }
  },

  async googleCallback(req: Request, res: Response) {
    const tokens = req.user as unknown as { accessToken: string; refreshToken: string };
    res.redirect(
      `${process.env.CLIENT_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserRepository.findOne({ where: { id: req.user!.id } });
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
      sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  },
};
