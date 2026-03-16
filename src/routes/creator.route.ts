import { Router } from 'express';
import { creatorController } from '../controllers/creator.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateQuery } from '../middlewares/validate.middleware';
import { creatorDashboardQuerySchema } from '../validators/creator.validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /creator/dashboard:
 *   get:
 *     summary: Get creator dashboard aggregate payload
 *     tags: [Creator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: campaignLimit
 *         schema:
 *           type: integer
 *           default: 3
 *       - in: query
 *         name: donationLimit
 *         schema:
 *           type: integer
 *           default: 5
 *       - in: query
 *         name: campaignCursor
 *         schema:
 *           type: string
 *         description: Base64url cursor from previous response `myCampaignsPreviewPagination.nextCursor`
 *       - in: query
 *         name: donationCursor
 *         schema:
 *           type: string
 *         description: Base64url cursor from previous response `recentDonationsPagination.nextCursor`
 *       - in: query
 *         name: timezone
 *         schema:
 *           type: string
 *           default: Asia/Ho_Chi_Minh
 *     responses:
 *       200:
 *         description: Creator dashboard payload
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', validateQuery(creatorDashboardQuerySchema), creatorController.getDashboard);

export default router;
