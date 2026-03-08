import { DonationRepository, CommentRepository } from '../repositories/donation.repository';
import { CampaignRepository } from '../repositories/campaign.repository';
import { DonationStatus, PaymentMethod } from '../entities/Donation';
import { CampaignStatus } from '../entities/Campaign';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { CreateDonationDto, CreateCommentDto } from '../validators/donation.validator';
import { emailQueue } from '../queues/email.queue';
import { UserRepository } from '../repositories/user.repository';

export class DonationService {
  async createDonation(dto: CreateDonationDto, donorId?: string) {
    const campaign = await CampaignRepository.findOne({
      where: { id: dto.campaignId },
      relations: ['creator'],
    });
    if (!campaign) throw new NotFoundError('Campaign not found');
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestError('This campaign is not currently accepting donations');
    }

    let donor = null;
    if (donorId) {
      donor = await UserRepository.findOne({ where: { id: donorId } });
    }

    const donation = DonationRepository.create({
      campaignId: dto.campaignId,
      donorId: donorId ?? undefined,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod as PaymentMethod,
      message: dto.message,
      isAnonymous: dto.isAnonymous ?? false,
      status: DonationStatus.PENDING,
    });

    await DonationRepository.save(donation);

    // Update raised amount and donor count
    await CampaignRepository.updateRaisedAmount(dto.campaignId, dto.amount);

    // Update donation status to success (simulated - replace with real payment gateway)
    donation.status = DonationStatus.SUCCESS;
    await DonationRepository.save(donation);

    // Send confirmation email if donor has email
    const email = donor?.email;
    if (email) {
      await emailQueue.add('sendDonationReceiptEmail', {
        email,
        donorName: donor?.fullName ?? 'Donor',
        campaignTitle: campaign.title,
        amount: dto.amount,
        donationId: donation.id,
      });
    }

    // Notify campaign creator
    await emailQueue.add('sendNewDonationNotification', {
      email: campaign.creator.email,
      creatorName: campaign.creator.fullName,
      campaignTitle: campaign.title,
      amount: dto.amount,
      donorName: dto.isAnonymous ? 'Anonymous' : (donor?.fullName ?? dto.message ?? 'Anonymous'),
    });

    return donation;
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
    search?: string,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ) {
    const campaign = await CampaignRepository.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundError('Campaign not found');
    return DonationRepository.findByCampaignId(campaignId, page, limit, search, sortBy, sortOrder);
  }
}

export const donationService = new DonationService();
