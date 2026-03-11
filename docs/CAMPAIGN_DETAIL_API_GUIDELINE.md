# Campaign Detail API Implementation Guideline

Last updated: 2026-03-10

## Purpose
This guideline defines the backend contract for campaign detail retrieval, including what related resources are included and how each field is transformed for public API responses.

## Endpoint
- Method: GET
- Path: /api/v1/campaigns/:id
- Auth: Optional (public endpoint)
- Controller entry: src/controllers/campaign.controller.ts (getCampaign)
- Service entry: src/services/campaign.service.ts (getCampaignById)
- Mapper entry: src/dtos/campaign/mapper.ts (mapCampaignDetailDto)
- DTO contract: src/dtos/campaign/response.dto.ts (PublicCampaignDetailResponseDto)

## Response Envelope
The endpoint returns the standard API response envelope:
- success: boolean
- message: string
- data: PublicCampaignDetailResponseDto

## Data Object: PublicCampaignDetailResponseDto
The response data contains base campaign fields plus embedded donations, updates, and comments.

### Base Campaign Fields
- id: string
- title: string
- story: string
- goalAmount: number
- raisedAmount: number
- progressPercent: number (computed by entity getter)
- deadline: Date
- status: CampaignStatus
- category: CampaignCategory
- thumbnailUrl: string | null
- mediaUrls: string[] | null
- suspendReason: string | null
- suspendedAt: Date | null
- closedAt: Date | null
- approvedAt: Date | null
- donorCount: number
- creatorId: string
- creator?: UserPublicDto
- createdAt: Date
- updatedAt: Date

Note:
- reportCount is intentionally not returned in PublicCampaignDto.

## Included Related Collections
The detail endpoint auto-includes all of these:

### 1) donations: CampaignDonationPublicDto[]
Source query behavior:
- campaignId matches path id
- status is limited to success only
- sorted by createdAt DESC
- donor relation is loaded

Returned donation fields:
- id, amount, status, paymentMethod, transactionRef, message
- isAnonymous
- donorDisplayName (if anonymous: "Nhà hảo tâm ẩn danh", else donor full name)
- bankName
- bankAccount (masked: first 3 chars + 5 asterisks)
- campaignId, donorId, donor, paymentMetadata
- createdAt, updatedAt

### 2) updates: CampaignUpdateResponseDto[]
Source query behavior:
- campaignId matches path id
- only non-draft updates are returned (isDraft = false)
- sorted by createdAt DESC
- creator relation is loaded

Returned update fields:
- id, title, content, category, mediaUrls
- isEdited, editedAt, isDraft
- campaignId, creatorId, creator
- createdAt, updatedAt

### 3) comments: CampaignCommentPublicDto[]
Source query behavior:
- campaignId matches path id
- sorted by createdAt DESC
- donor and donation relations are loaded

Returned comment fields:
- id, content, emoji, isAnonymous
- campaignId, donorId, donor
- donationId
- donation (compact): id, amount, status, createdAt
- isEdited, editedAt
- createdAt, updatedAt

## Caching Behavior
- Cache key: campaign:v2:{id}
- TTL: 300 seconds
- Cached payload is the enriched campaign object before controller mapping
- On cache hit, service returns the cached enriched object; controller still maps it to public DTO shape

## Not Found Behavior
If campaign id does not exist:
- Throws NotFoundError in service
- API returns 404 through global error middleware

## End-to-End Flow
1. Route receives GET /campaigns/:id
2. Controller calls campaignService.getCampaignById(id)
3. Service reads cache; if miss, loads campaign + donations + updates + comments
4. Service stores enriched payload in Redis
5. Controller maps payload via mapCampaignDetailDto
6. Controller returns sendSuccess with mapped PublicCampaignDetailResponseDto

## Implementation Checklist
- Ensure campaign exists before loading related collections
- Keep donation filter at success only for public detail pages
- Keep update filter at non-draft only
- Keep comment sorting newest-first
- Always pass response through mapCampaignDetailDto before returning
- Keep masking logic in mapper (not in controller)
- When changing data shape, bump cache key version (example: campaign:v3:{id})

## Example Response (shape)
{
  "success": true,
  "message": "Success",
  "data": {
    "id": "campaign-uuid",
    "title": "Help build a village school",
    "story": "...",
    "goalAmount": 100000000,
    "raisedAmount": 45000000,
    "progressPercent": 45,
    "deadline": "2026-05-30T00:00:00.000Z",
    "status": "active",
    "category": "education",
    "thumbnailUrl": "https://...",
    "mediaUrls": ["https://..."],
    "suspendReason": null,
    "suspendedAt": null,
    "closedAt": null,
    "approvedAt": "2026-02-01T00:00:00.000Z",
    "donorCount": 230,
    "creatorId": "user-uuid",
    "creator": {
      "id": "user-uuid",
      "email": "creator@example.com",
      "fullName": "Creator Name",
      "role": "user",
      "status": "active",
      "avatarUrl": null,
      "phoneNumber": null,
      "googleId": null,
      "isEmailVerified": true,
      "isKycVerified": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-02-01T00:00:00.000Z"
    },
    "donations": [],
    "updates": [],
    "comments": [],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-03-10T00:00:00.000Z"
  }
}
