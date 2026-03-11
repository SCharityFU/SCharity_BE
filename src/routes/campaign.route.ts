import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { donationController } from '../controllers/donation.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { parseMultipartBody, validate, validateQuery } from '../middlewares/validate.middleware';
import { uploadCampaignFiles, uploadMultiple } from '../middlewares/upload.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { uploadMultiple, uploadCampaignFiles, uploadEvidence } from '../middlewares/upload.middleware';
import {
  createCampaignRequestSchema,
  updateCampaignSchema,
  updateCampaignRequestSchema,
  campaignQuerySchema,
  createCampaignUpdateSchema,
  updateBankInfoSchema,
} from '../validators/campaign.validator';
import { createCommentSchema } from '../validators/donation.validator';
import { reportCampaignSchema } from '../validators/user.validator';
import { userController } from '../controllers/user.controller';

/**
 * @swagger
 * tags:
 *   name: Campaigns
 *   description: Campaign listing and management
 */
const router = Router();

// ── Static routes MUST come before dynamic /:id routes ─────────────────────

/**
 * @swagger
 * /campaigns/requests:
 *   post:
 *     summary: Submit a new campaign creation request
 *     description: Files (thumbnail, media, proof documents) uploaded as multipart/form-data.
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateCampaignRequest'
 *               - type: object
 *                 properties:
 *                   thumbnail:
 *                     type: string
 *                     format: binary
 *                     description: Campaign thumbnail image (max 1)
 *                   media:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Campaign media images (max 5)
 *                   proofDocuments:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Proof documents - images or PDFs (max 5)
 *     responses:
 *       201:
 *         description: Request submitted and pending admin review
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignRequest'
 *       401:
 *         description: Unauthorized
 *       422:
 *         description: Validation error
 */
router.post('/requests', authenticate, uploadCampaignFiles, parseMultipartBody, validate(createCampaignRequestSchema), campaignController.submitRequest);

/**
 * @swagger
 * /campaigns/requests/mine:
 *   get:
 *     summary: List own campaign creation requests
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Paginated list of own campaign requests
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CampaignRequest'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/requests/mine', authenticate, campaignController.getMyRequests);

/**
 * @swagger
 * /campaigns/requests/mine/{requestId}:
 *   get:
 *     summary: Get a single campaign request by ID (owner only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Campaign request ID
 *     responses:
 *       200:
 *         description: Campaign request detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignRequest'
 *       404:
 *         description: Campaign request not found
 */
router.get('/requests/mine/:requestId', authenticate, campaignController.getMyRequestById);

/**
 * @swagger
 * /campaigns/requests/{requestId}/bank-info:
 *   put:
 *     summary: Update bank information for a campaign request (owner only, pending status)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Campaign request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bankInfo]
 *             properties:
 *               bankInfo:
 *                 $ref: '#/components/schemas/BankInfo'
 *     responses:
 *       200:
 *         description: Bank information updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignRequest'
 *       403:
 *         description: Request is not in pending status
 *       404:
 *         description: Campaign request not found
 *       422:
 *         description: Validation error
 */
router.put('/requests/:requestId/bank-info', authenticate, validate(updateBankInfoSchema), campaignController.updateRequestBankInfo);

/**
 * @swagger
 * /campaigns/requests/{requestId}:
 *   put:
 *     summary: Update a campaign request (owner only, pending status)
 *     description: Allows updating title, story, goalAmount, deadline, category of a pending request. Supports multipart/form-data for file uploads.
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Campaign request ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 100
 *               story:
 *                 type: string
 *                 minLength: 50
 *               goalAmount:
 *                 type: number
 *                 minimum: 1000000
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               category:
 *                 type: string
 *                 enum: [education, medical, disaster, community, environment, other]
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Campaign thumbnail image (max 1)
 *               media:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Campaign media images (max 5)
 *               proofDocuments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Proof documents - images or PDFs (max 5)
 *     responses:
 *       200:
 *         description: Campaign request updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignRequest'
 *       403:
 *         description: Request is not in pending status
 *       404:
 *         description: Campaign request not found
 *       422:
 *         description: Validation error
 */
router.put('/requests/:requestId', authenticate, uploadCampaignFiles, parseMultipartBody, validate(updateCampaignRequestSchema), campaignController.updateCampaignRequest);

/**
 * @swagger
 * /campaigns/mine:
 *   get:
 *     summary: List campaigns owned by the current user
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Paginated list of own campaigns
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Campaign'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/mine', authenticate, campaignController.getMyCampaigns);

// ── Public routes (dynamic) ─────────────────────────────────────────────────

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: List all active campaigns (with search and filtering)
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Full-text search on campaign title
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [education, medical, disaster, community, environment, other]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, closed, suspended, completed, withdrawn]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, raisedAmount, deadline]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Paginated campaign list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Campaign'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get(
  '/',
  optionalAuthenticate,
  validateQuery(campaignQuerySchema),
  campaignController.listCampaigns,
);

/**
 * @swagger
 * /campaigns/{id}:
 *   get:
 *     summary: Get campaign details
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Campaign detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Campaign'
 *       404:
 *         description: Campaign not found
 */
router.get('/:id', optionalAuthenticate, campaignController.getCampaign);

/**
 * @swagger
 * /campaigns/{id}/updates:
 *   get:
 *     summary: List campaign progress updates
 *     tags: [Campaigns]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Paginated list of campaign updates
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CampaignUpdate'
 */
router.get('/:id/updates', campaignController.getCampaignUpdates);

/**
 * @swagger
 * /campaigns/{campaignId}/donations:
 *   get:
 *     summary: List donations for a campaign
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Paginated donation list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Donation'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/:campaignId/donations', donationController.getCampaignDonations);

/**
 * @swagger
 * /campaigns/{campaignId}/comments:
 *   get:
 *     summary: List comments for a campaign
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest_donation]
 *           default: newest
 *     responses:
 *       200:
 *         description: Paginated comment list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/:campaignId/comments', donationController.getComments);

// ── Authenticated routes (any logged-in user) ──────────────────────────────

/**
 * @swagger
 * /campaigns/{campaignId}/comments:
 *   post:
 *     summary: Post a comment on a campaign (requires prior donation to that campaign)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment created
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comment'
 *       403:
 *         description: You must donate to this campaign before commenting
 */
router.post(
  '/:campaignId/comments',
  authenticate,
  validate(createCommentSchema),
  donationController.createComment,
);

/**
 * @swagger
 * /campaigns/{campaignId}/comments/{commentId}:
 *   delete:
 *     summary: Delete own comment
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Not your comment
 *       404:
 *         description: Comment not found
 */
router.delete('/:campaignId/comments/:commentId', authenticate, donationController.deleteComment);

/**
 * @swagger
 * /campaigns/{campaignId}/report:
 *   post:
 *     summary: Report a suspicious campaign
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ReportCampaignRequest'
 *               - type: object
 *                 properties:
 *                   evidence:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Evidence images (max 5)
 *     responses:
 *       201:
 *         description: Report submitted
 *       409:
 *         description: You have already reported this campaign
 */
router.post(
  '/:campaignId/report',
  authenticate,
  uploadEvidence,
  validate(reportCampaignSchema),
  userController.reportCampaign,
);

// ── Campaign owner routes ───────────────────────────────────────────────────

/**
 * @swagger
 * /campaigns/{id}:
 *   put:
 *     summary: Update campaign story or thumbnail (owner only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCampaignRequest'
 *     responses:
 *       200:
 *         description: Campaign updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Campaign'
 *       403:
 *         description: Not the campaign owner
 */
router.put('/:id', authenticate, validate(updateCampaignSchema), campaignController.updateCampaign);

/**
 * @swagger
 * /campaigns/{id}/close:
 *   post:
 *     summary: Close a campaign (owner only — requires ≥50% funded or deadline reached)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Campaign closed
 *       400:
 *         description: Campaign does not meet closing conditions
 *       403:
 *         description: Not the campaign owner
 */
router.post('/:id/close', authenticate, campaignController.closeCampaign);

/**
 * @swagger
 * /campaigns/{id}/analytics:
 *   get:
 *     summary: Get donation analytics for a campaign (owner only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Campaign analytics data
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignAnalytics'
 *       403:
 *         description: Not the campaign owner
 */
router.get('/:id/analytics', authenticate, campaignController.getCampaignAnalytics);

/**
 * @swagger
 * /campaigns/{id}/updates:
 *   post:
 *     summary: Post a progress update for a campaign (owner only)
 *     tags: [Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CreateCampaignUpdateRequest'
 *               - type: object
 *                 properties:
 *                   files:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     description: Optional media attachments
 *     responses:
 *       201:
 *         description: Update posted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/CampaignUpdate'
 *       403:
 *         description: Not the campaign owner
 */
router.post(
  '/:id/updates',
  authenticate,
  uploadMultiple,
  validate(createCampaignUpdateSchema),
  campaignController.createCampaignUpdate,
);

export default router;
