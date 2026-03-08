import { Router } from 'express';
import { withdrawController } from '../controllers/withdraw.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createWithdrawRequestSchema } from '../validators/withdraw.validator';

/**
 * @swagger
 * tags:
 *   name: Withdrawals
 *   description: Campaign withdrawal requests
 */
const router = Router();

// All withdraw routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /withdrawals:
 *   post:
 *     summary: Submit a withdrawal request for a closed campaign
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWithdrawRequest'
 *     responses:
 *       201:
 *         description: Withdrawal request submitted
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/WithdrawRequest'
 *       400:
 *         description: Campaign does not meet withdrawal conditions (< 50% funded)
 *       409:
 *         description: Pending request already exists for this campaign
 */
router.post('/', validate(createWithdrawRequestSchema), withdrawController.createRequest);

/**
 * @swagger
 * /withdrawals/mine:
 *   get:
 *     summary: List own withdrawal requests
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *     responses:
 *       200:
 *         description: Paginated list of own withdrawal requests
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
router.get('/mine', withdrawController.getMyRequests);

/**
 * @swagger
 * /withdrawals/{id}:
 *   get:
 *     summary: Get a withdrawal request by ID
 *     tags: [Withdrawals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Withdrawal request detail
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
router.get('/:id', withdrawController.getRequestById);

export default router;
