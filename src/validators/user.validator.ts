import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  phoneNumber: z
    .string()
    .regex(/^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/, 'Invalid Vietnamese phone number')
    .optional(),
});

export const addBankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z
    .string()
    .min(1, 'Account number is required')
    .regex(/^\d+$/, 'Account number must contain only digits'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  isDefault: z.boolean().optional().default(false),
});

export const reportCampaignSchema = z.object({
  reason: z.enum(['false_information', 'fake_image', 'no_update', 'fraud', 'other']),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000)
    .optional(),
});

export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
export type AddBankAccountDto = z.infer<typeof addBankAccountSchema>;
export type ReportCampaignDto = z.infer<typeof reportCampaignSchema>;
