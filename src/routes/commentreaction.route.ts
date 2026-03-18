/**
 * @swagger
 * components:
 *   schemas:
 *     CommentReaction:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Reaction ID
 *         commentId:
 *           type: string
 *           description: Comment ID
 *         userId:
 *           type: string
 *           description: User ID
 *         type:
 *           type: string
 *           description: Reaction type (like, heart, etc.)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 */
import { Router } from 'express';
import { commentReactionController } from '../controllers/commentreaction.controller';
import { authenticate } from '../middlewares/auth.middleware';


/**
 * @swagger
 * tags:
 *   name: CommentReactions
 *   description: API for comment reactions (like, heart, etc.)
 */
const router = Router();

/**
 * @swagger
 * /commentreactions/react:
 *   post:
 *     summary: React to a comment
 *     tags: [CommentReactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commentId:
 *                 type: string
 *                 description: ID of the comment
 *               type:
 *                 type: string
 *                 description: Reaction type (like, heart, etc.)
 *     responses:
 *       200:
 *         description: Reaction added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reaction:
 *                   $ref: '#/components/schemas/CommentReaction'
 */
router.post('/react', authenticate, commentReactionController.react);
/**
 * @swagger
 * /commentreactions/{commentId}/reactions:
 *   get:
 *     summary: Get reactions for a comment
 *     tags: [CommentReactions]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the comment
 *     responses:
 *       200:
 *         description: List of reactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommentReaction'
 */
router.get('/:commentId/reactions', commentReactionController.getReactions);

export default router;
