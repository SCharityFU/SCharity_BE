import { Request, Response, NextFunction } from 'express';
import { campaignService } from '../services/campaign.service';
import { storageService } from '../services/storage.service';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/response';
import { getPaginationParams } from '../utils/pagination';
import { BadRequestError } from '../utils/errors';
import { validateSubmitRequestFiles } from '../utils/file-upload-validation';

const getPages = (query: Record<string, unknown>) => getPaginationParams(query.page as string, query.limit as string);

export const campaignController = {
  // Public: list campaigns
  async listCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const query = { ...req.query, page, limit } as Parameters<typeof campaignService.listCampaigns>[0];
      const { campaigns, total } = await campaignService.listCampaigns(query);
      sendPaginated(res, campaigns, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  // Public: get campaign detail
  async getCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.getCampaignById(req.params.id);
      sendSuccess(res, campaign);
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: upload inline image for rich text editor
  async uploadEditorImage(req: Request, res: Response, next: NextFunction) {
    try {
      const imageFile = req.file;

      if (!imageFile) {
        throw new BadRequestError('Image file is required');
      }

      const extension = imageFile.mimetype.split('/')[1] ?? 'jpg';
      const imageUrl = await storageService.uploadFile(
        imageFile.buffer,
        `campaigns/editor/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`,
        imageFile.mimetype,
      );

      sendSuccess(res, { url: imageUrl }, 'Editor image uploaded successfully');
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: submit create request
  async submitRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const thumbnailFile = (req.files as Record<string, Express.Multer.File[]>)?.thumbnail?.[0];
      const mediaFiles = (req.files as Record<string, Express.Multer.File[]>)?.media ?? [];
      const proofFiles = (req.files as Record<string, Express.Multer.File[]>)?.proofDocuments ?? [];

      validateSubmitRequestFiles(thumbnailFile, mediaFiles, proofFiles);

      let thumbnailUrl: string | undefined;
      const mediaUrls: string[] = [];
      const proofDocuments: string[] = [];

      if (thumbnailFile) {
        thumbnailUrl = await storageService.uploadFile(
          thumbnailFile.buffer,
          `campaigns/requests/${Date.now()}-thumbnail.${thumbnailFile.mimetype.split('/')[1]}`,
          thumbnailFile.mimetype,
        );
      }

      for (let i = 0; i < mediaFiles.length; i++) {
        const url = await storageService.uploadFile(
          mediaFiles[i].buffer,
          `campaigns/requests/${Date.now()}-media-${i}.${mediaFiles[i].mimetype.split('/')[1]}`,
          mediaFiles[i].mimetype,
        );
        mediaUrls.push(url);
      }

      for (const doc of proofFiles) {
        const url = await storageService.uploadFile(
          doc.buffer,
          `campaigns/requests/${Date.now()}-doc.${doc.originalname.split('.').pop()}`,
          doc.mimetype,
        );
        proofDocuments.push(url);
      }
      const request = await campaignService.createRequest(
        { ...req.body, thumbnailUrl, mediaUrls, proofDocuments },
        req.user!.id,
      );
      sendCreated(res, request, 'Campaign request submitted successfully');
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: get my campaign creation requests
  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const status = req.query.status as string | undefined;
      const [data, total] = await campaignService.getMyRequests(req.user!.id, page, limit, status);
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: get a single campaign request by ID (own)
  async getMyRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await campaignService.getMyRequestById(req.params.requestId, req.user!.id);
      sendSuccess(res, request);
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: update bank info for a campaign request
  async updateRequestBankInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await campaignService.updateRequestBankInfo(req.params.requestId, req.user!.id, req.body);
      sendSuccess(res, request, 'Bank information updated successfully');
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: update campaign request (pending only)
  async updateCampaignRequest(req: Request, res: Response, next: NextFunction) {
    try {
      // Handle file uploads similarly to submitRequest
      const thumbnailFile = (req.files as Record<string, Express.Multer.File[]>)?.thumbnail?.[0];
      const mediaFiles = (req.files as Record<string, Express.Multer.File[]>)?.media ?? [];
      const proofFiles = (req.files as Record<string, Express.Multer.File[]>)?.proofDocuments ?? [];

      let thumbnailUrl: string | undefined;
      const mediaUrls: string[] = [];
      const proofDocuments: string[] = [];

      if (thumbnailFile) {
        thumbnailUrl = await storageService.uploadFile(
          thumbnailFile.buffer,
          `campaigns/requests/${Date.now()}-thumbnail.${thumbnailFile.mimetype.split('/')[1]}`,
          thumbnailFile.mimetype,
        );
      }

      for (let i = 0; i < mediaFiles.length; i++) {
        const url = await storageService.uploadFile(
          mediaFiles[i].buffer,
          `campaigns/requests/${Date.now()}-media-${i}.${mediaFiles[i].mimetype.split('/')[1]}`,
          mediaFiles[i].mimetype,
        );
        mediaUrls.push(url);
      }

      for (const doc of proofFiles) {
        const url = await storageService.uploadFile(
          doc.buffer,
          `campaigns/requests/${Date.now()}-doc.${doc.originalname.split('.').pop()}`,
          doc.mimetype,
        );
        proofDocuments.push(url);
      }

      const request = await campaignService.updateCampaignRequest(req.params.requestId, req.user!.id, {
        ...req.body,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        ...(mediaUrls.length > 0 ? { mediaUrls } : {}),
        ...(proofDocuments.length > 0 ? { proofDocuments } : {}),
      });
      sendSuccess(res, request, 'Campaign request updated successfully');
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: get my campaigns
  async getMyCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const [campaigns, total] = await campaignService.getMyCampaigns(req.user!.id, page, limit);
      sendPaginated(res, campaigns, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: update campaign (only pending)
  async updateCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const thumbnailFile = req.file;

      let thumbnailUrl: string | undefined;

      if (thumbnailFile) {
        thumbnailUrl = await storageService.uploadFile(
          thumbnailFile.buffer,
          `campaigns/${Date.now()}-thumbnail.${thumbnailFile.mimetype.split('/')[1]}`,
          thumbnailFile.mimetype,
        );
      }
      const campaign = await campaignService.updateCampaign(req.params.id, req.user!.id, {
        ...req.body,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      });
      sendSuccess(res, campaign, 'Campaign updated');
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: close campaign
  async closeCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const campaign = await campaignService.closeCampaign(req.params.id, req.user!.id);
      sendSuccess(res, campaign, 'Campaign closed');
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: get campaign analytics
  async getCampaignAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = Number(req.query.days) || 30;
      const data = await campaignService.getCampaignAnalytics(req.params.id, req.user!.id, days);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: get chart analytics with daily donor breakdown
  async getCreatorCampaignAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const days = Number(req.query.days) || 30;
      const data = await campaignService.getCreatorCampaignAnalytics(req.params.id, req.user!.id, days);
      sendSuccess(res, data, 'Campaign analytics fetched successfully');
    } catch (err) {
      next(err);
    }
  },

  // Public: get campaign updates
  async getCampaignUpdates(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = getPages(req.query);
      const status = req.query.status as string | undefined; // 'all', 'draft', 'published'
      const [data, total] = await campaignService.getCampaignUpdates(
        req.params.id,
        page,
        limit,
        status,
      );
      sendPaginated(res, data, { total, page, limit });
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: create update post
  async createCampaignUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const mediaUrls: string[] = [];

      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const url = await storageService.uploadUpdateMedia(files[i].buffer, req.params.id, i, files[i].mimetype);
          mediaUrls.push(url);
        }
      }

      const update = await campaignService.createCampaignUpdate(
        req.params.id,
        req.user!.id,
        req.body,
        mediaUrls.length ? mediaUrls : undefined,
      );
      sendCreated(res, update, 'Campaign update posted');
    } catch (err) {
      next(err);
    }
  },

  // CampaignCreator: update draft campaign update
  async updateCampaignUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      let mediaUrls: string[] | undefined = undefined;

      if (files && files.length > 0) {
        mediaUrls = [];
        for (let i = 0; i < files.length; i++) {
          const url = await storageService.uploadUpdateMedia(
            files[i].buffer,
            req.params.id,
            i,
            files[i].mimetype,
          );
          mediaUrls.push(url);
        }
      }

      const update = await campaignService.updateCampaignUpdate(
        req.params.id,
        req.params.updateId,
        req.user!.id,
        req.body,
        mediaUrls,
      );
      sendSuccess(res, update, 'Campaign update updated');
    } catch (err) {
      next(err);
    }
  },
};
