import { z } from 'zod';
import { CampaignCategory } from '../entities/Campaign';
import { UpdateCategory } from '../entities/CampaignUpdate';

export const createCampaignRequestSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(100, 'Tiêu đề không được vượt quá 100 ký tự'),

  story: z.string().min(50, 'Nội dung câu chuyện phải có ít nhất 50 ký tự'),

  goalAmount: z
    .union([z.number(), z.string().transform((v) => Number(v))])
    .pipe(
      z.number().positive('Số tiền mục tiêu phải lớn hơn 0').min(30000, 'Số tiền quyên góp tối thiểu là 30.000 VND'),
    ),

  deadline: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), {
      message: 'Thời hạn kết thúc phải nằm trong tương lai',
    }),

  category: z.nativeEnum(CampaignCategory).optional().default(CampaignCategory.OTHER),

  bankInfo: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    },
    z.object({
      bankName: z.string().min(1, 'Tên ngân hàng là bắt buộc'),

      accountNumber: z.string().min(1, 'Số tài khoản là bắt buộc').regex(/^\d+$/, 'Số tài khoản chỉ được chứa chữ số'),

      accountHolderName: z
        .string()
        .min(1, 'Tên chủ tài khoản là bắt buộc')
        .regex(/^[A-Za-z\s]+$/, 'Tên chủ tài khoản chỉ được chứa chữ cái không dấu và khoảng trắng')
        .transform((v) => v.toUpperCase()),
    }),
  ),
});

export const updateBankInfoSchema = z.object({
  bankInfo: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    },
    z.object({
      bankName: z.string().min(1, 'Tên ngân hàng là bắt buộc'),

      accountNumber: z.string().min(1, 'Số tài khoản là bắt buộc').regex(/^\d+$/, 'Số tài khoản chỉ được chứa chữ số'),

      accountHolderName: z
        .string()
        .min(1, 'Tên chủ tài khoản là bắt buộc')
        .regex(/^[A-Za-z\s]+$/, 'Tên chủ tài khoản chỉ được chứa chữ cái không dấu và khoảng trắng')
        .transform((v) => v.toUpperCase()),
    }),
  ),
});

export const reviewCampaignRequestSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
    rejectReason: z.string().min(10, 'Lý do từ chối phải có ít nhất 10 ký tự').optional(),
  })
  .refine((data) => data.action !== 'reject' || (data.rejectReason && data.rejectReason.length > 0), {
    message: 'Vui lòng nhập lý do khi từ chối yêu cầu',
    path: ['rejectReason'],
  });

export const updateCampaignSchema = z.object({
  story: z.string().min(50, 'Nội dung câu chuyện phải có ít nhất 50 ký tự').optional(),

  thumbnailUrl: z.string().url('Đường dẫn ảnh không hợp lệ').optional(),
});

export const updateCampaignRequestSchema = z.object({
  title: z
    .string()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự')
    .optional(),

  story: z.string().min(50, 'Nội dung câu chuyện phải có ít nhất 50 ký tự').optional(),

  goalAmount: z
    .union([z.number(), z.string().transform((v) => Number(v))])
    .pipe(z.number().positive('Số tiền mục tiêu phải lớn hơn 0').min(30000, 'Số tiền tối thiểu là 30.000 VND'))
    .optional(),

  deadline: z
    .string()
    .datetime()
    .refine((d) => new Date(d) > new Date(), {
      message: 'Thời hạn kết thúc phải nằm trong tương lai',
    })
    .optional(),

  category: z.nativeEnum(CampaignCategory).optional(),
});

export const suspendCampaignSchema = z.object({
  reason: z.string().min(10, 'Lý do tạm dừng chiến dịch phải có ít nhất 10 ký tự'),
});

export const closeCampaignSchema = z.object({
  confirm: z.boolean().refine((v) => v === true, {
    message: 'Vui lòng xác nhận đóng chiến dịch',
  }),
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

  sortBy: z.enum(['createdAt', 'raisedAmount', 'deadline', 'goalAmount']).optional().default('createdAt'),

  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

export const createCampaignUpdateSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự').max(100, 'Tiêu đề không được vượt quá 100 ký tự'),

  content: z.string().min(10, 'Nội dung phải có ít nhất 10 ký tự'),

  category: z.nativeEnum(UpdateCategory).optional().default(UpdateCategory.PROGRESS),
  isDraft: z.boolean().optional().default(true),
});

export const updateCampaignUpdateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100).optional(),
  content: z.string().min(10, 'Content must be at least 10 characters').optional(),
  category: z.nativeEnum(UpdateCategory).optional(),
  isDraft: z.boolean().optional().default(true),
});

export const campaignAnalyticsQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((v) => {
      const parsed = parseInt(v || '30', 10);
      return Number.isNaN(parsed) ? 30 : Math.min(365, Math.max(1, parsed));
    }),
});

export type CreateCampaignRequestDto = z.infer<typeof createCampaignRequestSchema>;
export type ReviewCampaignRequestDto = z.infer<typeof reviewCampaignRequestSchema>;
export type UpdateCampaignDto = z.infer<typeof updateCampaignSchema>;
export type UpdateCampaignRequestDto = z.infer<typeof updateCampaignRequestSchema>;
export type SuspendCampaignDto = z.infer<typeof suspendCampaignSchema>;
export type CampaignQueryDto = z.infer<typeof campaignQuerySchema>;
export type CreateCampaignUpdateDto = z.infer<typeof createCampaignUpdateSchema>;
export type UpdateCampaignUpdateDto = z.infer<typeof updateCampaignUpdateSchema>;
export type UpdateBankInfoDto = z.infer<typeof updateBankInfoSchema>;
export type CampaignAnalyticsQueryDto = z.infer<typeof campaignAnalyticsQuerySchema>;
