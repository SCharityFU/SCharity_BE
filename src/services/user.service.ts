import { UserRepository, BankAccountRepository } from '../repositories/user.repository';
import { NotFoundError, ConflictError } from '../utils/errors';
import { UpdateUserProfileDto } from '../validators/user.validator';
import { AddBankAccountDto } from '../validators/user.validator';
import { storageService } from './storage.service';

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
}

export const userService = new UserService();
