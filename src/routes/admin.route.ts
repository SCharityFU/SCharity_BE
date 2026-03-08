import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  reviewCampaignRequestSchema,
  suspendCampaignSchema,
} from '../validators/campaign.validator';
import { processWithdrawRequestSchema } from '../validators/withdraw.validator';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints (requires admin role)
 */
const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get platform dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DashboardStats'
 */
router.get('/dashboard', adminController.getDashboardStats);

/**
 * @swagger
 * /admin/dashboard/chart:
 *   get:
 *     summary: Get donation chart data over time
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Chart data array
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
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           count:
 *                             type: integer
 */
router.get('/dashboard/chart', adminController.getDonationChartData);

/**
 * @swagger
 * /admin/campaign-requests:
 *   get:
 *     summary: List campaign creation requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Paginated campaign requests
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
router.get('/campaign-requests', adminController.listCampaignRequests);

/**
 * @swagger
 * /admin/campaign-requests/{id}:
 *   get:
 *     summary: Get a campaign request by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
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
 *         description: Not found
 */
router.get('/campaign-requests/:id', adminController.getCampaignRequestById);

/**
 * @swagger
 * /admin/campaign-requests/{id}/review:
 *   post:
 *     summary: Approve or reject a campaign creation request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewCampaignRequestBody'
 *     responses:
 *       200:
 *         description: Request reviewed; campaign created if approved
 *       400:
 *         description: rejectReason required when rejecting
 *       409:
 *         description: Request already processed
 */
router.post(
  '/campaign-requests/:id/review',
  validate(reviewCampaignRequestSchema),
  adminController.reviewCampaignRequest,
);

/**
 * @swagger
 * /admin/campaigns:
 *   get:
 *     summary: List all campaigns (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, closed, suspended, completed, withdrawn]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
router.get('/campaigns', adminController.listCampaigns);

/**
 * @swagger
 * /admin/campaigns/{id}:
 *   get:
 *     summary: Get full campaign details (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *         description: Not found
 */
router.get('/campaigns/:id', adminController.getCampaignDetails);

/**
 * @swagger
 * /admin/campaigns/{id}/suspend:
 *   put:
 *     summary: Suspend a campaign
 *     description: Freezes all donations and cancels pending withdrawal requests.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuspendCampaignRequest'
 *     responses:
 *       200:
 *         description: Campaign suspended; owner notified via email
 *       409:
 *         description: Campaign already suspended
 */
router.put(
  '/campaigns/:id/suspend',
  validate(suspendCampaignSchema),
  adminController.suspendCampaign,
);

/**
 * @swagger
 * /admin/campaigns/{id}/unsuspend:
 *   put:
 *     summary: Lift the suspension of a campaign
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Campaign reinstated to active
 *       400:
 *         description: Campaign is not suspended
 */
router.put('/campaigns/:id/unsuspend', adminController.unsuspendCampaign);

/**
 * @swagger
 * /admin/campaigns/{id}/transactions:
 *   get:
 *     summary: List transactions for a specific campaign (admin view)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by donor name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, amount]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Paginated transaction list
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
router.get('/campaigns/:id/transactions', adminController.getCampaignTransactions);

/**
 * @swagger
 * /admin/withdraw-requests:
 *   get:
 *     summary: List all withdrawal requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, completed]
 *     responses:
 *       200:
 *         description: Paginated withdrawal request list
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
 *                         $ref: '#/components/schemas/WithdrawRequest'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/withdraw-requests', adminController.listWithdrawRequests);

/**
 * @swagger
 * /admin/withdraw-requests/{id}:
 *   get:
 *     summary: Get a withdrawal request by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Withdrawal request detail with campaign info
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WithdrawRequest'
 *       404:
 *         description: Not found
 */
router.get('/withdraw-requests/:id', adminController.getWithdrawRequestById);

/**
 * @swagger
 * /admin/withdraw-requests/{id}/process:
 *   post:
 *     summary: Approve or reject a withdrawal request
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessWithdrawRequest'
 *     responses:
 *       200:
 *         description: Request processed; owner notified via email
 *       400:
 *         description: rejectReason required when rejecting
 *       409:
 *         description: Request already processed
 */
router.post(
  '/withdraw-requests/:id/process',
  validate(processWithdrawRequestSchema),
  adminController.processWithdrawRequest,
);

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     summary: List all campaign reports
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *     responses:
 *       200:
 *         description: Paginated report list
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
 *                         $ref: '#/components/schemas/Report'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/reports', adminController.listReports);

/**
 * @swagger
 * /admin/reports/{id}/resolve:
 *   put:
 *     summary: Mark a report as resolved
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Report resolved
 *       404:
 *         description: Report not found
 */
router.put('/reports/:id/resolve', adminController.resolveReport);

/**
 * @swagger
 * /admin/transactions:
 *   get:
 *     summary: List all transactions across the platform
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by donor name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Paginated transaction list
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
router.get('/transactions', adminController.listAllTransactions);

export default router;
