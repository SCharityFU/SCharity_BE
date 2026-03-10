import { z } from 'zod';
import { CampaignCategory } from '../entities/Campaign';
import { UpdateCategory } from '../entities/CampaignUpdate';

export const createCampaignRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title is too long'),
  story: z.string().min(50, 'Story must be at least 50 characters'),
  goalAmount: z
    .union([z.number(), z.string().transform((v) => Number(v))])
    .pipe(
      z.number().positive('Goal amount must be positive').min(1000000, 'Minimum goal amount is 1,000,000 VND'),
    ),
  deadline: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), {
      message: 'Deadline must be in the future',
    }),
  category: z.nativeEnum(CampaignCategory).optional().default(CampaignCategory.OTHER),
  bankInfo: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    },
    z.object({
      bankName: z.string().min(1, 'Bank name is required'),
      accountNumber: z
        .string()
        .min(1, 'Account number is required')
        .regex(/^\d+$/, 'Account number must contain only digits'),
      accountHolderName: z
        .string()
        .min(1, 'Account holder name is required')
        .regex(/^[A-Za-z\s]+$/, 'Account holder name must not contain diacritics or special characters')
        .toUpperCase(),
    }),
  ),
});

export const updateBankInfoSchema = z.object({
  bankInfo: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    },
    z.object({
      bankName: z.string().min(1, 'Bank name is required'),
      accountNumber: z
        .string()
        .min(1, 'Account number is required')
        .regex(/^\d+$/, 'Account number must contain only digits'),
      accountHolderName: z
        .string()
        .min(1, 'Account holder name is required')
        .regex(/^[A-Za-z\s]+$/, 'Account holder name must not contain diacritics or special characters')
        .toUpperCase(),
    }),
  ),
});

export const reviewCampaignRequestSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    rejectReason: z.string().min(10, 'Reject reason must be at least 10 characters').optional(),
  })
  .refine(
    (data) => data.action !== 'reject' || (data.rejectReason && data.rejectReason.length > 0),
    { message: 'Reject reason is required when rejecting', path: ['rejectReason'] },
  );

export const updateCampaignSchema = z.object({
  story: z.string().min(50).optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const suspendCampaignSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const closeCampaignSchema = z.object({
  confirm: z
    .boolean()
    .refine((v) => v === true, { message: 'Please confirm closing the campaign' }),
});

export const campaignQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => parseInt(v || '1')),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(50, parseInt(v || '10'))),
  status: z.string().optional(),
  category: z.nativeEnum(CampaignCategory).optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(['createdAt', 'raisedAmount', 'deadline', 'goalAmount'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export const createCampaignUpdateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.nativeEnum(UpdateCategory).optional().default(UpdateCategory.PROGRESS),
  isDraft: z.string().optional().default('false'),
});

export type CreateCampaignRequestDto = z.infer<typeof createCampaignRequestSchema>;
export type ReviewCampaignRequestDto = z.infer<typeof reviewCampaignRequestSchema>;
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;
export type SuspendCampaignDto = z.infer<typeof suspendCampaignSchema>;
export type CampaignQueryDto = z.infer<typeof campaignQuerySchema>;
export type CreateCampaignUpdateDto = z.infer<typeof createCampaignUpdateSchema>;
export type UpdateBankInfoDto = z.infer<typeof updateBankInfoSchema>;
