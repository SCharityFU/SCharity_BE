import { WithdrawRepository } from '../repositories/withdraw.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { BankAccountRepository } from '../repositories/user.repository';
import { UserRepository } from '../repositories/user.repository';
import { CampaignStatus } from '../entities/Campaign';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors';
import { CreateWithdrawRequestDto } from '../validators/withdraw.validator';
import { emailQueue } from '../queues/email.queue';

export class WithdrawService {
  async createRequest(dto: CreateWithdrawRequestDto, creatorId: string) {
    const creator = await UserRepository.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundError('User not found');

    if (!creator.isKycVerified) {
      throw new ForbiddenError('KYC verification is required to request a withdrawal');
    }

    const campaign = await CampaignRepository.findOne({
      where: { id: dto.campaignId, creatorId },
    });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (campaign.status !== CampaignStatus.CLOSED) {
      throw new BadRequestError('Withdrawals can only be requested for closed campaigns');
    }

    const existingPending = await WithdrawRepository.findByCampaignId(dto.campaignId);
    if (existingPending.length > 0) {
      throw new ConflictError('A pending withdrawal request already exists for this campaign');
    }

    const totalPaid = await WithdrawRepository.getTotalPaidAmount(dto.campaignId);
    const maxWithdrawable = campaign.raisedAmount - totalPaid;

    if (dto.amount > maxWithdrawable) {
      throw new BadRequestError(
        `Requested amount exceeds available balance. Maximum withdrawable: ${maxWithdrawable}`,
      );
    }

    // Get bank account info
    const bankAccount = dto.bankAccountId
      ? await BankAccountRepository.findOne({ where: { id: dto.bankAccountId, userId: creatorId } })
      : await BankAccountRepository.findDefaultByUserId(creatorId);

    if (!bankAccount) throw new NotFoundError('Bank account not found');

    const request = WithdrawRepository.create({
      campaignId: dto.campaignId,
      requesterId: creatorId,
      amount: dto.amount,
      bankInfo: {
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolderName: bankAccount.accountHolderName,
      },
    });

    await WithdrawRepository.save(request);

    // Notify admins
    await emailQueue.add('sendWithdrawRequestNotification', {
      creatorName: creator.fullName,
      campaignTitle: campaign.title,
      amount: dto.amount,
    });

    return request;
  }

  async getMyRequests(creatorId: string, page: number, limit: number) {
    return WithdrawRepository.findWithPagination(page, limit, { creatorId });
  }

  async getRequestById(id: string, creatorId: string) {
    const request = await WithdrawRepository.findOne({
      where: { id, requesterId: creatorId },
      relations: ['campaign'],
    });
    if (!request) throw new NotFoundError('Withdraw request not found');
    return request;
  }
}

export const withdrawService = new WithdrawService();
