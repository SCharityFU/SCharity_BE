import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { CommentReaction } from '../entities/CommentReaction';
import { BadRequestError } from '../utils/errors';

export const commentReactionController = {
    // Thả cảm xúc vào comment
    async react(req: Request, res: Response, next: NextFunction) {
        try {
            const { commentId, type } = req.body;
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
            if (!commentId || !type) throw new BadRequestError('Missing commentId or type');
            // Xóa reaction cũ nếu có
            const repo = AppDataSource.getRepository(CommentReaction);
            await repo.delete({ commentId, userId });
            const reaction = repo.create({ commentId, userId, type });
            await repo.save(reaction);
            res.json({ success: true, reaction });
        } catch (err) {
            next(err);
        }
    },

    // Lấy danh sách reaction của comment
    async getReactions(req: Request, res: Response, next: NextFunction) {
        try {
            const { commentId } = req.params;
            const repo = AppDataSource.getRepository(CommentReaction);
            const reactions = await repo.find({ where: { commentId } });
            res.json({ success: true, reactions });
        } catch (err) {
            next(err);
        }
    },
};
