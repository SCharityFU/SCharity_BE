import cron from 'node-cron';
import { LessThanOrEqual } from 'typeorm';
import { Campaign, CampaignStatus } from '../entities/Campaign';
import { AppDataSource } from '../config/database';
import { AuditAction, AuditLog } from '../entities/AuditLog';

const SCHEDULE = process.env.CAMPAIGN_STATUS_CRON || '5 0 * * *';
const TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Ho_Chi_Minh';

let isRunning = false;

export const runCampaignStatusMaintenance = async (): Promise<void> => {
  if (isRunning) {
    console.log('[Cron][CampaignStatus] Skip run because previous execution is still in progress');
    return;
  }

  isRunning = true;

  try {
    const now = new Date();
    const campaignRepo = AppDataSource.getRepository(Campaign);

    const expiredCampaigns = await campaignRepo.find({
      where: {
        status: CampaignStatus.ACTIVE,
        deadline: LessThanOrEqual(now),
      },
      select: ['id', 'creatorId', 'status', 'deadline'],
    });

    if (expiredCampaigns.length === 0) {
      console.log('[Cron][CampaignStatus] No expired active campaigns to complete');
      return;
    }

    await AppDataSource.transaction(async (txManager) => {
      const txCampaignRepo = txManager.getRepository(Campaign);
      const txAuditRepo = txManager.getRepository(AuditLog);

      for (const campaign of expiredCampaigns) {
        const previousStatus = campaign.status;
        campaign.status = CampaignStatus.COMPLETED;
        await txCampaignRepo.save(campaign);

        await txAuditRepo.save({
          action: AuditAction.CAMPAIGN_AUTO_COMPLETED,
          actorId: campaign.creatorId,
          targetId: campaign.id,
          targetType: 'Campaign',
          metadata: {
            reason: 'deadline_reached',
            previousStatus,
            newStatus: CampaignStatus.COMPLETED,
            deadline: campaign.deadline,
            autoUpdated: true,
          },
        });
      }
    });

    console.log(`[Cron][CampaignStatus] Completed ${expiredCampaigns.length} campaign(s) by deadline`);
  } catch (error) {
    console.error('[Cron][CampaignStatus] Failed to process campaign status maintenance:', error);
  } finally {
    isRunning = false;
  }
};

export const initCampaignStatusCron = (): void => {
  // Run once on startup so expired campaigns are synced immediately.
  void runCampaignStatusMaintenance();

  cron.schedule(
    SCHEDULE,
    () => {
      void runCampaignStatusMaintenance();
    },
    { timezone: TIMEZONE },
  );

  console.log(`[Cron][CampaignStatus] Scheduled with '${SCHEDULE}' (${TIMEZONE})`);
};
