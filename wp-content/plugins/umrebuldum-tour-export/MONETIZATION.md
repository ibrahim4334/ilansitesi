# 3-Tier Monetization System

## Architecture: Backend-Driven Frontend

The system strictly follows a **Backend-as-Source-of-Truth** architecture. The Frontend contains NO business logic, subscription rules, or hardcoded limits.

### Source of Truth
**Endpoint:** `GET /wp-json/umrebuldum/v1/access`

**Response Structure:**
```json
{
  "tier": "plus",           // "free" | "plus" | "pro"
  "tier_name": "PLUS",      // Display name
  "daily_limit": null,      // Request limit (null = unlimited)
  "daily_used": 12,         // Requests used today
  "can_generate": true,     // Request permission
  "quality": 85,            // 60 | 85 | 100
  "watermark": false,       // true | false
  "emergency": true,        // true | false
  "features": {             // Feature flags
    "custom_branding": false,
    "qr_emergency": true
    // ...
  }
}
```

## Backend Plans (PHP)

Managed in `includes/access-control.php`.

### FREE
- **Limit:** 5 posters/day
- **Quality:** 60%
- **Watermark:** Yes
- **Emergency Screen:** No

### PLUS
- **Limit:** Unlimited
- **Quality:** 85%
- **Watermark:** No
- **Emergency Screen:** Yes

### PRO
- **Limit:** Unlimited
- **Quality:** 100%
- **Watermark:** No
- **Emergency Screen:** Yes
- **Agency Features:** Yes

## Frontend (React/Next.js)

**Path:** `frontend/components/monetization`

1. **`BackendSyncedComponents.tsx`**:
   - Fetches data from `/access`
   - Renders `QuotaStatus` based on `daily_limit`
   - Renders `PricingTable` based on valid tiers

2. **`tier-config.ts`**:
   - Defines strict Types for API response
   - Contains **Display Configuration** (Turkish strings, descriptions) only.
   - NO LIMIT LOGIC here.

## Plan Synchronization

To change a plan's limit or feature:
1. Edit `includes/access-control.php` in Backend.
2. Frontend automatically reflects the change via API.

## Removal of Legacy Limits

- Removed "Listing limits" (3 listings, 15 listings etc.)
- Removed "Monthly limits"
- Removed "Request limits"

The system now relies solely on **Posters per Day** quota defined in backend.
