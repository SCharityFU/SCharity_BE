import { Router } from 'express';
import { donationController } from '../controllers/donation.controller';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.middleware';
import { donationRateLimiter } from '../middlewares/rateLimiter.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createDonationSchema } from '../validators/donation.validator';

/**
 * @swagger
 * tags:
 *   name: Donations
 *   description: Donation management
 */
const router = Router();

/**
 * @swagger
 * /donations:
 *   post:
 *     summary: Make a donation to a campaign
 *     description: Available to both guests (anonymous) and authenticated users.
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDonationRequest'
 *     responses:
 *       201:
 *         description: Donation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Campaign is closed or suspended
 *       422:
 *         description: Validation error
 */
router.post('/', optionalAuthenticate, donationRateLimiter, validate(createDonationSchema), donationController.donate);

/**
 * @swagger
 * /donations/payment/callback:
 *   get:
 *     summary: Verify PayOS payment after redirect
 *     tags: [Donations]
 *     parameters:
 *       - in: query
 *         name: orderCode
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment verified
 *       400:
 *         description: Payment not completed
 */
router.get('/payment/callback', donationController.paymentCallback);

/**
 * @swagger
 * /donations/me/history:
 *   get:
 *     summary: Get own donation history
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, success, failed, refunded]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated donation history
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
 *       401:
 *         description: Unauthorized
 */
router.get('/me/history', authenticate, donationController.getMyDonations);

/**
 * @swagger
 * /donations/{id}:
 *   get:
 *     summary: Get a donation by ID
 *     tags: [Donations]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Donation detail
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Donation'
 *       404:
 *         description: Donation not found
 */
router.get('/:id', optionalAuthenticate, donationController.getDonation);

export default router;
