# SCharity Backend — Codebase Index

Last indexed: 2026-03-12

---

## Tech Stack

| Layer         | Technology                                              |
| ------------- | ------------------------------------------------------- |
| Runtime       | Node.js 20 + TypeScript 5.3                             |
| Framework     | Express 4                                               |
| ORM           | TypeORM 0.3 (PostgreSQL 16)                             |
| Auth          | JWT (`jsonwebtoken`) + Passport + Google OAuth 2.0      |
| Cache / Queue | Redis (ioredis) + BullMQ                                |
| File storage  | AWS S3 (`@aws-sdk/client-s3`) + multer (memory storage) |
| Email         | Nodemailer (SMTP)                                       |
| Validation    | Zod                                                     |
| API docs      | Swagger (`swagger-jsdoc` + `swagger-ui-express`)        |
| Linting       | ESLint + Prettier                                       |

---

## Workspace Layout

```
SCharity_BE/
├── src/                  # Application source code
│   ├── app.ts            # Entrypoint
│   ├── config/           # Database, Redis, S3, Passport, Swagger
│   ├── controllers/      # Request handlers
│   ├── docs/             # ERD, entity descriptions, Swagger components
│   ├── dtos/             # Data Transfer Objects (per-domain)
│   ├── entities/         # TypeORM entities
│   ├── middlewares/      # Express middleware
│   ├── queues/           # BullMQ queue definitions + workers
│   ├── repositories/     # Custom TypeORM repository extensions
│   ├── routes/           # Express routers
│   ├── services/         # Business logic
│   ├── types/            # Shared TypeScript interfaces
│   ├── utils/            # Errors, JWT, pagination, response, dto-mapper
│   └── validators/       # Zod schemas + inferred types
├── docs/                 # Project-level documentation
├── nginx/                # Reverse proxy config
├── .github/workflows/    # CI/CD pipeline
├── Dockerfile            # Multi-stage container build
├── docker-compose.yml    # Local / production container orchestration
├── package.json
└── tsconfig.json
```

---

## Entrypoint & Boot Sequence (`src/app.ts`)

1. Load `.env` with `dotenv`
2. Apply security middleware: `helmet`, `cors` (origin from `CLIENT_URL`)
3. Register body parsers: `express.json` (10 MB limit), `express.urlencoded`
4. Register `morgan` logger (skipped in `test` env)
5. Register `globalRateLimiter`
6. Mount health check at `GET /health` → `{ status: 'ok', timestamp }`
7. Mount Swagger UI at `/api-docs`
8. Mount all API routers at `/api/v1`
9. Register `notFoundHandler` then `errorHandler`
10. Initialize TypeORM `AppDataSource` (PostgreSQL)
11. Dynamic import of `src/queues/processors/email.processor` (starts BullMQ worker in-process)
12. Listen on `PORT` (default 3000)

---

## Top-Level API Route Groups

Mounted in `src/routes/index.ts` under `/api/v1`:

| Prefix         | Router file                    |
| -------------- | ------------------------------ |
| `/auth`        | `src/routes/auth.route.ts`     |
| `/admin`       | `src/routes/admin.route.ts`    |
| `/campaigns`   | `src/routes/campaign.route.ts` |
| `/creator`     | `src/routes/creator.route.ts`  |
| `/donations`   | `src/routes/donation.route.ts` |
| `/users`       | `src/routes/user.route.ts`     |
| `/withdrawals` | `src/routes/withdraw.route.ts` |

---

## API Endpoint Matrix

> Base prefix for all endpoints: `/api/v1`
> Auth column: `pub` = public, `opt` = optional JWT, `jwt` = required JWT, `admin` = JWT + admin role

### Auth (`/auth`)

| Method | Path                    | Auth | Description                                                                               |
| ------ | ----------------------- | ---- | ----------------------------------------------------------------------------------------- |
| POST   | `/auth/register`        | pub  | Register new account; sends verification email                                            |
| POST   | `/auth/login`           | pub  | Login with email + password                                                               |
| POST   | `/auth/google-login`    | pub  | Login with Google access token (`idToken` field)                                          |
| POST   | `/auth/refresh-token`   | pub  | Rotate access + refresh token pair                                                        |
| POST   | `/auth/logout`          | jwt  | Invalidates refresh token in Redis                                                        |
| POST   | `/auth/forgot-password` | pub  | Sends password reset link via email                                                       |
| POST   | `/auth/reset-password`  | pub  | Resets password using token from email                                                    |
| GET    | `/auth/verify-email`    | pub  | Verifies email address via `?token=` query param                                          |
| GET    | `/auth/me`              | jwt  | Returns current user profile                                                              |
| POST   | `/auth/change-password` | jwt  | Changes password (requires current password)                                              |
| GET    | `/auth/google`          | pub  | Initiates Google OAuth flow (redirects to Google)                                         |
| GET    | `/auth/google/callback` | pub  | Google OAuth callback; redirects to `CLIENT_URL/auth/callback?accessToken=&refreshToken=` |

### Campaigns (`/campaigns`)

| Method | Path                                         | Auth | Description                                                                              |
| ------ | -------------------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| POST   | `/campaigns/requests`                        | jwt  | Submit campaign creation request (multipart: `thumbnail`, `media[]`, `proofDocuments[]`) |
| GET    | `/campaigns/requests/mine`                   | jwt  | List own campaign creation requests (paginated)                                          |
| GET    | `/campaigns/mine`                            | jwt  | List campaigns owned by current user (paginated)                                         |
| GET    | `/campaigns`                                 | opt  | List/search active campaigns (paginated, filterable)                                     |
| GET    | `/campaigns/:id`                             | opt  | Get campaign detail (includes donations, updates, comments)                              |
| GET    | `/campaigns/:id/updates`                     | pub  | List campaign progress updates (paginated)                                               |
| GET    | `/campaigns/:campaignId/donations`           | pub  | List donations for a campaign (paginated)                                                |
| GET    | `/campaigns/:campaignId/comments`            | pub  | List comments for a campaign (paginated)                                                 |
| POST   | `/campaigns/:campaignId/comments`            | jwt  | Post comment (requires prior donation to campaign)                                       |
| DELETE | `/campaigns/:campaignId/comments/:commentId` | jwt  | Delete own comment                                                                       |
| POST   | `/campaigns/:campaignId/report`              | jwt  | Report a suspicious campaign                                                             |
| PUT    | `/campaigns/:id`                             | jwt  | Update campaign story/thumbnail (owner; `pending` status only)                           |
| POST   | `/campaigns/:id/close`                       | jwt  | Close campaign (owner; ≥50% funded or deadline reached)                                  |
| GET    | `/campaigns/:id/analytics`                   | jwt  | Get donation analytics for campaign (owner only)                                         |
| GET    | `/campaigns/:id/creator-analytics`           | jwt  | Owner analytics (admin-like chart payload with optional daily top donors)                |
| POST   | `/campaigns/:id/updates`                     | jwt  | Post progress update (owner; multipart media files)                                      |

### Creator (`/creator`)

| Method | Path                 | Auth | Description                                                                                             |
| ------ | -------------------- | ---- | ------------------------------------------------------------------------------------------------------- |
| GET    | `/creator/dashboard` | jwt  | Aggregate creator dashboard payload (supports cursor load-more via `campaignCursor` + `donationCursor`) |

### Donations (`/donations`)

| Method | Path                    | Auth | Description                                      |
| ------ | ----------------------- | ---- | ------------------------------------------------ |
| POST   | `/donations`            | opt  | Make a donation (authenticated or anonymous)     |
| GET    | `/donations/me/history` | jwt  | Get own donation history (paginated, filterable) |
| GET    | `/donations/:id`        | opt  | Get single donation by ID                        |

### Users (`/users`)

| Method | Path                                  | Auth    | Description                                        |
| ------ | ------------------------------------- | ------- | -------------------------------------------------- |
| GET    | `/users/active-count`                 | **pub** | Get count of active users (no auth required)       |
| GET    | `/users/me`                           | jwt     | Get own profile                                    |
| PUT    | `/users/me`                           | jwt     | Update profile (multipart: `avatar` file optional) |
| GET    | `/users/me/bank-accounts`             | jwt     | List own bank accounts                             |
| POST   | `/users/me/bank-accounts`             | jwt     | Add a bank account                                 |
| DELETE | `/users/me/bank-accounts/:id`         | jwt     | Delete a bank account                              |
| PUT    | `/users/me/bank-accounts/:id/default` | jwt     | Set bank account as default                        |

### Withdrawals (`/withdrawals`)

| Method | Path                | Auth | Description                                     |
| ------ | ------------------- | ---- | ----------------------------------------------- |
| POST   | `/withdrawals`      | jwt  | Submit withdrawal request for a closed campaign |
| GET    | `/withdrawals/mine` | jwt  | List own withdrawal requests (paginated)        |
| GET    | `/withdrawals/:id`  | jwt  | Get withdrawal request by ID                    |

### Admin (`/admin`)

> All endpoints require `jwt` + `admin` role.

| Method | Path                                   | Description                                                                                              |
| ------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| GET    | `/admin/dashboard`                     | Platform summary statistics                                                                              |
| GET    | `/admin/dashboard/chart`               | Donation chart data (`?interval=day\|week\|month&days=30`)                                               |
| GET    | `/admin/campaign-requests`             | List campaign creation requests (`?status=pending\|approved\|rejected`)                                  |
| GET    | `/admin/campaign-requests/:id`         | Get single campaign request                                                                              |
| POST   | `/admin/campaign-requests/:id/review`  | Approve or reject a campaign request                                                                     |
| GET    | `/admin/campaigns`                     | UC 2.1.4 admin campaign table rows (name, organizer, progress, raised/goal, detail action payload)       |
| GET    | `/admin/campaigns/:id`                 | UC 2.1.5 basic campaign detail tab (admin projection + public-view link)                                 |
| GET    | `/admin/campaigns/:id/analytics`       | UC 2.1.5 campaign chart data (`?days`) for amount and donor-count over time                              |
| PUT    | `/admin/campaigns/:id/suspend`         | Suspend campaign (freezes donations, cancels pending withdrawals)                                        |
| PUT    | `/admin/campaigns/:id/unsuspend`       | Lift campaign suspension → restores `active` status                                                      |
| GET    | `/admin/campaigns/:id/transactions`    | Paginated transaction list for a campaign (`?search`, `?sortBy`, `?sortOrder`, `?startDate`, `?endDate`) |
| GET    | `/admin/withdraw-requests`             | List all withdrawal requests (`?status`)                                                                 |
| GET    | `/admin/withdraw-requests/:id`         | Get single withdrawal request                                                                            |
| POST   | `/admin/withdraw-requests/:id/process` | Approve or reject withdrawal request                                                                     |
| GET    | `/admin/reports`                       | List all campaign reports (`?status`)                                                                    |
| PUT    | `/admin/reports/:id/resolve`           | Mark report as resolved                                                                                  |
| GET    | `/admin/transactions`                  | List all platform transactions (paginated)                                                               |

---

## Controllers (`src/controllers/`)

| File                     | Export               | Handler methods                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.controller.ts`     | `authController`     | `register`, `login`, `googleLogin`, `googleCallback`, `refreshToken`, `logout`, `forgotPassword`, `resetPassword`, `verifyEmail`, `me`, `changePassword`                                                                                                                                                                                                                                    |
| `campaign.controller.ts` | `campaignController` | `listCampaigns`, `getCampaign`, `submitRequest`, `getMyRequests`, `getMyCampaigns`, `updateCampaign`, `closeCampaign`, `getCampaignAnalytics`, `getCreatorCampaignAnalytics`, `getCampaignUpdates`, `createCampaignUpdate`                                                                                                                                                                  |
| `creator.controller.ts`  | `creatorController`  | `getDashboard`                                                                                                                                                                                                                                                                                                                                                                              |
| `donation.controller.ts` | `donationController` | `donate`, `getMyDonations`, `getDonation`, `getCampaignDonations`, `createComment`, `getComments`, `deleteComment`                                                                                                                                                                                                                                                                          |
| `user.controller.ts`     | `userController`     | `getActiveUserCount`, `getProfile`, `updateProfile`, `getBankAccounts`, `addBankAccount`, `deleteBankAccount`, `setDefaultBankAccount`, `reportCampaign`                                                                                                                                                                                                                                    |
| `withdraw.controller.ts` | `withdrawController` | `createRequest`, `getMyRequests`, `getRequestById`                                                                                                                                                                                                                                                                                                                                          |
| `admin.controller.ts`    | `adminController`    | `getDashboardStats`, `getDonationChartData`, `listCampaignRequests`, `getCampaignRequestById`, `reviewCampaignRequest`, `listCampaigns`, `getCampaignDetails`, `getCampaignAnalytics`, `suspendCampaign`, `unsuspendCampaign`, `listWithdrawRequests`, `getWithdrawRequestById`, `processWithdrawRequest`, `listReports`, `resolveReport`, `listAllTransactions`, `getCampaignTransactions` |

---

## Services (`src/services/`)

### `AuthService` (`auth.service.ts`) — `authService`

| Method                                 | Description                                                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `register(dto)`                        | Hash password, create user, **directly** send verification email (bypasses queue), generate + store tokens |
| `login(dto)`                           | Validate credentials, resend verification if unverified, generate + store tokens                           |
| `refreshToken(token)`                  | Verify refresh token against Redis, rotate token pair                                                      |
| `logout(userId)`                       | Delete `refresh_token:{userId}` from Redis                                                                 |
| `googleLogin(profile)`                 | Upsert user from Google profile, generate tokens                                                           |
| `googleLoginWithToken(accessToken)`    | Exchange Google access token for user info via `@googleapis/oauth2`, delegates to `googleLogin`            |
| `forgotPassword(email)`                | Set reset token (1-hour TTL), **directly** send reset email                                                |
| `resetPassword(token, newPassword)`    | Validate token, hash + save new password, clear reset fields                                               |
| `verifyEmail(token)`                   | Verify token, mark `isEmailVerified = true`                                                                |
| `changePassword(userId, current, new)` | Validate current password, hash + save new password                                                        |

> **Note:** `register`, `login`, and `forgotPassword` call `emailService` directly (not via `emailQueue`) to avoid Redis timeout issues.

---

### `CampaignService` (`campaign.service.ts`) — `campaignService`

| Method                                                                        | Description                                                                                           |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `createRequest(dto, creatorId)`                                               | KYC gate, create `CampaignRequest`, queue `sendNewCampaignRequestEmail`                               |
| `getMyRequests(creatorId, page, limit)`                                       | Paginated own campaign requests                                                                       |
| `listCampaigns(query)`                                                        | Paginated list with Redis cache (5-min TTL, cache key = serialised query)                             |
| `getCampaignById(id)`                                                         | Cache-first fetch with `creator`, `donations`, `updates`, `comments` relations                        |
| `updateCampaign(id, creatorId, data)`                                         | Owner + `pending` status guard, invalidate cache                                                      |
| `closeCampaign(id, creatorId)`                                                | `canClose` guard (`≥50%` funded or deadline passed), set `CLOSED` status                              |
| `getCampaignAnalytics(id, creatorId, days)`                                   | Chart data + recent donations + donor count                                                           |
| `getCreatorCampaignAnalytics(id, creatorId, days)`                            | Strict owner check (`403` on non-owner), returns daily chart series with optional top donor breakdown |
| `getPublicActiveCampaigns(query)`                                             | Delegates to `listCampaigns` forced to `ACTIVE` status                                                |
| `getCampaignUpdates(campaignId, page, limit)`                                 | Paginated published updates                                                                           |
| `createCampaignUpdate(campaignId, creatorId, dto, mediaUrls?)`                | Allowed statuses: `ACTIVE`, `CLOSED`, `WITHDRAWN`; notifies donors via queue if not draft             |
| `reportCampaign(campaignId, reporterId, reason, description?, evidenceUrls?)` | Duplicate-report guard, increment `reportCount`                                                       |
| `getMyCampaigns(creatorId, page, limit)`                                      | Paginated campaigns owned by creator                                                                  |

---

### `CreatorService` (`creator.service.ts`) — `creatorService`

| Method                        | Description                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `getDashboard(userId, query)` | Aggregate creator dashboard payload for UI blocks with independent cursor pagination metadata for recent donations and campaigns preview |

---

### `DonationService` (`donation.service.ts`) — `donationService`

| Method                                                                        | Description                                                                                                                                           |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createDonation(dto, donorId?)`                                               | Campaign `ACTIVE` guard, create donation, update `raisedAmount` + `donorCount`, simulate payment success, queue receipt + creator notification emails |
| `getDonationHistory(donorId, page, limit, filters?)`                          | Filtered by `status`, `startDate`, `endDate`                                                                                                          |
| `getDonationById(id, requesterId?)`                                           | Ownership check (non-owner cannot view others' private donations)                                                                                     |
| `createComment(campaignId, dto, donorId?)`                                    | Requires prior donation via `hasUserDonatedToCampaign` check                                                                                          |
| `getComments(campaignId, page, limit)`                                        | Paginated comments                                                                                                                                    |
| `deleteComment(commentId, requesterId)`                                       | Ownership guard                                                                                                                                       |
| `getCampaignDonations(campaignId, page, limit, search?, sortBy?, sortOrder?)` | Only `SUCCESS` status donations                                                                                                                       |

---

### `UserService` (`user.service.ts`) — `userService`

| Method                                     | Description                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `getActiveUserCount()`                     | Count of `ACTIVE` status users                                            |
| `getProfile(userId)`                       | User with `bankAccounts` relation                                         |
| `updateProfile(userId, dto, avatarFile?)`  | Upload new avatar to S3, delete old avatar, update fields                 |
| `addBankAccount(userId, dto)`              | Duplicate account number guard, unset other defaults if `isDefault: true` |
| `getBankAccounts(userId)`                  | Ordered: default first, then by `createdAt DESC`                          |
| `deleteBankAccount(accountId, userId)`     | Ownership guard                                                           |
| `setDefaultBankAccount(accountId, userId)` | Unset all others, set target as default                                   |

---

### `WithdrawService` (`withdraw.service.ts`) — `withdrawService`

| Method                                  | Description                                                                                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createRequest(dto, creatorId)`         | KYC gate, campaign `CLOSED` guard, pending-request duplicate guard, balance check vs. total already paid, resolve bank account (by `bankAccountId` or default), queue admin notification |
| `getMyRequests(creatorId, page, limit)` | Paginated by `requesterId`                                                                                                                                                               |
| `getRequestById(id, creatorId)`         | Ownership guard, with `campaign` relation                                                                                                                                                |

---

### `AdminService` (`admin.service.ts`) — `adminService`

| Method                                                                                                 | Description                                                                                             |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `getDashboardStats()`                                                                                  | Aggregates campaign stats, donation totals, paid amounts, user counts                                   |
| `getDonationChartData(interval, days)`                                                                 | Delegates to `DonationRepository.getSystemChartData`                                                    |
| `listCampaignRequests(page, limit, status?)`                                                           | With `requester` + `reviewedBy` relations                                                               |
| `getCampaignRequestById(id)`                                                                           | Throws `NotFoundError` if missing                                                                       |
| `reviewCampaignRequest(id, adminId, action, rejectReason?)`                                            | Approves → creates `Campaign` (status `ACTIVE`), queues approval/rejection email; writes `AuditLog`     |
| `listCampaigns(page, limit, filters)`                                                                  | `status`, `search`, `category` filters; returns `AdminCampaignListItemDto[]` for admin table projection |
| `getCampaignDetails(id)`                                                                               | Returns `AdminCampaignDetailDto` (basic tab projection + public view endpoint)                          |
| `getCampaignAnalytics(id, days?)`                                                                      | Returns campaign chart payload (`DonationChartDataPointDto[]`) for admin detail charts                  |
| `suspendCampaign(id, adminId, reason)`                                                                 | Sets `SUSPENDED`, cancels pending withdrawals, queues suspension email, writes `AuditLog`               |
| `unsuspendCampaign(id, adminId)`                                                                       | Restores `ACTIVE` status, writes `AuditLog`                                                             |
| `listWithdrawRequests(page, limit, status?)`                                                           | With `campaign`, `requester`, `processedBy` relations                                                   |
| `processWithdrawRequest(id, adminId, action, rejectReason?)`                                           | Approved → sets `COMPLETED`, marks campaign `WITHDRAWN`; queues email; writes `AuditLog`                |
| `listReports(page, limit, status?)`                                                                    | Returns mapped `ReportResponseDto[]`                                                                    |
| `resolveReport(id, adminId)`                                                                           | Sets `RESOLVED`, writes resolver fields                                                                 |
| `listAllTransactions(page, limit, search?, sortOrder?)`                                                | Platform-wide donations                                                                                 |
| `getCampaignTransactions(campaignId, page, limit, search?, sortBy?, sortOrder?, startDate?, endDate?)` | Campaign-scoped donations with optional date-range filter                                               |
| `getWithdrawRequestById(id)`                                                                           | With `campaign` + `requester` relations                                                                 |

---

### Supporting Services

#### `cacheService` (`cache.service.ts`)

| Method                         | Signature                                    |
| ------------------------------ | -------------------------------------------- |
| `get<T>(key)`                  | Returns parsed value or `null`               |
| `set(key, value, ttlSeconds?)` | Serialises to JSON; optional TTL via `SETEX` |
| `del(key)`                     | Deletes single key                           |
| `keys(pattern)`                | Returns matching keys                        |
| `flush(pattern)`               | Deletes all keys matching glob pattern       |

#### `emailService` (`email.service.ts`)

Backed by `nodemailer` SMTP transporter. All methods accept explicit args and return `Promise<void>`.

| Method                                                                              | Triggered by                                              |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `sendVerificationEmail(email, name, token)`                                         | `AuthService.register`, `AuthService.login` (direct call) |
| `sendPasswordResetEmail(email, name, token)`                                        | `AuthService.forgotPassword` (direct call)                |
| `sendDonationReceipt(email, donorName, campaignTitle, amount, donationId)`          | Email worker `sendDonationReceiptEmail` job               |
| `sendNewDonationNotification(email, creatorName, campaignTitle, amount, donorName)` | Email worker `sendNewDonationNotification` job            |
| `sendCampaignApprovedEmail(email, creatorName, campaignTitle)`                      | Email worker `sendCampaignApprovedEmail` job              |
| `sendCampaignRejectedEmail(email, creatorName, campaignTitle, reason)`              | Email worker `sendCampaignRejectedEmail` job              |
| `sendCampaignSuspendedEmail(email, creatorName, campaignTitle, reason)`             | Email worker `sendCampaignSuspendedEmail` job             |
| `sendWithdrawApprovedEmail(email, creatorName, campaignTitle, amount)`              | Email worker `sendWithdrawApprovedEmail` job              |
| `sendWithdrawRejectedEmail(email, creatorName, campaignTitle, reason)`              | Email worker `sendWithdrawRejectedEmail` job              |
| `sendCampaignUpdateNotification(emails[], campaignTitle, updateTitle, campaignId)`  | Email worker `sendCampaignUpdateNotification` job         |

#### `storageService` (`storage.service.ts`)

Wraps `@aws-sdk/client-s3` for in-memory buffer uploads.

| Method                                                       | S3 Key Pattern                                |
| ------------------------------------------------------------ | --------------------------------------------- |
| `uploadFile(buffer, key, mimeType)`                          | Arbitrary key                                 |
| `deleteFile(key)`                                            | Arbitrary key                                 |
| `getSignedUrl(key, expiresInSeconds?)`                       | Presigned GET URL                             |
| `uploadCampaignThumbnail(buffer, campaignId, mimeType)`      | `campaigns/{id}/thumbnail-{ts}.{ext}`         |
| `uploadCampaignMedia(buffer, campaignId, index, mimeType)`   | `campaigns/{id}/media-{i}-{ts}.{ext}`         |
| `uploadCampaignDocument(buffer, campaignId, name, mimeType)` | `campaigns/{id}/docs/{name}-{ts}`             |
| `uploadUpdateMedia(buffer, campaignId, index, mimeType)`     | `campaigns/{id}/updates/media-{i}-{ts}.{ext}` |

---

## Repositories (`src/repositories/`)

All repositories are TypeORM `Repository` extensions via `.extend({})`.

### `CampaignRepository`

| Method                                                          | Returns                                                                      |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `findByIdWithCreator(id)`                                       | `Campaign \| null` (with `creator`)                                          |
| `findWithPagination(page, limit, filters, sortBy?, sortOrder?)` | `[Campaign[], number]`; filters: `status`, `category`, `search`, `creatorId` |
| `getDashboardStats()`                                           | `{ total, active, suspended, completed, withdrawn }`                         |
| `updateRaisedAmount(campaignId, amount)`                        | Atomic SQL increment of `raisedAmount` and `donorCount`                      |

### `CampaignRequestRepository`

| Method                                     | Returns                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| `findWithPagination(page, limit, status?)` | `[CampaignRequest[], number]` (with `requester`, `reviewedBy`) |

### `CampaignUpdateRepository`

| Method                                      | Returns                                                       |
| ------------------------------------------- | ------------------------------------------------------------- |
| `findByCampaignId(campaignId, page, limit)` | `[CampaignUpdate[], number]` (published only, with `creator`) |

### `DonationRepository`

| Method                                                                                          | Returns                                                                                  |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `findByDonorId(donorId, page, limit, filters?)`                                                 | `[Donation[], number]`; filters: `status`, `startDate`, `endDate`                        |
| `findByCampaignId(campaignId, page, limit, search?, sortBy?, sortOrder?, startDate?, endDate?)` | `[Donation[], number]`; `SUCCESS` status only; search by donor name; optional date range |
| `findAllWithPagination(page, limit, search?, sortOrder?)`                                       | `[Donation[], number]` (with `campaign` + `donor`)                                       |
| `getTotalDonationStats()`                                                                       | `{ totalReceived, totalPaid }`                                                           |
| `getDonationChartData(campaignId, days?)`                                                       | `Array<{ date, amount, count }>` (daily, `DATE_TRUNC`)                                   |
| `getSystemChartData(interval?, days?)`                                                          | `Array<{ date, amount, count }>` (by `day`/`week`/`month`)                               |

### `CommentRepository`

| Method                                                           | Returns                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `findByCampaignId(campaignId, page, limit, sortBy?, sortOrder?)` | `[Comment[], number]` (with `donor`)                         |
| `hasUserDonatedToCampaign(userId, campaignId)`                   | `boolean` (checks via joined donation with `SUCCESS` status) |

### `UserRepository`

| Method                           | Returns                                                    |
| -------------------------------- | ---------------------------------------------------------- |
| `findByEmail(email)`             | `User \| null`                                             |
| `findByEmailWithPassword(email)` | `User \| null` (includes `password` field via `addSelect`) |
| `findByGoogleId(googleId)`       | `User \| null`                                             |
| `findByIdWithRelations(id)`      | `User \| null` (with `bankAccounts`)                       |
| `countByRole()`                  | `Record<string, number>` (excludes `SUSPENDED` users)      |
| `findActiveUsers(page, limit)`   | `[User[], number]` (`ACTIVE` status)                       |
| `countActiveUsers()`             | `number`                                                   |

### `BankAccountRepository`

| Method                        | Returns                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `findByUserId(userId)`        | `BankAccount[]` (default first, then by `createdAt DESC`) |
| `findDefaultByUserId(userId)` | `BankAccount \| null` (`isDefault: true`)                 |

### `WithdrawRepository`

| Method                                      | Returns                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `findWithPagination(page, limit, filters?)` | `[WithdrawRequest[], number]` (with `campaign`, `requester`, `processedBy`); filters: `status`, `creatorId` |
| `findByCampaignId(campaignId)`              | `WithdrawRequest[]` (`PENDING` only, with `campaign` + `requester`)                                         |
| `getTotalPaidAmount(campaignId?)`           | `number` (sum of `COMPLETED` withdrawals; scoped to campaign if provided)                                   |

### `ReportRepository`

| Method                                        | Returns                                             |
| --------------------------------------------- | --------------------------------------------------- |
| `findWithPagination(page, limit, status?)`    | `[Report[], number]` (with `campaign` + `reporter`) |
| `findByCampaignId(campaignId, page, limit)`   | `[Report[], number]` (with `reporter`)              |
| `hasUserReportedCampaign(userId, campaignId)` | `boolean`                                           |

---

## Domain Model — Entities (`src/entities/`)

### Enums

#### `User`

```
UserRole:   ADMIN | USER
UserStatus: ACTIVE | INACTIVE | SUSPENDED
```

#### `Campaign`

```
CampaignStatus:   PENDING | ACTIVE | CLOSED | SUSPENDED | COMPLETED | WITHDRAWN
CampaignCategory: EDUCATION | MEDICAL | DISASTER | COMMUNITY | ENVIRONMENT | OTHER
```

#### `CampaignRequest`

```
CampaignRequestStatus: PENDING | APPROVED | REJECTED
```

#### `CampaignUpdate`

```
UpdateCategory: PROGRESS | FINANCIAL | THANK_YOU | OTHER | AFTER_CAMPAIGN | COMPLETION
```

#### `Donation`

```
DonationStatus: PENDING | SUCCESS | FAILED | REFUNDED
PaymentMethod:  VNPAY | MOMO | STRIPE | BANK_TRANSFER
```

#### `WithdrawRequest`

```
WithdrawStatus: PENDING | APPROVED | REJECTED | COMPLETED
```

#### `Report`

```
ReportStatus: PENDING | REVIEWED | RESOLVED
ReportReason: FALSE_INFORMATION | FAKE_IMAGE | NO_UPDATE | FRAUD | OTHER
```

#### `AuditLog`

```
AuditAction: CAMPAIGN_APPROVED | CAMPAIGN_REJECTED | CAMPAIGN_SUSPENDED |
             CAMPAIGN_UNSUSPENDED | WITHDRAW_APPROVED | WITHDRAW_REJECTED |
             USER_SUSPENDED | REPORT_RESOLVED
```

---

### Entity Summary

| Entity            | Table               | Key columns                                                                                                                                                                                                                            | Computed getters                                                  |
| ----------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `User`            | `users`             | `id` (uuid), `email` (unique), `password` (select:false), `fullName`, `role`, `status`, `googleId`, `isEmailVerified`, `isKycVerified`, `emailVerificationToken`, `passwordResetToken`, `passwordResetExpires`                         | —                                                                 |
| `Campaign`        | `campaigns`         | `id`, `title`, `story`, `goalAmount`, `raisedAmount`, `deadline`, `status`, `category`, `thumbnailUrl`, `mediaUrls` (simple-array), `suspendReason`, `suspendedAt`, `closedAt`, `approvedAt`, `creatorId`, `donorCount`, `reportCount` | `progressPercent`, `isDeadlineReached`, `canClose`, `canWithdraw` |
| `CampaignRequest` | `campaign_requests` | `id`, `title`, `story`, `goalAmount`, `deadline`, `thumbnailUrl`, `mediaUrls`, `category`, `status`, `rejectReason`, `bankInfo` (jsonb), `proofDocuments` (jsonb), `requesterId`, `reviewedById`, `reviewedAt`, `campaignId`           | —                                                                 |
| `CampaignUpdate`  | `campaign_updates`  | `id`, `title` (max 100), `content`, `category`, `mediaUrls`, `isEdited`, `editedAt`, `isDraft`, `campaignId`, `creatorId`                                                                                                              | —                                                                 |
| `Donation`        | `donations`         | `id`, `amount`, `status`, `paymentMethod`, `transactionRef`, `message`, `isAnonymous`, `bankName`, `bankAccount`, `campaignId`, `donorId`, `paymentMetadata` (jsonb)                                                                   | —                                                                 |
| `Comment`         | `comments`          | `id`, `content`, `emoji`, `isAnonymous`, `campaignId`, `donorId`, `donationId`, `isEdited`, `editedAt`                                                                                                                                 | —                                                                 |
| `Report`          | `reports`           | `id`, `reason`, `description`, `evidenceUrls` (simple-array), `status`, `campaignId`, `reporterId`, `resolvedById`, `resolvedAt`                                                                                                       | —                                                                 |
| `WithdrawRequest` | `withdraw_requests` | `id`, `amount`, `status`, `rejectReason`, `bankInfo` (jsonb: `bankName`, `accountNumber`, `accountHolderName`), `campaignId`, `requesterId`, `processedById`, `processedAt`                                                            | —                                                                 |
| `BankAccount`     | `bank_accounts`     | `id`, `bankName`, `accountNumber`, `accountHolderName`, `isDefault`, `userId`                                                                                                                                                          | —                                                                 |
| `AuditLog`        | `audit_logs`        | `id`, `action`, `metadata` (jsonb), `targetId`, `targetType`, `actorId`                                                                                                                                                                | —                                                                 |

### Core Relationships

```
User       1:N  Campaign         (creator)
User       1:N  Donation         (donor)
User       1:N  Report           (reporter)
User       1:N  BankAccount
Campaign   1:N  Donation
Campaign   1:N  CampaignUpdate
Campaign   1:N  CampaignRequest
Campaign   1:N  WithdrawRequest
Campaign   1:N  Report
Comment    N:1  Campaign
Comment    N:1  User             (donor)
Comment    N:1  Donation         (optional)
WithdrawRequest N:1 User         (requester, processedBy)
AuditLog    N:1  User            (actor)
```

---

## Cross-Cutting Middleware (`src/middlewares/`)

### `auth.middleware.ts`

| Export                 | Behaviour                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `authenticate`         | Reads `Authorization: Bearer <token>`, calls `verifyAccessToken`, sets `req.user`; throws 401 if missing or invalid |
| `optionalAuthenticate` | Same as above but silently continues if no token is present (no error)                                              |

### `role.middleware.ts`

| Export                   | Roles allowed              |
| ------------------------ | -------------------------- |
| `requireRoles(...roles)` | Factory — any role in list |
| `requireAdmin`           | `ADMIN` only               |
| `requireCampaignCreator` | `USER` or `ADMIN`          |
| `requireDonor`           | `USER` or `ADMIN`          |

### `rateLimiter.middleware.ts`

| Export                | Window | Max requests | Applied to                                                                                           |
| --------------------- | ------ | ------------ | ---------------------------------------------------------------------------------------------------- |
| `globalRateLimiter`   | 15 min | 100 (env)    | All routes (app-level)                                                                               |
| `authRateLimiter`     | 15 min | 10           | `POST /auth/login`, `POST /auth/register` (not currently applied in route files — available for use) |
| `donationRateLimiter` | 1 min  | 5            | `POST /donations`                                                                                    |

### `validate.middleware.ts`

| Export                   | Validates    | Stores parsed result in |
| ------------------------ | ------------ | ----------------------- |
| `validate(schema)`       | `req.body`   | `req.body`              |
| `validateQuery(schema)`  | `req.query`  | `req.query`             |
| `validateParams(schema)` | `req.params` | `req.params`            |

All use `schema.parse(...)` from Zod; on failure, the thrown `ZodError` propagates to `errorHandler`.

### `upload.middleware.ts`

Uses `multer` with `memoryStorage` (files buffered in memory, max 10 MB per file).

| Export                | Multer config                                                                           | Used for                                    |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| `uploadImage`         | Single field `avatar`; image types only (JPEG/PNG/WEBP/GIF)                             | `PUT /users/me`                             |
| `uploadDocument`      | Single field `document`; images + PDF                                                   | General document upload (available utility) |
| `uploadMultiple`      | Any fields, up to 10 files, image types only                                            | `POST /campaigns/:id/updates`               |
| `uploadCampaignFiles` | Fields: `thumbnail` (×1), `media` (×10), `proofDocuments` (×10); images + PDF for proof | `POST /campaigns/requests`                  |

### `error.middleware.ts`

| Export            | Handles                                                                                             |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| `errorHandler`    | `ZodError` → 400 with field errors; `AppError` subclass → appropriate status + code; uncaught → 500 |
| `notFoundHandler` | Catch-all 404 for unregistered routes                                                               |

---

## Configuration (`src/config/`)

### `database.ts` — `AppDataSource`

- Driver: PostgreSQL (`pg`)
- `synchronize`: `true` **only in `development`** (uses migrations in production)
- `logging`: `true` only in `development`
- SSL: enabled when `DB_SSL=true`
- Entity glob: `src/entities/*.{ts,js}`
- Migration glob: `src/migrations/*.{ts,js}`

### `redis.ts`

| Export        | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `redisClient` | General-purpose client (caching, refresh token storage)                 |
| `redisBullMQ` | Dedicated connection for BullMQ (requires `maxRetriesPerRequest: null`) |

Both share the same `RedisOptions` (host, port, password, optional TLS via `REDIS_TLS=true`, exponential retry strategy).

Redis key conventions:

- `refresh_token:{userId}` — stores refresh token string, TTL 30 days
- `campaign:{id}` / `campaign:v2:{id}` — serialised campaign detail, TTL 5 min
- `campaigns:{queryJson}` — serialised campaign list result, TTL 5 min

### `s3.ts`

| Export      | Value                                                           |
| ----------- | --------------------------------------------------------------- |
| `s3Client`  | `S3Client` (region from `AWS_REGION`, default `ap-southeast-1`) |
| `S3_BUCKET` | `AWS_S3_BUCKET` env var (default `scharity-storage`)            |

### `passport.ts`

Registers a single `GoogleStrategy` (passport-google-oauth20):

- Client ID / Secret / Callback URL from env
- On success: delegates to `authService.googleLogin(profile)`, returns token pair as `Express.User`

### `swagger.ts` — `swaggerSpec`

OpenAPI 3.0 spec generated via `swagger-jsdoc`. Scans JSDoc in:

- `src/routes/*.{ts,js}`
- `src/entities/*.{ts,js}`
- `src/docs/*.{ts,js}`

Configured server environments:

1. `http://localhost:{PORT}/api/v1` — Development
2. `https://scharity-backend.onrender.com/api/v1` — Staging
3. `https://api.scharity.vn/api/v1` — Production

---

## Queue / Async Processing

### Queue definition: `src/queues/email.queue.ts`

```
Queue name : email
Retry      : 3 attempts, exponential backoff (2 s base)
Cleanup    : keep 100 completed, 500 failed jobs
```

### Worker: `src/queues/processors/email.processor.ts`

Concurrency: 5. Started in-process via dynamic import in `src/app.ts`.

| Job name                          | emailService method called        | Dispatched by                                |
| --------------------------------- | --------------------------------- | -------------------------------------------- |
| `sendVerificationEmail`           | `sendVerificationEmail`           | _(available in worker; auth calls directly)_ |
| `sendPasswordResetEmail`          | `sendPasswordResetEmail`          | _(available in worker; auth calls directly)_ |
| `sendDonationReceiptEmail`        | `sendDonationReceipt`             | `DonationService.createDonation`             |
| `sendNewDonationNotification`     | `sendNewDonationNotification`     | `DonationService.createDonation`             |
| `sendCampaignApprovedEmail`       | `sendCampaignApprovedEmail`       | `AdminService.reviewCampaignRequest`         |
| `sendCampaignRejectedEmail`       | `sendCampaignRejectedEmail`       | `AdminService.reviewCampaignRequest`         |
| `sendCampaignSuspendedEmail`      | `sendCampaignSuspendedEmail`      | `AdminService.suspendCampaign`               |
| `sendWithdrawApprovedEmail`       | `sendWithdrawApprovedEmail`       | `AdminService.processWithdrawRequest`        |
| `sendWithdrawRejectedEmail`       | `sendWithdrawRejectedEmail`       | `AdminService.processWithdrawRequest`        |
| `sendCampaignUpdateNotification`  | `sendCampaignUpdateNotification`  | `CampaignService.createCampaignUpdate`       |
| `sendNewCampaignRequestEmail`     | _(no handler — dropped silently)_ | `CampaignService.createRequest`              |
| `sendWithdrawRequestNotification` | _(no handler — dropped silently)_ | `WithdrawService.createRequest`              |

> ⚠️ `sendNewCampaignRequestEmail` and `sendWithdrawRequestNotification` are enqueued but have **no corresponding `case` in the worker switch**. They will be logged as unknown jobs and silently discarded.

---

## Validation Schemas (`src/validators/`)

### `auth.validator.ts`

| Schema / Type          | Key rules                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `registerSchema`       | `email` valid format; `password` ≥8 chars, must contain uppercase + lowercase + digit; `fullName` 2–100 chars |
| `loginSchema`          | `email` valid; `password` non-empty                                                                           |
| `refreshTokenSchema`   | `refreshToken` non-empty                                                                                      |
| `forgotPasswordSchema` | `email` valid                                                                                                 |
| `resetPasswordSchema`  | `token` non-empty; `password` same strength rules as register                                                 |
| `changePasswordSchema` | `currentPassword`, `newPassword`, `confirmPassword`; `.refine` checks `newPassword === confirmPassword`       |
| `googleLoginSchema`    | `idToken` non-empty                                                                                           |

### `campaign.validator.ts`

| Schema / Type                 | Key rules                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------- | ------------------------------------- |
| `createCampaignRequestSchema` | `title` 5–100; `story` ≥50; `goalAmount` ≥1 000 000 VND; `deadline` future ISO datetime; `bankInfo` nested object |
| `reviewCampaignRequestSchema` | `action: 'approve'                                                                                                | 'reject'`; `.refine`requires`rejectReason`when action is`reject` |
| `updateCampaignSchema`        | `story` ≥50 (optional); `thumbnailUrl` valid URL (optional)                                                       |
| `suspendCampaignSchema`       | `reason` ≥10 chars                                                                                                |
| `closeCampaignSchema`         | `confirm: true` required                                                                                          |
| `campaignQuerySchema`         | `page`, `limit` string→int transforms; `sortBy` enum `createdAt                                                   | raisedAmount                                                     | deadline | goalAmount`; default `createdAt DESC` |
| `createCampaignUpdateSchema`  | `title` 5–100; `content` ≥10; `category` `UpdateCategory` enum; `isDraft` string→used as `'true'` flag            |

### `donation.validator.ts`

| Schema / Type          | Key rules                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `createDonationSchema` | `campaignId` UUID; `amount` ≥10 000 VND; `message` ≤500; `paymentMethod` default `VNPAY` |
| `donationQuerySchema`  | Pagination + `status`, `startDate`, `endDate`, `sortBy`, `sortOrder` filters             |
| `createCommentSchema`  | `campaignId` UUID; `content` 1–500; `emoji` optional; `isAnonymous` optional             |

### `admin.validator.ts`

| Schema / Type                          | Key rules                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `adminCampaignAnalyticsQuerySchema`    | `days` optional, coerced to integer within 1..365 (default 30)                                       |
| `adminCampaignTransactionsQuerySchema` | Pagination + `search`, `sortBy`, `sortOrder`, `startDate`, `endDate`; validates parseable date input |

### `user.validator.ts`

| Schema / Type             | Key rules                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `updateUserProfileSchema` | `fullName` 2–100 (optional); `phoneNumber` Vietnamese format regex (optional)             |
| `addBankAccountSchema`    | `bankName`, `accountNumber` (digits only), `accountHolderName`; `isDefault` default false |
| `reportCampaignSchema`    | `reason` enum `ReportReason`; `description` 20–2000 (optional)                            |

### `withdraw.validator.ts`

| Schema / Type                  | Key rules                                                  |
| ------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------- |
| `createWithdrawRequestSchema`  | `campaignId` UUID; `amount` positive; `bankAccountId` UUID |
| `processWithdrawRequestSchema` | `action: 'approve'                                         | 'reject'`; `.refine`requires`rejectReason` when rejecting |

---

## DTO Layer (`src/dtos/`)

Organised by domain. Each domain has `request.dto.ts`, `response.dto.ts`, `index.ts`, and optionally `mapper.ts`.

| Domain      | Notable exports                                                                                                                                                                                                                                                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth/`     | `UserPublicDto`, `TokenPairDto`, `AuthResponseDto`                                                                                                                                                                                                                                                                                 |
| `campaign/` | `CampaignDto`, `PublicCampaignDto`, `CampaignRequestResponseDto`, `CampaignUpdateResponseDto`, `CampaignDonationPublicDto`, `CampaignCommentPublicDto`, `PublicCampaignDetailResponseDto`, `CampaignAnalyticsResponseDto`, `CreatorCampaignAnalyticsResponseDto`; **`mapper.ts`** exports `mapCampaignDto`, `mapCampaignDetailDto` |
| `donation/` | `DonationResponseDto` (with `donorDisplayName` masking), `CommentResponseDto`                                                                                                                                                                                                                                                      |
| `user/`     | `BankAccountResponseDto`, `ReportBriefDto`, `ReportResponseDto`                                                                                                                                                                                                                                                                    |
| `withdraw/` | `WithdrawRequestResponseDto`                                                                                                                                                                                                                                                                                                       |
| `admin/`    | `DashboardStatsResponseDto`, `DonationChartDataPointDto`, `AdminCampaignListItemDto`, `AdminCampaignDetailDto`, `AdminCampaignAnalyticsResponseDto`, `AdminCampaignDonationResponseDto`                                                                                                                                            |
| `creator/`  | `CreatorDashboardQueryDto`, `CreatorDashboardResponseDto`                                                                                                                                                                                                                                                                          |
| `common/`   | `PaginationQueryDto`, `ApiResponseDto`, `PaginatedResponseDto`, `PaginationMetaDto`, `MessageOnlyResponseDto`                                                                                                                                                                                                                      |

See `src/dtos/DTO_USECASE_MAPPING.md` for the full DTO ↔ SRS use-case mapping table and business-rule enforcement details.

---

## Utilities (`src/utils/`)

### `errors.ts` — Custom Error Hierarchy

All extend `AppError extends Error` (has `statusCode`, `isOperational`, optional `code`).

| Class                      | HTTP | Code                                             |
| -------------------------- | ---- | ------------------------------------------------ |
| `BadRequestError`          | 400  | _(optional)_                                     |
| `UnauthorizedError`        | 401  | `UNAUTHORIZED`                                   |
| `ForbiddenError`           | 403  | `FORBIDDEN`                                      |
| `NotFoundError`            | 404  | `NOT_FOUND`                                      |
| `ConflictError`            | 409  | `CONFLICT`                                       |
| `UnprocessableEntityError` | 422  | `UNPROCESSABLE_ENTITY`                           |
| `TooManyRequestsError`     | 429  | `TOO_MANY_REQUESTS`                              |
| `InternalServerError`      | 500  | `INTERNAL_SERVER_ERROR` (`isOperational: false`) |

### `jwt.ts`

| Export                 | Secret env var       | Default TTL |
| ---------------------- | -------------------- | ----------- |
| `generateAccessToken`  | `JWT_SECRET`         | `7d`        |
| `generateRefreshToken` | `JWT_REFRESH_SECRET` | `30d`       |
| `verifyAccessToken`    | `JWT_SECRET`         | —           |
| `verifyRefreshToken`   | `JWT_REFRESH_SECRET` | —           |

### `pagination.ts`

| Export                             | Description                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `getPaginationParams(page, limit)` | Returns `{ page, limit, skip }`; clamps `limit` to 1–100 |
| `maskAccountNumber(accountNumber)` | Shows first 3 chars, replaces rest with `*`              |
| `formatCurrency(amount)`           | Formats as Vietnamese VND using `Intl.NumberFormat`      |

### `response.ts`

| Export          | Status | Description                                                                                    |
| --------------- | ------ | ---------------------------------------------------------------------------------------------- |
| `sendSuccess`   | 200    | `{ success: true, message, data }`                                                             |
| `sendCreated`   | 201    | Delegates to `sendSuccess` with 201                                                            |
| `sendNoContent` | 204    | Empty body                                                                                     |
| `sendPaginated` | 200    | `{ success, message, data, pagination: { total, page, limit, totalPages, hasNext, hasPrev } }` |

### `dto-mapper.ts`

| Export              | Maps from       | Maps to             |
| ------------------- | --------------- | ------------------- |
| `toUserPublicDto`   | `User` entity   | `UserPublicDto`     |
| `toReportBriefDto`  | `Report` entity | `ReportBriefDto`    |
| `toReportDetailDto` | `Report` entity | `ReportResponseDto` |

---

## Shared Types (`src/types/index.ts`)

| Interface            | Key fields                                                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PaginationOptions`  | `page?`, `limit?`, `sortBy?`, `sortOrder?`                                                                                                                                        |
| `PaginatedResult<T>` | `data: T[]`, `pagination: { total, page, limit, totalPages, hasNext, hasPrev }`                                                                                                   |
| `JwtPayload`         | `sub: string`, `email: string`, `role: string`, `iat?`, `exp?`                                                                                                                    |
| `RequestUser`        | `id: string`, `email: string`, `role: string` — attached to `req.user`                                                                                                            |
| `ApiResponse<T>`     | `success: boolean`, `message: string`, `data?: T`, `errors?: unknown`                                                                                                             |
| `DashboardStats`     | `totalCampaigns`, `successfulCampaigns`, `suspendedCampaigns`, `totalDonationReceived`, `totalDonationPaid`, `adminBalance`, `totalCampaignCreators`, `totalDonors`, `totalUsers` |
| `DonationChartData`  | `date: string`, `amount: number`, `count: number`                                                                                                                                 |

---

## CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

Triggers: `push` to `main` or `develop`; `pull_request` to `main`.

| Job                 | Runs when           | Steps                                                                                                      |
| ------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `lint-and-build`    | Always              | Checkout → Node 20 → `npm ci` → `npm run lint` → `npm run build`                                           |
| `docker-build-push` | Push to `main` only | Login to `ghcr.io` → Docker metadata → Build + push image (`sha-*` + `latest`)                             |
| `deploy`            | Push to `main` only | SSH into deploy host → `docker compose pull api` → `docker compose up -d --no-deps api` → prune old images |

Container registry: `ghcr.io/{owner}/{repo}/scharity-api`

---

## Deployment & Runtime Config

### Docker — `Dockerfile`

Multi-stage build:

1. **Builder** (`node:20-alpine`): `npm ci` → `tsc`
2. **Production** (`node:20-alpine`): `npm ci --omit=dev`, copies `dist/`, runs as non-root user (`nodejs:1001`), exposes port 3000, health-check via `wget /health`

### Docker Compose — `docker-compose.yml`

| Service              | Image                   | Port     | Notes                                      |
| -------------------- | ----------------------- | -------- | ------------------------------------------ |
| `api` (scharity_api) | Built from `Dockerfile` | 3000     | Depends on `postgres` + `redis` healthy    |
| `postgres`           | `postgres:16-alpine`    | internal | Data volume `postgres_data`                |
| `redis`              | `redis:7-alpine`        | internal | AOF persistence, volume `redis_data`       |
| `nginx`              | `nginx:1.25-alpine`     | 80 / 443 | Mounts `nginx/nginx.conf` + `nginx/certs/` |

All services share network `scharity_net` (bridge).

### Nginx — `nginx/nginx.conf`

- HTTP → HTTPS redirect (port 80 → 443)
- TLS 1.2 / 1.3; certs at `/etc/nginx/certs/fullchain.pem` + `privkey.pem`
- HSTS header (`max-age=63072000`)
- Client max body: 20 MB
- `client_max_body_size 20m`
- gzip enabled for JSON, JS, CSS

Nginx rate-limit zones (applied on top of Express rate limiters):

| Zone       | Rate      | Applied to                        |
| ---------- | --------- | --------------------------------- | -------- | ------ | ---------------- |
| `api`      | 100 r/min | General `/api/` proxy; burst 50   |
| `auth`     | 10 r/min  | `POST /api/v1/auth/(login         | register | forgot | reset)`; burst 5 |
| `donation` | 5 r/min   | `POST /api/v1/donations`; burst 3 |

---

## Scripts (`package.json`)

| Script                       | Command                                             |
| ---------------------------- | --------------------------------------------------- |
| `npm run dev`                | `ts-node-dev --respawn --transpile-only src/app.ts` |
| `npm run build`              | `tsc`                                               |
| `npm run start`              | `node dist/app.js`                                  |
| `npm run lint`               | `eslint src --ext .ts`                              |
| `npm run lint:fix`           | `eslint src --ext .ts --fix`                        |
| `npm run typeorm`            | `typeorm-ts-node-commonjs` (TypeORM CLI)            |
| `npm run migration:generate` | Generate a new migration diff against DB            |
| `npm run migration:run`      | Run pending migrations                              |
| `npm run migration:revert`   | Revert the last migration                           |

---

## Architecture Docs (`src/docs/`)

| File            | Contents                                     |
| --------------- | -------------------------------------------- |
| `ERD.mmd`       | Mermaid entity-relationship diagram          |
| `entities.md`   | Human-readable entity field descriptions     |
| `components.ts` | Swagger component schema definitions (JSDoc) |

See also `src/dtos/DTO_USECASE_MAPPING.md` for the full SRS use-case ↔ DTO cross-reference.
