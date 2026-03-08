import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { UserRole } from '../entities/User';

export const requireRoles =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };

export const requireAdmin = requireRoles(UserRole.ADMIN);
export const requireCampaignCreator = requireRoles(UserRole.USER, UserRole.ADMIN);
export const requireDonor = requireRoles(UserRole.USER, UserRole.ADMIN);
