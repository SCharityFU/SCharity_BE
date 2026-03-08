import { z } from 'zod';
import { PaymentMethod } from '../entities/Donation';

export const createDonationSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(10000, 'Minimum donation is 10,000 VND'),
  message: z.string().max(500, 'Message cannot exceed 500 characters').optional(),
  isAnonymous: z.boolean().optional().default(false),
  paymentMethod: z.nativeEnum(PaymentMethod).optional().default(PaymentMethod.VNPAY),
});

export const donationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v || '1')),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(50, parseInt(v || '10'))),
  campaignId: z.string().uuid().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount']).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export const createCommentSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(500, 'Comment cannot exceed 500 characters'),
  emoji: z.string().optional(),
  isAnonymous: z.boolean().optional().default(false),
  donationId: z.string().uuid().optional(),
});

export type CreateDonationDto = z.infer<typeof createDonationSchema>;
export type DonationQueryDto = z.infer<typeof donationQuerySchema>;
export type CreateCommentDto = z.infer<typeof createCommentSchema>;
