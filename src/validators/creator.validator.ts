import { z } from 'zod';

export const creatorDashboardQuerySchema = z.object({
  campaignLimit: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '3', 10);
      return Number.isNaN(parsed) ? 3 : Math.min(20, Math.max(1, parsed));
    }),
  donationLimit: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '5', 10);
      return Number.isNaN(parsed) ? 5 : Math.min(50, Math.max(1, parsed));
    }),
  campaignCursor: z.string().optional(),
  donationCursor: z.string().optional(),
  timezone: z.string().optional().default('Asia/Ho_Chi_Minh'),
});

export type CreatorDashboardQueryDto = z.infer<typeof creatorDashboardQuerySchema>;
