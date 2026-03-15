import { z } from 'zod';
import { CampaignRequestStatus } from '../entities/CampaignRequest';

export const adminCampaignAnalyticsQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '30', 10);
      return Number.isNaN(parsed) ? 30 : Math.min(365, Math.max(1, parsed));
    }),
});

export const adminCampaignRequestsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '1', 10);
      return Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
    }),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '10', 10);
      return Number.isNaN(parsed) ? 10 : Math.min(100, Math.max(1, parsed));
    }),
  status: z.nativeEnum(CampaignRequestStatus).optional(),
});

export const adminCampaignTransactionsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '1', 10);
      return Number.isNaN(parsed) ? 1 : Math.max(1, parsed);
    }),
  limit: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '10', 10);
      return Number.isNaN(parsed) ? 10 : Math.min(100, Math.max(1, parsed));
    }),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount']).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  startDate: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: 'startDate must be a valid date or datetime string',
    }),
  endDate: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
      message: 'endDate must be a valid date or datetime string',
    }),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return new Date(data.startDate) <= new Date(data.endDate);
  },
  {
    message: 'startDate must be before or equal to endDate',
    path: ['startDate'],
  },
);

export type AdminCampaignAnalyticsQueryDto = z.infer<
  typeof adminCampaignAnalyticsQuerySchema
>;
export type AdminCampaignRequestsQueryDto = z.infer<
  typeof adminCampaignRequestsQuerySchema
>;
export type AdminCampaignTransactionsQueryDto = z.infer<
  typeof adminCampaignTransactionsQuerySchema
>;
