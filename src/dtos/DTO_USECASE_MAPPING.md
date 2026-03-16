# DTO ↔ Use Case Mapping

> Generated from the SRS (Mar 2026) and the `src/dtos/` directory.
> Every DTO listed below lives under `src/dtos/<feature>/request.dto.ts` or `response.dto.ts`.

---

## Common DTOs (`common/`)

| DTO                       | Purpose                                                                            | Used by                                                                |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `ApiResponseDto<T>`       | Standard JSON envelope (`success`, `message`, `data`)                              | Every endpoint                                                         |
| `PaginatedResponseDto<T>` | Paginated envelope (adds `pagination` block)                                       | Every list/table endpoint                                              |
| `PaginationMetaDto`       | Pagination metadata (`total`, `page`, `limit`, `totalPages`, `hasNext`, `hasPrev`) | Inside `PaginatedResponseDto`                                          |
| `MessageOnlyResponseDto`  | Success response with `data: null` (action confirmations)                          | Logout, forgot-password, reset-password, verify-email, change-password |
| `PaginationQueryDto`      | Shared `page` + `limit` query params                                               | All list queries inherit this shape                                    |

---

## Auth DTOs (`auth/`)

### Request DTOs

| DTO                        | Fields                                              | Use Case                                        |
| -------------------------- | --------------------------------------------------- | ----------------------------------------------- |
| `RegisterRequestDto`       | `email`, `password`, `fullName`                     | Guest → Register (implicit in 2.2/2.3 actors)   |
| `LoginRequestDto`          | `email`, `password`                                 | All actors → Login                              |
| `GoogleLoginRequestDto`    | `idToken`                                           | Guest → Google OAuth login                      |
| `RefreshTokenRequestDto`   | `refreshToken`                                      | Token rotation                                  |
| `ForgotPasswordRequestDto` | `email`                                             | Donor/Creator → Forgot password                 |
| `ResetPasswordRequestDto`  | `token`, `password`                                 | Donor/Creator → Reset password via email link   |
| `ChangePasswordRequestDto` | `currentPassword`, `newPassword`, `confirmPassword` | Donor/Creator → Change password (2.3.3 related) |
| `VerifyEmailQueryDto`      | `token` (query param)                               | Email verification link                         |

### Response DTOs

| DTO               | Fields                                                                                                                                            | Use Case                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `UserPublicDto`   | `id`, `email`, `fullName`, `role`, `status`, `avatarUrl`, `phoneNumber`, `googleId`, `isEmailVerified`, `isKycVerified`, `createdAt`, `updatedAt` | Returned by `GET /auth/me`, profile endpoints, nested inside other DTOs |
| `TokenPairDto`    | `accessToken`, `refreshToken`                                                                                                                     | Refresh token response                                                  |
| `AuthResponseDto` | `user` (UserPublicDto) + `accessToken` + `refreshToken`                                                                                           | Register, Login, Google Login responses                                 |

---

## Campaign DTOs (`campaign/`)

### Request DTOs

| DTO                              | Fields                                                                                | Use Case                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `BankInfoDto`                    | `bankName`, `accountNumber`, `accountHolderName`                                      | Nested in campaign request creation (UC 2.4.1 + 2.4.2)             |
| `SubmitCampaignRequestDto`       | `title`, `story`, `goalAmount`, `deadline`, `category?`, `bankInfo` + multipart files | **2.4.1 Request create campaign** + **2.4.2 Add bank information** |
| `UpdateCampaignRequestDto`       | `story?`, `thumbnailUrl?`                                                             | **2.4.3 RU campaign** (only when status == pending)                |
| `CampaignQueryRequestDto`        | `page?`, `limit?`, `status?`, `category?`, `search?`, `sortBy?`, `sortOrder?`         | **2.2.1 View list campaign** / **2.2.3 Browse campaign**           |
| `CreateCampaignUpdateRequestDto` | `title`, `content`, `category?` (UpdateCategory enum), `isDraft?` + multipart files   | **2.4.7 Update campaign progress**                                 |
| `CloseCampaignRequestDto`        | `confirm` (boolean)                                                                   | **2.4.5 Close campaign**                                           |
| `CampaignAnalyticsQueryDto`      | `days?`                                                                               | **2.4.4 View campaign analytics**                                  |

### Response DTOs

| DTO                                   | Fields                                                                                                                                                                 | Use Case                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `CampaignDto`                         | Full campaign object including `progressPercent` (computed), `creator?` relation                                                                                       | **2.2.1** List campaigns, **2.2.2** View detail campaign, **2.4.3** RU campaign, **2.4.5** Close campaign |
| `CampaignRequestResponseDto`          | Request fields + `requester?`, `reviewedBy?`, `bankInfo`, `proofDocuments`                                                                                             | **2.1.9** Review campaign creation request, **2.4.1** My campaign requests                                |
| `CampaignUpdateResponseDto`           | `title`, `content`, `category`, `mediaUrls`, `isEdited`, `editedAt`, `isDraft`, `creator?`                                                                             | **2.4.7** Update campaign progress (timeline view)                                                        |
| `DonationChartDataPointDto`           | `date`, `amount`, `count`                                                                                                                                              | **2.4.4** Analytics chart, **2.1.1** Dashboard chart, **2.1.5** Admin campaign details charts             |
| `CampaignAnalyticsResponseDto`        | `campaign`, `chartData[]`, `recentDonations[]` (DonationResponseDto), `totalDonors`                                                                                    | **2.4.4 View campaign analytics**                                                                         |
| `CreatorCampaignAnalyticsResponseDto` | `campaignId`, `days`, `chartData[]` (`date`, `amount`, `count`, optional `donors[]`)                                                                                   | **2.4.4 View campaign analytics (owner chart endpoint)**                                                  |
| `CreatorDashboardResponseDto`         | `summary`, `kyc`, `quickNav`, `recentDonationsToMyCampaigns`, `recentDonationsPagination`, `myCampaignsPreview`, `myCampaignsPreviewPagination`, `alerts`, `updatedAt` | **Creator dashboard aggregate endpoint**                                                                  |

---

## Donation DTOs (`donation/`)

### Request DTOs

| DTO                         | Fields                                                                          | Use Case                                                                   |
| --------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `CreateDonationRequestDto`  | `campaignId`, `amount`, `message?`, `isAnonymous?`, `paymentMethod?`            | **2.3.1 Donate** / **2.2.4 Donate as anonymous**                           |
| `DonationHistoryQueryDto`   | `page?`, `limit?`, `status?`, `startDate?`, `endDate?`, `sortBy?`, `sortOrder?` | **2.3.4 View donation history**                                            |
| `CreateCommentRequestDto`   | `campaignId`, `content`, `emoji?`, `isAnonymous?`, `donationId?`                | **2.3.2 Leave comment**                                                    |
| `CampaignDonationsQueryDto` | `page?`, `limit?`, `search?`, `sortBy?`, `sortOrder?`                           | **2.1.6 View campaign donations** (admin) / Campaign detail donations list |
| `CommentsQueryDto`          | `page?`, `limit?`, `sort?` (`newest` / `oldest` / `highest_donation`)           | **2.3.2** Comment feed sort on campaign detail                             |

### Response DTOs

| DTO                   | Fields                                                                                                                                                                                                                                                   | Use Case                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DonationResponseDto` | `id`, `amount`, `status`, `paymentMethod`, `transactionRef`, `message`, `isAnonymous`, **`donorDisplayName`** (masked when anonymous), `bankName`, **`bankAccount`** (masked: first 3 digits only), `campaign?`, `donor?`, `paymentMetadata`, timestamps | **2.3.1** Donate result, **2.3.4** Donation history, **2.1.6** Admin campaign donations, **2.1.8** Admin all transactions, **2.4.3/2.4.4** Creator recent donations |
| `CommentResponseDto`  | `id`, `content`, `emoji`, `isAnonymous`, `donor?`, `donation?`, `isEdited`, `editedAt`, timestamps                                                                                                                                                       | **2.3.2** Leave comment / Comment feed                                                                                                                              |

### Anonymous Masking Business Rules (SRS 2.2.4 / 2.3.1)

When `isAnonymous == true`:

- `donorDisplayName` → `"Nhà hảo tâm ẩn danh"`
- `donor.avatarUrl` → `null` (or default avatar URL)
- `donor.fullName` → Not exposed in public-facing DTOs
- Admin dashboard also sees anonymous — only raw DB query reveals `donorId`

---

## User DTOs (`user/`)

### Request DTOs

| DTO                           | Fields                                                             | Use Case                                                       |
| ----------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `UpdateUserProfileRequestDto` | `fullName?`, `phoneNumber?` + multipart avatar file                | **2.3.3 Update user profile**                                  |
| `AddBankAccountRequestDto`    | `bankName`, `accountNumber`, `accountHolderName`, `isDefault?`     | **2.4.2 Add bank information** (also usable from user profile) |
| `ReportCampaignRequestDto`    | `campaignId`, `reason` (enum), `description?`, **`evidenceUrls?`** | **2.3.5 Report suspicious**                                    |

### Response DTOs

| DTO                      | Fields                                                                                                                                                                | Use Case                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `UserPublicDto`          | (re-exported from auth)                                                                                                                                               | **2.3.3** Profile display                                                |
| `BankAccountResponseDto` | `id`, `bankName`, `accountNumber`, `accountHolderName`, `isDefault`, `userId`, timestamps                                                                             | **2.4.2** Bank account list, **2.4.6** Withdraw request (masked display) |
| `ReportResponseDto`      | `id`, `reason`, `description`, `evidenceUrls`, `status`, `campaignId`, **`campaign?`** (id + title + thumbnail), `reporter?`, `resolvedBy?`, `resolvedAt`, timestamps | **2.3.5** Report result, **2.1.3** Admin view reports list               |

---

## Withdraw DTOs (`withdraw/`)

### Request DTOs

| DTO                        | Fields                                  | Use Case                        |
| -------------------------- | --------------------------------------- | ------------------------------- |
| `CreateWithdrawRequestDto` | `campaignId`, `amount`, `bankAccountId` | **2.4.6 Send withdraw request** |

### Response DTOs

| DTO                          | Fields                                                                                                                                | Use Case                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `WithdrawRequestResponseDto` | `id`, `amount`, `status`, `rejectReason`, `bankInfo` (embedded), `campaign?`, `requester?`, `processedBy?`, `processedAt`, timestamps | **2.4.6** Withdraw request result, **2.1.2** Admin accept withdraw list, Admin withdraw detail |

---

## Admin DTOs (`admin/`)

### Request DTOs

| DTO                                 | Fields                                                                          | Use Case                                                |
| ----------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `ReviewCampaignRequestDto`          | `action` (`approve`/`reject`), `rejectReason?`                                  | **2.1.9 Review campaign creation request**              |
| `SuspendCampaignRequestDto`         | `reason`                                                                        | **2.1.7a Suspend campaign**                             |
| `ProcessWithdrawRequestDto`         | `action` (`approve`/`reject`), `rejectReason?`                                  | **2.1.2 Accept withdraw**                               |
| `DonationChartQueryDto`             | `interval?` (`day`/`week`/`month`), `days?`                                     | **2.1.1 View Dashboard** (chart section)                |
| `AdminCampaignRequestsQueryDto`     | `page?`, `limit?`, `status?`                                                    | **2.1.9** List pending/approved/rejected requests       |
| `AdminCampaignsQueryDto`            | `page?`, `limit?`, `status?`, `category?`, `search?`                            | **2.1.4 View list of campaigns**                        |
| `AdminWithdrawRequestsQueryDto`     | `page?`, `limit?`, `status?`                                                    | **2.1.2** List withdraw requests                        |
| `AdminReportsQueryDto`              | `page?`, `limit?`, `status?`                                                    | **2.1.3 View report** (tabs: all/unprocessed/processed) |
| `AdminTransactionsQueryDto`         | `page?`, `limit?`, `search?`, `sortOrder?`                                      | **2.1.8 View list of all donations**                    |
| `AdminCampaignTransactionsQueryDto` | `page?`, `limit?`, `search?`, `sortBy?`, `sortOrder?`, `startDate?`, `endDate?` | **2.1.5/2.1.6** Campaign-specific transaction table     |

### Response DTOs

| DTO                                 | Fields                                                                                                                                                                             | Use Case                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `DashboardStatsResponseDto`         | `totalCampaigns`, `successfulCampaigns`, `suspendedCampaigns`, `totalDonationReceived`, `totalDonationPaid`, `adminBalance`, `totalCampaignCreators`, `totalDonors`, `totalUsers`  | **2.1.1 View Dashboard** (summary cards) |
| `DonationChartDataPointDto`         | `date`, `amount`, `count`                                                                                                                                                          | **2.1.1** Dashboard chart                |
| `AdminCampaignListItemDto`          | `id`, `title`, `organizer{id,fullName}`, `status`, `progressPercent`, `raisedAmount`, `goalAmount`, `fundingProgress`, `viewDetails{campaignId,endpoint}`, `deadline`, `createdAt` | **2.1.4 View list of campaigns**         |
| `AdminCampaignDetailDto`            | Basic campaign tab projection + `publicView.endpoint` for user-side navigation                                                                                                     | **2.1.5 View campaign details (Admin)**  |
| `AdminCampaignAnalyticsResponseDto` | `campaignId`, `days`, `chartData[]` (`date`, `amount`, `count`)                                                                                                                    | **2.1.5 View campaign details (Admin)**  |

> Admin list/detail endpoints reuse domain response DTOs:
>
> - `CampaignRequestResponseDto` — UC 2.1.9
> - `WithdrawRequestResponseDto` — UC 2.1.2
> - `ReportResponseDto` — UC 2.1.3
> - `DonationResponseDto` — UC 2.1.6, 2.1.8

---

## Use Case → DTO Quick Reference

| #                 | Use Case                      | Request DTO(s)                                                                                                | Response DTO(s)                                                                                     |
| ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 2.1.1             | View Dashboard                | `DonationChartQueryDto`                                                                                       | `DashboardStatsResponseDto`, `DonationChartDataPointDto[]`                                          |
| 2.1.2             | Accept withdraw               | `ProcessWithdrawRequestDto`, `AdminWithdrawRequestsQueryDto`                                                  | `WithdrawRequestResponseDto`                                                                        |
| 2.1.3             | View report                   | `AdminReportsQueryDto`                                                                                        | `ReportResponseDto` (with `campaign`)                                                               |
| 2.1.4             | View list of campaigns        | `AdminCampaignsQueryDto`                                                                                      | `CampaignDto`                                                                                       |
| 2.1.5             | View campaign details (Admin) | `AdminCampaignTransactionsQueryDto`                                                                           | `AdminCampaignDetailDto`, `AdminCampaignAnalyticsResponseDto`, `AdminCampaignDonationResponseDto[]` |
| 2.1.6             | View campaign donations       | `CampaignDonationsQueryDto`                                                                                   | `DonationResponseDto` (masked bank account)                                                         |
| 2.1.7a            | Suspend campaign              | `SuspendCampaignRequestDto`                                                                                   | `CampaignDto`                                                                                       |
| 2.1.7b            | Unsuspend campaign            | _(none — path param only)_                                                                                    | `CampaignDto`                                                                                       |
| 2.1.8             | View all donations            | `AdminTransactionsQueryDto`                                                                                   | `DonationResponseDto`                                                                               |
| 2.1.9             | Review campaign request       | `ReviewCampaignRequestDto`, `AdminCampaignRequestsQueryDto`                                                   | `CampaignRequestResponseDto`                                                                        |
| 2.2.1             | View list campaign            | `CampaignQueryRequestDto`                                                                                     | `CampaignDto`                                                                                       |
| 2.2.2             | View detail campaign          | _(path param `:id`)_                                                                                          | `CampaignDto` (with `creator`)                                                                      |
| 2.2.3             | Browse campaign (search)      | `CampaignQueryRequestDto` (with `search`)                                                                     | `CampaignDto`                                                                                       |
| 2.2.4             | Donate as anonymous           | `CreateDonationRequestDto` (`isAnonymous: true`)                                                              | `DonationResponseDto`                                                                               |
| 2.3.1             | Donate                        | `CreateDonationRequestDto`                                                                                    | `DonationResponseDto`                                                                               |
| 2.3.2             | Leave comment                 | `CreateCommentRequestDto`, `CommentsQueryDto`                                                                 | `CommentResponseDto`                                                                                |
| 2.3.3             | Update user profile           | `UpdateUserProfileRequestDto`                                                                                 | `UserPublicDto`                                                                                     |
| 2.3.4             | View donation history         | `DonationHistoryQueryDto`                                                                                     | `DonationResponseDto` (paginated)                                                                   |
| 2.3.5             | Report suspicious             | `ReportCampaignRequestDto`                                                                                    | `ReportResponseDto`                                                                                 |
| 2.4.1             | Request create campaign       | `SubmitCampaignRequestDto` (includes `BankInfoDto`)                                                           | `CampaignRequestResponseDto`                                                                        |
| 2.4.2             | Add bank information          | `AddBankAccountRequestDto`                                                                                    | `BankAccountResponseDto`                                                                            |
| 2.4.3             | RU campaign                   | `UpdateCampaignRequestDto`                                                                                    | `CampaignDto`                                                                                       |
| 2.4.4             | View campaign analytics       | `CampaignAnalyticsQueryDto`                                                                                   | `CampaignAnalyticsResponseDto`, `CreatorCampaignAnalyticsResponseDto`                               |
| 2.4.5             | Close campaign                | `CloseCampaignRequestDto`                                                                                     | `CampaignDto`                                                                                       |
| 2.4.6             | Send withdraw request         | `CreateWithdrawRequestDto`                                                                                    | `WithdrawRequestResponseDto`                                                                        |
| 2.4.7             | Update campaign progress      | `CreateCampaignUpdateRequestDto`                                                                              | `CampaignUpdateResponseDto`                                                                         |
| Creator Dashboard | View creator dashboard        | `CreatorDashboardQueryDto` (`campaignLimit`, `donationLimit`, `campaignCursor`, `donationCursor`, `timezone`) | `CreatorDashboardResponseDto`                                                                       |

---

## Key Business Rules Enforced at DTO Level

| Rule                         | SRS Ref               | DTO / Field                                                                                                            |
| ---------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Anonymous donor masking      | 2.2.4 / 2.3.1         | `DonationResponseDto.donorDisplayName` returns "Nhà hảo tâm ẩn danh" when `isAnonymous==true`                          |
| Bank account masking         | 2.1.6                 | `DonationResponseDto.bankAccount` shows first 3 digits only                                                            |
| Campaign progress %          | 2.1.2 / 2.4.3 / 2.4.5 | `CampaignDto.progressPercent` (computed: `min(100, raisedAmount/goalAmount * 100)`)                                    |
| Report evidence upload       | 2.3.5                 | `ReportCampaignRequestDto.evidenceUrls`                                                                                |
| Reject reason required       | 2.1.2 / 2.1.9         | `ProcessWithdrawRequestDto.rejectReason`, `ReviewCampaignRequestDto.rejectReason` — required when `action == 'reject'` |
| Suspend reason required      | 2.1.7a                | `SuspendCampaignRequestDto.reason` — mandatory                                                                         |
| Campaign update immutability | 2.4.7                 | `CampaignUpdateResponseDto.isEdited` + `editedAt` — editable within 24h only, shows "Edited" label                     |
| KYC gate                     | 2.4.1 / 2.4.6         | `UserPublicDto.isKycVerified` — checked server-side before campaign creation or withdraw                               |
