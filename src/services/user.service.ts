import { UserRepository, BankAccountRepository } from '../repositories/user.repository';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { UpdateUserProfileDto } from '../validators/user.validator';
import { AddBankAccountDto, VerifyKycDto } from '../validators/user.validator';
import { storageService } from './storage.service';
import { performKyc } from './vnptEkyc.service';

export class UserService {
  async getActiveUserCount() {
    return UserRepository.countActiveUsers();
  }

  async getProfile(userId: string) {
    const user = await UserRepository.findByIdWithRelations(userId);
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto, avatarFile?: Express.Multer.File) {
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    if (avatarFile) {
      const avatarUrl = await storageService.uploadFile(
        avatarFile.buffer,
        `avatars/${userId}-${Date.now()}.${avatarFile.mimetype.split('/')[1]}`,
        avatarFile.mimetype,
      );

      // Delete old avatar if exists
      if (user.avatarUrl) {
        const oldKey = user.avatarUrl.split('/').slice(-2).join('/');
        await storageService.deleteFile(oldKey).catch(() => null);
      }

      await UserRepository.update(userId, { ...dto, avatarUrl });
    } else {
      await UserRepository.update(userId, dto);
    }

    return UserRepository.findOne({ where: { id: userId } });
  }

  async addBankAccount(userId: string, dto: AddBankAccountDto) {
    // If user is setting this as default, unset other defaults
    if (dto.isDefault) {
      await BankAccountRepository.update({ userId }, { isDefault: false });
    }

    const existing = await BankAccountRepository.findOne({
      where: { accountNumber: dto.accountNumber, userId },
    });
    if (existing) throw new ConflictError('This bank account is already added');

    const account = BankAccountRepository.create({ ...dto, userId });
    await BankAccountRepository.save(account);
    return account;
  }

  async getBankAccounts(userId: string) {
    return BankAccountRepository.findByUserId(userId);
  }

  async deleteBankAccount(accountId: string, userId: string) {
    const account = await BankAccountRepository.findOne({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundError('Bank account not found');
    await BankAccountRepository.delete(accountId);
  }

  async setDefaultBankAccount(accountId: string, userId: string) {
    const account = await BankAccountRepository.findOne({
      where: { id: accountId, userId },
    });
    if (!account) throw new NotFoundError('Bank account not found');

    await BankAccountRepository.update({ userId }, { isDefault: false });
    await BankAccountRepository.update(accountId, { isDefault: true });

    return BankAccountRepository.findOne({ where: { id: accountId } });
  }

  async verifyKyc(userId: string, dto: VerifyKycDto) {
    const user = await UserRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    if (user.isKycVerified) throw new ConflictError('User is already KYC verified');

    // Call VNPT eKYC
    const kycResult = await performKyc(dto);

    if (!kycResult.success) {
      throw new BadRequestError(kycResult.message);
    }

    const FACE_MATCH_THRESHOLD = 85.0;
    if (!kycResult.faceMatchScore || kycResult.faceMatchScore < FACE_MATCH_THRESHOLD) {
      throw new BadRequestError(
        `Face match score ${kycResult.faceMatchScore}% is below threshold ${FACE_MATCH_THRESHOLD}%`,
      );
    }

    // Process name without diacritics
    const removeDiacritics = (input: string): string => {
      return input
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const kycFullName = kycResult.fullName ? removeDiacritics(kycResult.fullName) : '';

    // Face embedding from Python service would go here in the future
    // Currently using dummy for saving logic
    const dummyEmbedding = JSON.stringify(new Array(512).fill(0.5));

    await UserRepository.update(userId, {
      isKycVerified: true,
      kycFullName,
      kycIdNumber: kycResult.idNumber,
      faceEmbedding: dummyEmbedding,
    });

    return {
      success: true,
      message: `KYC successful. Face match: ${kycResult.faceMatchScore}%`,
      fullName: kycResult.fullName,
      idNumber: kycResult.idNumber,
      faceMatchScore: kycResult.faceMatchScore,
    };
  }
}

export const userService = new UserService();
