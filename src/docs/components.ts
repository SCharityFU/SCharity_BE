/**
 * @swagger
 * components:
 *   schemas:
 *
 *     # ─── Shared wrappers ──────────────────────────────────────────────────
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: OK
 *         data:
 *           type: object
 *
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 100
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 10
 *         hasNext:
 *           type: boolean
 *         hasPrev:
 *           type: boolean
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *
 *     # ─── Auth schemas ─────────────────────────────────────────────────────
 *
 *     TokenPair:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         refreshToken:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *     AuthResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/TokenPair'
 *         - type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/UserPublic'
 *
 *     RegisterRequest:
 *       type: object
 *       required: [email, password, fullName]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 8
 *           example: Password123
 *           description: Minimum 8 characters, must contain uppercase, lowercase and number
 *         fullName:
 *           type: string
 *           minLength: 2
 *           example: Nguyen Van A
 *
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           example: Password123
 *
 *     RefreshTokenRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken:
 *           type: string
 *
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required: [token, password]
 *       properties:
 *         token:
 *           type: string
 *         password:
 *           type: string
 *           minLength: 8
 *           example: NewPassword123
 *
 *     ChangePasswordRequest:
 *       type: object
 *       required: [currentPassword, newPassword, confirmPassword]
 *       properties:
 *         currentPassword:
 *           type: string
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           example: NewPassword123
 *         confirmPassword:
 *           type: string
 *           example: NewPassword123
 *
 *     # ─── User schemas ─────────────────────────────────────────────────────
 *
 *     UserPublic:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *           format: email
 *         fullName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, user]
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *         phoneNumber:
 *           type: string
 *           nullable: true
 *         isEmailVerified:
 *           type: boolean
 *         isKycVerified:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     UpdateUserProfileRequest:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           minLength: 2
 *         phoneNumber:
 *           type: string
 *
 *     BankAccount:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         bankName:
 *           type: string
 *           example: Vietcombank
 *         accountNumber:
 *           type: string
 *           example: "1234567890"
 *         accountHolderName:
 *           type: string
 *           example: NGUYEN VAN A
 *         isDefault:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     AddBankAccountRequest:
 *       type: object
 *       required: [bankName, accountNumber, accountHolderName]
 *       properties:
 *         bankName:
 *           type: string
 *           example: Vietcombank
 *         accountNumber:
 *           type: string
 *           example: "1234567890"
 *         accountHolderName:
 *           type: string
 *           example: NGUYEN VAN A
 *
 *     # ─── Campaign schemas ─────────────────────────────────────────────────
 *
 *     Campaign:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         story:
 *           type: string
 *         goalAmount:
 *           type: number
 *           example: 50000000
 *         raisedAmount:
 *           type: number
 *           example: 12500000
 *         progressPercent:
 *           type: number
 *           example: 25
 *         deadline:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [pending, active, closed, suspended, completed, withdrawn]
 *         category:
 *           type: string
 *           enum: [education, medical, disaster, community, environment, other]
 *         thumbnailUrl:
 *           type: string
 *           nullable: true
 *         mediaUrls:
 *           type: array
 *           items:
 *             type: string
 *         donorCount:
 *           type: integer
 *         suspendReason:
 *           type: string
 *           nullable: true
 *         creatorId:
 *           type: string
 *           format: uuid
 *         creator:
 *           $ref: '#/components/schemas/UserPublic'
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CampaignRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         story:
 *           type: string
 *         goalAmount:
 *           type: number
 *         deadline:
 *           type: string
 *           format: date-time
 *         category:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         rejectReason:
 *           type: string
 *           nullable: true
 *         bankInfo:
 *           $ref: '#/components/schemas/BankInfo'
 *         thumbnailUrl:
 *           type: string
 *           nullable: true
 *         mediaUrls:
 *           type: array
 *           items:
 *             type: string
 *         proofDocuments:
 *           type: array
 *           items:
 *             type: string
 *         requesterId:
 *           type: string
 *           format: uuid
 *         requester:
 *           $ref: '#/components/schemas/UserPublic'
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateCampaignRequest:
 *       type: object
 *       required: [title, story, goalAmount, deadline, bankInfo]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           example: Hỗ trợ học sinh nghèo vượt khó
 *         story:
 *           type: string
 *           minLength: 50
 *           example: Câu chuyện về hành trình...
 *         goalAmount:
 *           type: number
 *           minimum: 1000000
 *           example: 50000000
 *         deadline:
 *           type: string
 *           format: date-time
 *           example: "2026-06-30T23:59:59Z"
 *         category:
 *           type: string
 *           enum: [education, medical, disaster, community, environment, other]
 *           default: other
 *         bankInfo:
 *           $ref: '#/components/schemas/BankInfo'
 *
 *     UpdateCampaignRequest:
 *       type: object
 *       properties:
 *         story:
 *           type: string
 *           minLength: 50
 *
 *     ReviewCampaignRequestBody:
 *       type: object
 *       required: [action]
 *       properties:
 *         action:
 *           type: string
 *           enum: [approve, reject]
 *         rejectReason:
 *           type: string
 *           minLength: 10
 *           description: Required when action is "reject"
 *
 *     SuspendCampaignRequest:
 *       type: object
 *       required: [reason]
 *       properties:
 *         reason:
 *           type: string
 *           minLength: 10
 *           example: Chiến dịch bị báo cáo gian lận
 *
 *     CampaignUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         category:
 *           type: string
 *           enum: [progress, financial, general, completion]
 *         mediaUrls:
 *           type: array
 *           items:
 *             type: string
 *         isDraft:
 *           type: boolean
 *         campaignId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateCampaignUpdateRequest:
 *       type: object
 *       required: [title, content]
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *         content:
 *           type: string
 *           minLength: 20
 *         category:
 *           type: string
 *           enum: [progress, financial, general, completion]
 *         isDraft:
 *           type: boolean
 *           default: 'true'
 *
 *     UpdateCampaignUpdateRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *         content:
 *           type: string
 *           minLength: 20
 *         category:
 *           type: string
 *           enum: [progress, financial, general, completion]
 *           default: general
 *         isDraft:
 *           type: boolean
 *           default: true
 *
 *     CampaignAnalytics:
 *       type: object
 *       properties:
 *         campaign:
 *           $ref: '#/components/schemas/Campaign'
 *         chartData:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               amount:
 *                 type: number
 *               count:
 *                 type: integer
 *         recentDonations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Donation'
 *         totalDonors:
 *           type: integer
 *
 *     # ─── Donation schemas ─────────────────────────────────────────────────
 *
 *     Donation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           example: 200000
 *         status:
 *           type: string
 *           enum: [pending, success, failed, refunded]
 *         paymentMethod:
 *           type: string
 *           enum: [vnpay, momo, stripe, bank_transfer]
 *           nullable: true
 *         transactionRef:
 *           type: string
 *           nullable: true
 *         message:
 *           type: string
 *           nullable: true
 *         isAnonymous:
 *           type: boolean
 *         donorName:
 *           type: string
 *           nullable: true
 *           description: Shows donor name, or "Anonymous" when isAnonymous is true
 *         campaignId:
 *           type: string
 *           format: uuid
 *         donorId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateDonationRequest:
 *       type: object
 *       required: [campaignId, amount, paymentMethod]
 *       properties:
 *         campaignId:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           minimum: 10000
 *           example: 200000
 *         paymentMethod:
 *           type: string
 *           enum: [vnpay, momo, stripe, bank_transfer]
 *         message:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *         isAnonymous:
 *           type: boolean
 *           default: false
 *
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         isAnonymous:
 *           type: boolean
 *         campaignId:
 *           type: string
 *           format: uuid
 *         donorId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         donor:
 *           $ref: '#/components/schemas/UserPublic'
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateCommentRequest:
 *       type: object
 *       required: [content]
 *       properties:
 *         content:
 *           type: string
 *           maxLength: 500
 *           example: Chúc dự án thành công!
 *         isAnonymous:
 *           type: boolean
 *           default: false
 *
 *     # ─── Report schemas ───────────────────────────────────────────────────
 *
 *     Report:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         reason:
 *           type: string
 *           enum: [false_information, fake_image, no_update, fraud, other]
 *         description:
 *           type: string
 *           nullable: true
 *         evidenceUrls:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved]
 *         campaignId:
 *           type: string
 *           format: uuid
 *         reporterId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ReportCampaignRequest:
 *       type: object
 *       required: [reason]
 *       properties:
 *         reason:
 *           type: string
 *           enum: [false_information, fake_image, no_update, fraud, other]
 *         description:
 *           type: string
 *           maxLength: 1000
 *
 *     # ─── Withdraw schemas ─────────────────────────────────────────────────
 *
 *     WithdrawRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           example: 12500000
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, completed]
 *         rejectReason:
 *           type: string
 *           nullable: true
 *         bankInfo:
 *           $ref: '#/components/schemas/BankInfo'
 *         campaignId:
 *           type: string
 *           format: uuid
 *         campaign:
 *           $ref: '#/components/schemas/Campaign'
 *         requesterId:
 *           type: string
 *           format: uuid
 *         processedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateWithdrawRequest:
 *       type: object
 *       required: [campaignId, amount, bankInfo]
 *       properties:
 *         campaignId:
 *           type: string
 *           format: uuid
 *         amount:
 *           type: number
 *           minimum: 1
 *         bankInfo:
 *           $ref: '#/components/schemas/BankInfo'
 *
 *     ProcessWithdrawRequest:
 *       type: object
 *       required: [action]
 *       properties:
 *         action:
 *           type: string
 *           enum: [approve, reject]
 *         rejectReason:
 *           type: string
 *           minLength: 10
 *           description: Required when action is "reject"
 *
 *     # ─── Shared value objects ─────────────────────────────────────────────
 *
 *     BankInfo:
 *       type: object
 *       required: [bankName, accountNumber, accountHolderName]
 *       properties:
 *         bankName:
 *           type: string
 *           example: Vietcombank
 *         accountNumber:
 *           type: string
 *           example: "1234567890"
 *         accountHolderName:
 *           type: string
 *           example: NGUYEN VAN A
 *
 *     # ─── Admin schemas ────────────────────────────────────────────────────
 *
 *     DashboardStats:
 *       type: object
 *       properties:
 *         totalCampaigns:
 *           type: integer
 *         successfulCampaigns:
 *           type: integer
 *         suspendedCampaigns:
 *           type: integer
 *         totalDonationReceived:
 *           type: number
 *         totalDonationPaid:
 *           type: number
 *         adminBalance:
 *           type: number
 *         totalCampaignCreators:
 *           type: integer
 *         totalDonors:
 *           type: integer
 *         totalUsers:
 *           type: integer
 *
 *   parameters:
 *
 *     pageParam:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         default: 1
 *       description: Page number
 *
 *     limitParam:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         default: 10
 *       description: Items per page
 *
 *     idParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: Resource UUID
 */
