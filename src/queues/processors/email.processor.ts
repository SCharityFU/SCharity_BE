import { Worker, Job } from 'bullmq';
import { emailService } from '../../services/email.service';

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null as null,
};

const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    const { name, data } = job;

    switch (name) {
      case 'sendVerificationEmail':
        await emailService.sendVerificationEmail(data.email, data.name, data.token);
        break;

      case 'sendPasswordResetEmail':
        await emailService.sendPasswordResetEmail(data.email, data.name, data.token);
        break;

      case 'sendDonationReceiptEmail':
        await emailService.sendDonationReceipt(
          data.email,
          data.donorName,
          data.campaignTitle,
          data.amount,
          data.donationId,
        );
        break;

      case 'sendNewDonationNotification':
        await emailService.sendNewDonationNotification(
          data.email,
          data.creatorName,
          data.campaignTitle,
          data.amount,
          data.donorName,
        );
        break;

      case 'sendCampaignApprovedEmail':
        await emailService.sendCampaignApprovedEmail(
          data.email,
          data.creatorName,
          data.campaignTitle,
        );
        break;

      case 'sendCampaignRejectedEmail':
        await emailService.sendCampaignRejectedEmail(
          data.email,
          data.creatorName,
          data.campaignTitle,
          data.reason,
        );
        break;

      case 'sendCampaignSuspendedEmail':
        await emailService.sendCampaignSuspendedEmail(
          data.email,
          data.creatorName,
          data.campaignTitle,
          data.reason,
        );
        break;

      case 'sendCampaignUnsuspendedEmail':
        await emailService.sendCampaignUnsuspendedEmail(
          data.email,
          data.creatorName,
          data.campaignTitle,
          data.restoredStatus,
        );
        break;

      case 'sendWithdrawApprovedEmail':
        await emailService.sendWithdrawApprovedEmail(
          data.email,
          data.creatorName,
          data.campaignTitle,
          data.amount,
        );
        break;

      case 'sendWithdrawRejectedEmail':
        await emailService.sendWithdrawRejectedEmail(
          data.email,
          data.creatorName,
          data.campaignTitle,
          data.reason,
        );
        break;

      case 'sendCampaignUpdateNotification':
        await emailService.sendCampaignUpdateNotification(
          data.emails,
          data.campaignTitle,
          data.updateTitle,
          data.campaignId,
        );
        break;

      default:
        console.warn(`[EmailWorker] Unknown job type: ${name}`);
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} (${job.name}) completed`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} (${job?.name}) failed:`, err.message);
});

export default emailWorker;
