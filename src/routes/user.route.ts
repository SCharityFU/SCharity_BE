import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadImage } from '../middlewares/upload.middleware';
import { updateUserProfileSchema, addBankAccountSchema, verifyKycSchema } from '../validators/user.validator';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and account management
 */
const router = Router();

/**
 * @swagger
 * /users/active-count:
 *   get:
 *     summary: Get active user count
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Number of active users
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: number
 */
router.get('/active-count', userController.getActiveUserCount);

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get own profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     summary: Update own profile (avatar upload via multipart/form-data)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (JPEG/PNG, max 5 MB)
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: Unauthorized
 */
router.put('/me', uploadImage, validate(updateUserProfileSchema), userController.updateProfile);

/**
 * @swagger
 * /users/me/bank-accounts:
 *   get:
 *     summary: List own bank accounts
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bank accounts
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
 *                         $ref: '#/components/schemas/BankAccount'
 */
router.get('/me/bank-accounts', userController.getBankAccounts);

/**
 * @swagger
 * /users/me/bank-accounts:
 *   post:
 *     summary: Add a bank account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddBankAccountRequest'
 *     responses:
 *       201:
 *         description: Bank account added
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/BankAccount'
 */
router.post('/me/bank-accounts', validate(addBankAccountSchema), userController.addBankAccount);

/**
 * @swagger
 * /users/me/bank-accounts/{id}:
 *   delete:
 *     summary: Delete a bank account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Bank account deleted
 *       404:
 *         description: Not found
 */
router.delete('/me/bank-accounts/:id', userController.deleteBankAccount);

/**
 * @swagger
 * /users/me/bank-accounts/{id}/default:
 *   put:
 *     summary: Set a bank account as default
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Default bank account updated
 *       404:
 *         description: Not found
 */
router.put('/me/bank-accounts/:id/default', userController.setDefaultBankAccount);

/**
 * @swagger
 * /users/me/kyc:
 *   post:
 *     summary: Verify User Identity (eKYC) with VNPT API
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - frontImageBase64
 *               - backImageBase64
 *               - selfieImageBase64
 *             properties:
 *               frontImageBase64:
 *                 type: string
 *                 description: Base64 of front ID card
 *               backImageBase64:
 *                 type: string
 *                 description: Base64 of back ID card
 *               selfieImageBase64:
 *                 type: string
 *                 description: Base64 of selfie photo
 *     responses:
 *       200:
 *         description: KYC successful
 *       400:
 *         description: KYC failed / face match too low
 *       409:
 *         description: User already verified
 */
router.post('/me/kyc', validate(verifyKycSchema), userController.verifyKyc);

export default router;
