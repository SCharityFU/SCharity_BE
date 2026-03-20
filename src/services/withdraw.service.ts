import { WithdrawRepository } from '../repositories/withdraw.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { UserRepository } from '../repositories/user.repository';
import { CampaignStatus } from '../entities/Campaign';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../utils/errors';
import { CreateWithdrawRequestDto } from '../validators/withdraw.validator';
import { emailQueue } from '../queues/email.queue';
import { WithdrawStatus } from '../entities/WithdrawRequest';
import { UserRole } from '../entities/User';

export class WithdrawService {
  async createRequest(dto: CreateWithdrawRequestDto, creatorId: string) {
    const creator = await UserRepository.findOne({ where: { id: creatorId } });
    if (!creator) throw new NotFoundError('User not found');

    if (!creator.isKycVerified) {
      throw new ForbiddenError('KYC verification is required to request a withdrawal');
    }

    const campaign = await CampaignRepository.findOne({
      where: { id: dto.campaignId, creatorId },
      relations: ['creator', 'withdrawRequests'],
    });
    if (!campaign) throw new NotFoundError('Không tìm thấy chiến dịch hoặc bạn không phải là người tạo chiến dịch này');

    /**
     * Check if campaign is eligible for withdrawal:
     * 1. Campaign must be in ACTIVE or COMPLETED status (cannot withdraw from suspended campaign)
     * 2. There must be no pending withdraw request for this campaign
     * 3. Campaign must have raised at least 50% of the goal amount to be eligible for withdrawal
     * 4. User must have remaining withdrawal request (3 requests per campaign)
     */

    if (![CampaignStatus.ACTIVE, CampaignStatus.COMPLETED].includes(campaign.status)) {
      throw new BadRequestError('Chỉ có thể yêu cầu rút tiền từ chiến dịch đang hoạt động hoặc đã hoàn thành');
    }

    const existingPending = campaign.withdrawRequests.some((wr) => wr.status === WithdrawStatus.PENDING);
    const successfulWithdraws = campaign.withdrawRequests.filter((wr) => wr.status === WithdrawStatus.COMPLETED).length;
    if (existingPending) {
      throw new ConflictError('Đang có một yêu cầu rút tiền đang chờ xử lý cho chiến dịch này, vui lòng đợi admin xử lý trước khi tạo yêu cầu mới');
    }

    if (successfulWithdraws >= 3) {
      throw new BadRequestError('Đã đạt giới hạn tối đa 3 yêu cầu rút tiền cho chiến dịch đã hoàn thành này');
    }

    if (campaign.status === CampaignStatus.WITHDRAWN) {
      throw new BadRequestError('Chiến dịch này đã hết lượt rút tiền. Vui lòng liên hệ admin');
    }

    const raisedAmount = Number(campaign.raisedAmount ?? 0);
    const withdrawnAmount = Number(campaign.withdrawnAmount ?? 0);
    const maxWithdrawable = raisedAmount - withdrawnAmount;

    const goalAmount = Number(campaign.goalAmount ?? 0);

    if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
      throw new BadRequestError('Campaign goal amount is invalid');
    }

    const progress = raisedAmount / goalAmount;

    if (progress < 0.5) {
      throw new BadRequestError('Chiến dịch phải đạt ít nhất 50% mục tiêu để có thể rút tiền');
    }

    // NOTE: FRONT END IS NOT ALLOWED TO SPECIFY THE AMOUNT TO WITHDRAW, IT MUST BE CALCULATED BASED ON THE RAISED
    // AMOUNT - PREVIOUSLY WITHDRAWN AMOUNT. THIS IS TO PREVENT MANIPULATION FROM FRONT END

    if (maxWithdrawable <= 0) {
      throw new BadRequestError('Không còn số tiền nào để rút từ chiến dịch này');
    }

    const bankInfo = campaign.bankInfo;
    const hasValidBankInfo = Boolean(
      bankInfo
      && typeof bankInfo.bankName === 'string'
      && bankInfo.bankName.trim().length > 0
      && typeof bankInfo.accountNumber === 'string'
      && bankInfo.accountNumber.trim().length > 0
      && typeof bankInfo.accountHolderName === 'string'
      && bankInfo.accountHolderName.trim().length > 0,
    );

    if (!hasValidBankInfo) {
      throw new BadRequestError('bankInfo is missing or invalid for this campaign');
    }

    const request = WithdrawRepository.create({
      campaignId: dto.campaignId,
      requesterId: creatorId,
      amount: maxWithdrawable,
      bankInfo: {
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        accountHolderName: bankInfo.accountHolderName,
      },
      status: WithdrawStatus.PENDING,
    });

    await WithdrawRepository.save(request);

    // Notify admins
    emailQueue.add('sendWithdrawRequestNotification', {
      creatorName: creator.fullName,
      campaignTitle: campaign.title,
      amount: maxWithdrawable,
    }).catch(err => {
      console.error('Failed to enqueue email job', err);
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

  async getRequestsByCampaignId(campaignId: string, requesterId: string, requesterRole: string) {
    const campaign = await CampaignRepository.findOne({
      where: { id: campaignId },
      select: ['id', 'creatorId'],
    });

    if (!campaign) {
      throw new NotFoundError('Campaign not found');
    }

    if (requesterRole !== UserRole.ADMIN && campaign.creatorId !== requesterId) {
      throw new ForbiddenError('You do not have permission to view withdrawal requests for this campaign');
    }

    return WithdrawRepository.findAllByCampaignId(campaignId);
  }
}

export const withdrawService = new WithdrawService();
