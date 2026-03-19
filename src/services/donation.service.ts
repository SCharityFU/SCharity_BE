import { DonationRepository, CommentRepository } from '../repositories/donation.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { DonationStatus, PaymentMethod } from '../entities/Donation';
import { CampaignStatus } from '../entities/Campaign';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { CreateDonationDto, CreateCommentDto } from '../validators/donation.validator';
import { emailQueue } from '../queues/email.queue';
import { payos } from '../utils/payos';
import { toCampaignDonationAdminDto } from '../utils/dto-mapper';

export class DonationService {
  /**
   * Create a PENDING donation, then generate a PayOS payment link.
   * Returns { donation, checkoutUrl } so the frontend can redirect the user.
   */
  async createDonation(dto: CreateDonationDto, donorId?: string) {
    const campaign = await CampaignRepository.findOne({
      where: { id: dto.campaignId },
      relations: ['creator'],
    });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestError('This campaign is not currently accepting donations');
    }

    // let donor = null;
    // if (donorId) {
    //   donor = await UserRepository.findOne({ where: { id: donorId } });
    // }

    // PayOS requires orderCode as a positive integer < 9007199254740991
    const orderCode = Number(String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 100)).padStart(2, '0'));

    const donation = DonationRepository.create({
      campaignId: dto.campaignId,
      donorId: donorId ?? undefined,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      message: dto.message,
      isAnonymous: dto.isAnonymous ?? false,
      status: DonationStatus.PENDING,
      transactionRef: String(orderCode),
    });

    await DonationRepository.save(donation);

    // PayOS description: max 25 chars, only a-zA-Z0-9 and space
    const description = `Donation ${orderCode}`.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25);

    const clientUrl = process.env.CLIENT_URL;

    try {
      const paymentLink = await payos.paymentRequests.create({
        orderCode,
        amount: dto.amount,
        description,
        returnUrl: `${clientUrl}/donations/callback?orderCode=${orderCode}`,
        cancelUrl: `${clientUrl}/donations/callback?orderCode=${orderCode}&cancel=true`,
      });

      return {
        donation,
        checkoutUrl: paymentLink.checkoutUrl,
        orderCode,
      };
    } catch (error: unknown) {
      // Mark donation FAILED if PayOS rejects it
      donation.status = DonationStatus.FAILED;
      await DonationRepository.save(donation);
      const errorMessage = error instanceof Error ? error.message : 'Unknown PayOS error';
      throw new BadRequestError(`PayOS Error: ${errorMessage}`);
    }
  }

  /**
   * Called after the user returns from PayOS.
   * Verifies the payment status with PayOS, then marks the donation SUCCESS
   * and performs post-payment side effects (update campaign, create comment, emails).
   */
  async handlePaymentCallback(orderCode: number) {
    // 1. Verify status with PayOS
    const paymentLink = await payos.paymentRequests.get(orderCode);

    // 2. Find the PENDING donation
    const donation = await DonationRepository.findOne({
      where: { transactionRef: String(orderCode) },
      relations: ['campaign', 'campaign.creator', 'donor'],
    });
    if (!donation) throw new NotFoundError('Donation not found for this order code');

    // Idempotent: already processed
    if (donation.status === DonationStatus.SUCCESS) {
      return { donation, alreadyProcessed: true };
    }

    if (paymentLink.status !== 'PAID') {
      // If cancelled or failed, update donation status
      if (paymentLink.status === 'CANCELLED' || paymentLink.status === 'EXPIRED') {
        donation.status = DonationStatus.FAILED;
        await DonationRepository.save(donation);
      }
      throw new BadRequestError(`Payment not completed. Status: ${paymentLink.status}`);
    }

    // 3. Mark donation SUCCESS
    donation.status = DonationStatus.SUCCESS;
    await DonationRepository.save(donation);

    // 4. Update campaign raised amount and donor count
    await CampaignRepository.updateRaisedAmount(donation.campaignId, donation.amount);

    // 5. Auto-create a Comment linked to this donation
    if (donation.message) {
      const comment = CommentRepository.create({
        campaignId: donation.campaignId,
        donorId: donation.donorId ?? undefined,
        content: donation.message,
        isAnonymous: donation.isAnonymous,
        donationId: donation.id,
      });
      await CommentRepository.save(comment);
    }

    // 6. Xóa cache campaign detail để FE luôn lấy dữ liệu mới nhất
    const campaignCacheKey = `campaign:v2:${donation.campaignId}`;
    await import('../config/redis').then(({ redisClient }) => redisClient.del(campaignCacheKey));

    // 6. Email notifications
    const campaign = donation.campaign;
    const donor = donation.donor;
    const donorName = donation.isAnonymous ? 'Anonymous' : (donor?.fullName ?? 'Donor');

    if (donor?.email) {
      await emailQueue.add('sendDonationReceiptEmail', {
        email: donor.email,
        donorName: donor.fullName ?? 'Donor',
        campaignTitle: campaign.title,
        amount: donation.amount,
        donationId: donation.id,
      });
    }

    await emailQueue.add('sendNewDonationNotification', {
      email: campaign.creator.email,
      creatorName: campaign.creator.fullName,
      campaignTitle: campaign.title,
      amount: donation.amount,
      donorName,
    });

    return { donation, alreadyProcessed: false };
  }

  async getDonationHistory(
    donorId: string,
    page: number,
    limit: number,
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return DonationRepository.findByDonorId(donorId, page, limit, {
      status: filters?.status as DonationStatus | undefined,
      startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
    });
  }

  async getDonationById(id: string, requesterId?: string) {
    const donation = await DonationRepository.findOne({
      where: { id },
      relations: ['campaign', 'donor'],
    });
    if (!donation) throw new NotFoundError('Donation not found');

    if (requesterId && donation.donorId && donation.donorId !== requesterId) {
      throw new ForbiddenError('Access denied');
    }

    return donation;
  }

  async createComment(campaignId: string, dto: CreateCommentDto, donorId?: string) {
    const campaign = await CampaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    // Require donation to comment, if authenticated
    if (donorId) {
      const hasDonated = await CommentRepository.hasUserDonatedToCampaign(donorId, campaignId);
      if (!hasDonated) {
        throw new ForbiddenError('You must donate to this campaign before leaving a comment');
      }
    }

    const comment = CommentRepository.create({
      campaignId,
      donorId: donorId ?? undefined,
      content: dto.content,
      emoji: dto.emoji,
      isAnonymous: dto.isAnonymous ?? false,
    });

    await CommentRepository.save(comment);
    return comment;
  }

  async getComments(campaignId: string, page: number, limit: number) {
    const campaign = await CampaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    return CommentRepository.findByCampaignId(campaignId, page, limit);
  }

  async deleteComment(commentId: string, requesterId: string) {
    const comment = await CommentRepository.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.donorId !== requesterId) throw new ForbiddenError('Access denied');

    await CommentRepository.delete(commentId);
  }

  async getCampaignDonations(
    campaignId: string,
    page: number,
    limit: number,
    requesterId: string,
    search?: string,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ) {
    const campaign = await CampaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundError('Campaign not found');

    if (campaign.creatorId !== requesterId) {
      throw new ForbiddenError('You are not the creator of this campaign');
    }

    const [donations, total] = await DonationRepository.findByCampaignId(
      campaignId,
      page,
      limit,
      search,
      sortBy,
      sortOrder,
    );

    // Keep creator analytics donor list safe by masking personal/payment fields.
    const safeDonations = donations.map((donation) => {
      const donationDto = toCampaignDonationAdminDto(donation);
      return {
        id: donationDto.id,
        amount: donationDto.amount,
        status: donationDto.status,
        paymentMethod: null,
        transactionRef: null,
        message: donationDto.message,
        isAnonymous: donation.isAnonymous,
        donorDisplayName: donationDto.donorDisplayName,
        bankName: null,
        bankAccount: null,
        campaignId,
        campaign: undefined,
        donorId: donation.isAnonymous ? null : donation.donorId,
        donor: undefined,
        paymentMetadata: null,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
      };
    });

    return [safeDonations, total] as const;
  }
}

export const donationService = new DonationService();
