import { z } from 'zod';

export const createWithdrawRequestSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  // Backward compatibility: ignore legacy bankAccountId if client still sends it.
  bankAccountId: z.string().uuid('Invalid bank account ID').optional(),
});

export const processWithdrawRequestSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    rejectReason: z.string().min(10, 'Reject reason must be at least 10 characters').optional(),
  })
  .refine((data) => data.action !== 'reject' || (data.rejectReason && data.rejectReason.length > 0), {
    message: 'Reject reason is required when rejecting',
    path: ['rejectReason'],
  });

export type CreateWithdrawRequestDto = z.infer<typeof createWithdrawRequestSchema>;
export type ProcessWithdrawRequestDto = z.infer<typeof processWithdrawRequestSchema>;
