// ── Auth Response DTOs ───────────────────────────────────────────────────────

import { UserRole, UserStatus } from '../../entities/User';

export interface UserPublicDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  phoneNumber: string | null;
  googleId: string | null;
  isEmailVerified: boolean;
  isKycVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseDto {
  user: UserPublicDto;
  accessToken: string;
  refreshToken: string;
}
