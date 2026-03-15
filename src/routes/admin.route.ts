import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { reviewCampaignRequestSchema, suspendCampaignSchema } from '../validators/campaign.validator';
import { processWithdrawRequestSchema } from '../validators/withdraw.validator';
import {
  adminCampaignAnalyticsQuerySchema,
  adminCampaignRequestsQuerySchema,
  adminCampaignTransactionsQuerySchema,
} from '../validators/admin.validator';

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
router.get('/campaign-requests', validateQuery(adminCampaignRequestsQuerySchema), adminController.listCampaignRequests);

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
 *     summary: UC 2.1.4 - View list of campaigns (admin)
 *     description: |
 *       Returns paginated campaign rows for the admin management table.
 *
 *       **UI-oriented fields included:**
 *       - Campaign name (`title`)
 *       - Organizer (`organizer.fullName`)
 *       - Project progress (`progressPercent`, `status`)
 *       - Funding progress (`raisedAmount`, `goalAmount`, `fundingProgress`)
 *       - Action payload for details (`viewDetails.campaignId`, `viewDetails.endpoint`)
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       organizer:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           fullName:
 *                             type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, active, closed, suspended, completed, withdrawn]
 *                       progressPercent:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 100
 *                       raisedAmount:
 *                         type: number
 *                       goalAmount:
 *                         type: number
 *                       fundingProgress:
 *                         type: string
 *                         example: '2000000 / 5000000'
 *                       viewDetails:
 *                         type: object
 *                         properties:
 *                           campaignId:
 *                             type: string
 *                             format: uuid
 *                           endpoint:
 *                             type: string
 *                             example: /api/v1/admin/campaigns/5b63d87e-36a4-42cc-beb1-58f4c314f2ab
 *                       deadline:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
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
 * /admin/campaigns/{id}/analytics:
 *   get:
 *     summary: UC 2.1.5 - View campaign analytics charts (admin)
 *     description: |
 *       Returns time-series chart data for one campaign.
 *
 *       Frontend can render two charts from the same payload:
 *       - Donation progress over time (`amount`)
 *       - Number of donors over time (`count`)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of past days included in chart aggregation
 *     responses:
 *       200:
 *         description: Campaign analytics chart payload
 *       404:
 *         description: Campaign not found
 */
router.get(
  '/campaigns/:id/analytics',
  validateQuery(adminCampaignAnalyticsQuerySchema),
  adminController.getCampaignAnalytics,
);

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
router.put('/campaigns/:id/suspend', validate(suspendCampaignSchema), adminController.suspendCampaign);

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
 *     summary: UC 2.1.6 – View donation list for a specific campaign (admin)
 *     description: |
 *       Returns a paginated, read-only list of **successful** donations for the
 *       given campaign.
 *
 *       **Business rules enforced:**
 *       - `donorDisplayName` is replaced with *"Nhà hảo tâm ẩn danh"* for
 *         anonymous donations (immutable audit-trail; real identity stays in DB).
 *       - `bankAccount` is masked – only the first 3 digits are shown and the
 *         rest are replaced with `*` (e.g. `"123*******"`).
 *       - No write operations are exposed; the response is a read-only projection.
 *       - Only donations with `status = success` are included.
 *
 *       **Filter:** `search` matches against the donor's real full name (case-
 *       insensitive). Anonymous donations are still searchable by admin.
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
 *         description: Filter by donor name (case-insensitive partial match)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, amount]
 *           default: createdAt
 *         description: Column to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Optional lower bound for donation timestamp filter (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Optional upper bound for donation timestamp filter (inclusive)
 *     responses:
 *       200:
 *         description: Paginated campaign donation list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       donorDisplayName:
 *                         type: string
 *                         description: >
 *                           Real donor full name, or "Nhà hảo tâm ẩn danh"
 *                           when isAnonymous is true.
 *                         example: Nguyễn Văn A
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Transaction timestamp
 *                       message:
 *                         type: string
 *                         nullable: true
 *                         description: Optional message from the donor
 *                       amount:
 *                         type: number
 *                         description: Donation amount in VND
 *                         example: 500000
 *                       bankName:
 *                         type: string
 *                         nullable: true
 *                         description: Bank name used for the transfer
 *                         example: Vietcombank
 *                       bankAccount:
 *                         type: string
 *                         nullable: true
 *                         description: >
 *                           Masked bank account – only first 3 digits visible,
 *                           remainder replaced with '*'.
 *                         example: 123*******
 *                       status:
 *                         type: string
 *                         enum: [pending, success, failed, refunded]
 *                         example: success
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – caller is not an admin
 *       404:
 *         description: Campaign not found
 */
router.get(
  '/campaigns/:id/transactions',
  validateQuery(adminCampaignTransactionsQuerySchema),
  adminController.getCampaignTransactions,
);

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
 * /admin/withdrawals/{id}/process:
 *   put:
 *     summary: Process withdrawal request (approve/reject)
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
 *         description: Withdrawal request processed successfully
 */
router.put(
  '/withdrawals/:id/process',
  validate(processWithdrawRequestSchema),
  adminController.processWithdrawRequest,
);

/**
 * @swagger
 * /admin/bank-change-requests:
 *   get:
 *     summary: List all pending bank account change requests
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Paginated list of recent pending bank change requests
 */
router.get('/bank-change-requests', adminController.listBankChangeRequests);

/**
 * @swagger
 * /admin/bank-change-requests/{id}/process:
 *   put:
 *     summary: Process bank account change request (approve/reject)
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
 *         description: Bank change request processed successfully
 */
router.put(
  '/bank-change-requests/:id/process',
  validate(processWithdrawRequestSchema), // reuse the schema since it's just action+rejectReason
  adminController.processBankChangeRequest,
);

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
 *     summary: UC 2.1.8 – View all donations across the platform (admin)
 *     description: |
 *       Returns a paginated, read-only list of **all** donations platform-wide,
 *       applying the same masking rules as the per-campaign donation view.
 *
 *       **Business rules enforced:**
 *       - `donorDisplayName` is replaced with *"Nhà hảo tâm ẩn danh"* for
 *         anonymous donations.
 *       - `bankAccount` is masked – only the first 3 digits are shown and the
 *         rest are replaced with `*` (e.g. `"123*******"`).
 *       - No write operations are exposed; the response is a read-only projection.
 *
 *       **Filter:** `search` matches against the donor's real full name
 *       (case-insensitive partial match).
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
 *         description: Filter by donor name (case-insensitive partial match)
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort direction (by createdAt)
 *     responses:
 *       200:
 *         description: Paginated donation list with masked sensitive fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       donorDisplayName:
 *                         type: string
 *                         description: >
 *                           Real donor full name, or "Nhà hảo tâm ẩn danh"
 *                           when isAnonymous is true.
 *                         example: Trần Thị B
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Transaction timestamp
 *                       message:
 *                         type: string
 *                         nullable: true
 *                         description: Optional message from the donor
 *                       amount:
 *                         type: number
 *                         description: Donation amount in VND
 *                         example: 200000
 *                       bankName:
 *                         type: string
 *                         nullable: true
 *                         description: Bank name used for the transfer
 *                         example: Techcombank
 *                       bankAccount:
 *                         type: string
 *                         nullable: true
 *                         description: >
 *                           Masked bank account – only first 3 digits visible,
 *                           remainder replaced with '*'.
 *                         example: 098*******
 *                       status:
 *                         type: string
 *                         enum: [pending, success, failed, refunded]
 *                         example: success
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized – missing or invalid token
 *       403:
 *         description: Forbidden – caller is not an admin
 */
router.get('/transactions', adminController.listAllTransactions);

export default router;
