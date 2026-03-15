import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { UserRepository } from '../repositories/user.repository';
import { User, UserRole } from '../entities/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors';
import { RegisterDto, LoginDto } from '../validators/auth.validator';
import { emailService } from './email.service';
import redisClient from '../config/redis';

const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
const SALT_ROUNDS = 12;

export class AuthService {
  async register(dto: RegisterDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    const existingUser = await UserRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email này đã được đăng ký');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const verificationToken = uuidv4();

    const user = UserRepository.create({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      role: UserRole.USER,
      emailVerificationToken: verificationToken,
    });

    await UserRepository.save(user);

    // Send verification email directly instead of queueing to avoid Redis timeout errors
    try {
      await emailService.sendVerificationEmail(user.email, user.fullName, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Registration successful even if email fails, user can request resend
    }

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    const user = await UserRepository.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    if (!user.password) {
      throw new UnauthorizedError('Tài khoản này đã được đăng ký bằng Google. Vui lòng đăng nhập lại bằng Google');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    if (!user.isEmailVerified) {
      // Resend verification email
      const verificationToken = uuidv4();
      user.emailVerificationToken = verificationToken;
      await UserRepository.save(user);

      try {
        await emailService.sendVerificationEmail(user.email, user.fullName, verificationToken);
      } catch (error) {
        console.error('Failed to resend verification email:', error);
      }

      throw new UnauthorizedError(
        'Tài khoản chưa được xác thực. Chúng tôi đã gửi lại email xác thực, vui lòng kiểm tra hộp thư của bạn.',
      );
    }

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(token);
    const storedToken = await redisClient.get(`refresh_token:${payload.sub}`);

    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedError('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    }

    const user = await UserRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedError('Không tìm thấy người dùng');
    }

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await redisClient.del(`refresh_token:${userId}`);
  }

  async googleLogin(profile: {
    id: string;
    emails: Array<{ value: string }>;
    displayName: string;
    photos: Array<{ value: string }>;
  }): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    let user = await UserRepository.findByGoogleId(profile.id);

    if (!user) {
      const email = profile.emails[0]?.value;
      user = await UserRepository.findByEmail(email);

      if (user) {
        user.googleId = profile.id;
        user.isEmailVerified = true;
      } else {
        user = UserRepository.create({
          email,
          fullName: profile.displayName,
          googleId: profile.id,
          avatarUrl: profile.photos[0]?.value,
          isEmailVerified: true,
          role: UserRole.USER,
        });
      }
      await UserRepository.save(user);
    }

    const tokens = this.generateTokens(user);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async googleLoginWithToken(
    accessToken: string,
  ): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    try {
      const { OAuth2Client } = require('google-auth-library');
      const oAuth2Client = new OAuth2Client();
      oAuth2Client.setCredentials({ access_token: accessToken });

      const oauth2 = require('@googleapis/oauth2').oauth2({
        auth: oAuth2Client,
        version: 'v2',
      });

      const { data } = await oauth2.userinfo.get();

      if (!data) throw new UnauthorizedError('Token Google không hợp lệ');

      const profile = {
        id: data.id || '',
        emails: data.email ? [{ value: data.email }] : [],
        displayName: data.name || 'Google User',
        photos: data.picture ? [{ value: data.picture }] : [],
      };

      return this.googleLogin(profile);
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw new UnauthorizedError('Xác thực token Google thất bại');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) return; // Don't reveal if email exists

    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = expires;
    await UserRepository.save(user);

    try {
      await emailService.sendPasswordResetEmail(user.email, user.fullName, resetToken);
    } catch (error) {
      console.error('Failed to send reset password email:', error);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await UserRepository.findOne({
      where: { passwordResetToken: token },
      select: ['id', 'passwordResetToken', 'passwordResetExpires'],
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new BadRequestError('Mã khôi phục không hợp lệ hoặc đã hết hạn');
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.passwordResetToken = null as unknown as string;
    user.passwordResetExpires = null as unknown as Date;
    await UserRepository.save(user);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await UserRepository.findOne({ where: { emailVerificationToken: token } });
    if (!user) {
      throw new NotFoundError('Mã xác thực không hợp lệ');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null as unknown as string;
    await UserRepository.save(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) throw new NotFoundError('Không tìm thấy người dùng');
    if (!user.password) {
      throw new BadRequestError('Không thể đổi mật khẩu cho tài khoản đăng nhập qua mạng xã hội');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new UnauthorizedError('Mật khẩu hiện tại không đúng');

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await UserRepository.save(user);
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    await redisClient.setex(`refresh_token:${userId}`, REFRESH_TOKEN_TTL, token);
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, passwordResetToken, emailVerificationToken, ...sanitized } = user as Partial<
      User & {
        password: string;
        passwordResetToken: string;
        emailVerificationToken: string;
      }
    >;
    void password;
    void passwordResetToken;
    void emailVerificationToken;
    return sanitized;
  }
}

export const authService = new AuthService();
