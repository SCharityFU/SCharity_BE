# SCharity Backend Codebase Index

Last indexed: 2026-03-10

## Tech Stack
- Runtime: Node.js + TypeScript
- Framework: Express
- ORM: TypeORM (PostgreSQL)
- Auth: JWT + Passport (Google OAuth)
- Cache/Queue: Redis + BullMQ
- Storage: AWS S3 (multer + multer-s3)
- API docs: Swagger (`/api-docs`)

## Entrypoint and App Wiring
- Entrypoint: `src/app.ts`
- Boot sequence:
  - Load env and middleware (helmet, cors, body parsers, morgan)
  - Register global rate limiter
  - Register health check (`GET /health`)
  - Register Swagger UI (`/api-docs`)
  - Mount API routes at `/api/v1`
  - Initialize TypeORM datasource
  - Start email queue processor (`src/queues/processors/email.processor.ts`)

## Top-Level API Route Groups
Mounted in `src/routes/index.ts`:
- `/auth`
- `/admin`
- `/campaigns`
- `/donations`
- `/users`
- `/withdrawals`

## API Endpoint Matrix
Base prefix for all endpoints below: `/api/v1`

### Auth (`src/routes/auth.route.ts`)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/google-login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/verify-email`
- `GET /auth/me`
- `POST /auth/change-password`
- `GET /auth/google`
- `GET /auth/google/callback`

### Campaigns (`src/routes/campaign.route.ts`)
- `POST /campaigns/requests`
- `GET /campaigns/requests/mine`
- `GET /campaigns/mine`
- `GET /campaigns`
- `GET /campaigns/:id`
- `GET /campaigns/:id/updates`
- `GET /campaigns/:campaignId/donations`
- `GET /campaigns/:campaignId/comments`
- `POST /campaigns/:campaignId/comments`
- `DELETE /campaigns/:campaignId/comments/:commentId`
- `POST /campaigns/:campaignId/report`
- `PUT /campaigns/:id`
- `POST /campaigns/:id/close`
- `GET /campaigns/:id/analytics`
- `POST /campaigns/:id/updates`

### Donations (`src/routes/donation.route.ts`)
- `POST /donations`
- `GET /donations/me/history`
- `GET /donations/:id`

### Users (`src/routes/user.route.ts`)
- `GET /users/me`
- `PUT /users/me`
- `GET /users/me/bank-accounts`
- `POST /users/me/bank-accounts`
- `DELETE /users/me/bank-accounts/:id`
- `PUT /users/me/bank-accounts/:id/default`

### Withdrawals (`src/routes/withdraw.route.ts`)
- `POST /withdrawals`
- `GET /withdrawals/mine`
- `GET /withdrawals/:id`

### Admin (`src/routes/admin.route.ts`)
- `GET /admin/dashboard`
- `GET /admin/dashboard/chart`
- `GET /admin/campaign-requests`
- `GET /admin/campaign-requests/:id`
- `POST /admin/campaign-requests/:id/review`
- `GET /admin/campaigns`
- `GET /admin/campaigns/:id`
- `PUT /admin/campaigns/:id/suspend`
- `PUT /admin/campaigns/:id/unsuspend`
- `GET /admin/campaigns/:id/transactions`
- `GET /admin/withdraw-requests`
- `GET /admin/withdraw-requests/:id`
- `POST /admin/withdraw-requests/:id/process`
- `GET /admin/reports`
- `PUT /admin/reports/:id/resolve`
- `GET /admin/transactions`

## Controllers
Defined in `src/controllers`:
- `admin.controller.ts` -> `adminController`
- `auth.controller.ts` -> `authController`
- `campaign.controller.ts` -> `campaignController`
- `donation.controller.ts` -> `donationController`
- `user.controller.ts` -> `userController`
- `withdraw.controller.ts` -> `withdrawController`

## Services
Defined in `src/services`:
- `admin.service.ts` -> `AdminService`, `adminService`
- `auth.service.ts` -> `AuthService`, `authService`
- `cache.service.ts` -> `cacheService`
- `campaign.service.ts` -> `CampaignService`, `campaignService`
- `donation.service.ts` -> `DonationService`, `donationService`
- `email.service.ts` -> `emailService`
- `storage.service.ts` -> `storageService`
- `user.service.ts` -> `UserService`, `userService`
- `withdraw.service.ts` -> `WithdrawService`, `withdrawService`

## Repositories
Custom repository extensions in `src/repositories`:
- `campaign.repository.ts`
  - `CampaignRepository`
  - `CampaignRequestRepository`
  - `CampaignUpdateRepository`
- `donation.repository.ts`
  - `DonationRepository`
  - `CommentRepository`
- `report.repository.ts`
  - `ReportRepository`
- `user.repository.ts`
  - `UserRepository`
  - `BankAccountRepository`
- `withdraw.repository.ts`
  - `WithdrawRepository`

## Domain Model (Entities)
Defined in `src/entities`:
- `User` (`users`)
- `Campaign` (`campaigns`)
- `CampaignRequest` (`campaign_requests`)
- `CampaignUpdate` (`campaign_updates`)
- `Donation` (`donations`)
- `Comment` (`comments`)
- `Report` (`reports`)
- `WithdrawRequest` (`withdraw_requests`)
- `BankAccount` (`bank_accounts`)
- `AuditLog` (`audit_logs`)

### Core Relationships
- `User` 1:N `Campaign`
- `Campaign` 1:N `Donation`
- `Campaign` 1:N `CampaignUpdate`
- `Campaign` 1:N `WithdrawRequest`
- `Campaign` 1:N `Report`
- `User` 1:N `Donation`
- `User` 1:N `Report`
- `User` 1:N `BankAccount`
- `Comment` links to `Campaign`, `User`, optional `Donation`

## Cross-Cutting Middleware
Defined in `src/middlewares`:
- `auth.middleware.ts`: `authenticate`, `optionalAuthenticate`
- `role.middleware.ts`: `requireRoles`, `requireAdmin`, `requireCampaignCreator`, `requireDonor`
- `rateLimiter.middleware.ts`: `globalRateLimiter`, `authRateLimiter`, `donationRateLimiter`
- `validate.middleware.ts`: `validate`, `validateQuery`, `validateParams`
- `upload.middleware.ts`: `uploadImage`, `uploadDocument`, `uploadMultiple`
- `error.middleware.ts`: `errorHandler`, `notFoundHandler`

## Configuration
Defined in `src/config`:
- `database.ts`: TypeORM datasource (`AppDataSource`)
- `passport.ts`: Passport strategy setup
- `redis.ts`: Redis clients (`redisClient`, `redisBullMQ`)
- `s3.ts`: S3 client (`s3Client`, `S3_BUCKET`)
- `swagger.ts`: Swagger spec generation (`swaggerSpec`)

## Queue/Async Processing
- Queue definition: `src/queues/email.queue.ts`
- Worker processor: `src/queues/processors/email.processor.ts`
- Triggered at app startup via dynamic import in `src/app.ts`

## Validation Layer
Zod schemas in `src/validators`:
- `auth.validator.ts`
- `campaign.validator.ts`
- `donation.validator.ts`
- `user.validator.ts`
- `withdraw.validator.ts`

## Utilities
- `src/utils/errors.ts`: custom application error hierarchy
- `src/utils/jwt.ts`: access/refresh token helpers
- `src/utils/pagination.ts`: pagination helpers + formatting utilities
- `src/utils/response.ts`: consistent success/pagination response wrappers

## Build and Run
- Dev: `npm run dev`
- Build: `npm run build`
- Prod start: `npm run start`
- Lint: `npm run lint`
- TypeORM CLI: `npm run typeorm`
