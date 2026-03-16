import { Router } from 'express';
import { creatorController } from '../controllers/creator.controller';
import { authenticate } from '../middlewares/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Creator
 *   description: Campaign Creator specific endpoints
 */
const router = Router();

// All creator routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /creator/dashboard:
 *   get:
 *     summary: Get Creator dashboard statistics and recent activities
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
 *         name: timezone
 *         schema:
 *           type: string
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
 *                       type: object
 */
router.get('/dashboard', creatorController.getDashboard);

export default router;
