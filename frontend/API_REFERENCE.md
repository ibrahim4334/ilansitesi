# Umrebuldum REST API Guide

## Base URLs

| Namespace | Base URL | Description |
|-----------|----------|-------------|
| **HivePress** | `/wp-json/hivepress/v1` | Core listing/user management |
| **Umrebuldum** | `/wp-json/umrebuldum/v1` | Custom poster & health endpoints |
| **WordPress** | `/wp-json/wp/v2` | Standard WP REST API |

---

## 1. LISTINGS (HivePress)

### GET /hivepress/v1/listings
Get listings (admin only, for autocomplete).

**Auth:** Required (edit_others_posts)

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | Yes | Search query (min 3 chars) |
| `context` | string | No | `list` for id/text format |

**Response:**
```json
[
  { "id": 123, "text": "Lüks Umre Turu" },
  { "id": 456, "text": "Ekonomik Paket" }
]
```

---

### POST /hivepress/v1/listings/{listing_id}
Update a listing.

**Auth:** Required (owner or admin)

**Path Params:**
| Param | Type | Description |
|-------|------|-------------|
| `listing_id` | integer | Listing ID |

**Body:** Listing fields (title, description, custom attributes)

**Response:**
```json
{ "id": 123 }
```

---

### POST /hivepress/v1/listings/{listing_id}/hide
Toggle listing visibility (publish/draft).

**Auth:** Required (owner)

**Response:**
```json
{ "id": 123 }
```

---

### POST /hivepress/v1/listings/{listing_id}/report
Report a listing to admin.

**Auth:** Required

**Body:**
```json
{ "details": "İçerik uygunsuz" }
```

---

### DELETE /hivepress/v1/listings/{listing_id}
Delete (trash) a listing.

**Auth:** Required (owner or admin)

**Response:** `204 No Content`

---

## 2. USERS (HivePress)

### POST /hivepress/v1/users
Register a new user.

**Auth:** None

**Body:**
```json
{
  "username": "ahmet123",
  "email": "ahmet@example.com",
  "password": "securepass"
}
```

**Response:**
```json
{ "id": 789 }
```

---

### POST /hivepress/v1/users/login
Authenticate user.

**Auth:** None

**Body:**
```json
{
  "username_or_email": "ahmet@example.com",
  "password": "securepass"
}
```

**Response:**
```json
{ "id": 789 }
```

**Note:** Sets WordPress auth cookie on success.

---

### POST /hivepress/v1/users/request-password
Request password reset email.

**Body:**
```json
{
  "username_or_email": "ahmet@example.com"
}
```

---

### POST /hivepress/v1/users/reset-password
Reset password with token.

**Body:**
```json
{
  "username": "ahmet123",
  "password": "newpass",
  "password_reset_key": "abc123token"
}
```

---

### POST /hivepress/v1/users/{user_id}
Update user profile.

**Auth:** Required (self or admin)

**Body:** User fields (email, password, etc.)

---

### DELETE /hivepress/v1/users/{user_id}
Delete user account.

**Auth:** Required (self or admin)

**Body:**
```json
{ "password": "currentpass" }
```

---

## 3. POSTER GENERATOR (Umrebuldum Custom)

### POST /umrebuldum/v1/poster/generate
Generate a poster for a listing.

**Auth:** Required (edit_posts)

**Body:**
```json
{
  "listing_id": 123,
  "template": "default",
  "size": "instagram",
  "force": false
}
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `listing_id` | integer | - | Required. Listing ID |
| `template` | string | `default` | Template name |
| `size` | string | `instagram` | Output size preset |
| `force` | boolean | `false` | Force regeneration |

**Response:**
```json
{
  "success": true,
  "poster_url": "https://example.com/wp-content/uploads/posters/123.webp",
  "cached": false,
  "render_time_ms": 245
}
```

---

### GET /umrebuldum/v1/poster/{id}
Get poster for a listing.

**Auth:** None (public)

**Response:**
```json
{
  "success": true,
  "exists": true,
  "poster_url": "https://...",
  "generated_at": "2024-01-15 10:30:00"
}
```

---

### DELETE /umrebuldum/v1/poster/{id}
Delete cached poster.

**Auth:** Required (edit_posts)

---

### GET /umrebuldum/v1/poster/templates
List available templates.

**Auth:** None (public)

**Response:**
```json
{
  "templates": [
    {
      "id": "default",
      "name": "Varsayılan",
      "pro_only": false
    },
    {
      "id": "premium_gold",
      "name": "Gold Premium",
      "pro_only": true
    }
  ]
}
```

---

### GET /umrebuldum/v1/poster/status
Get generation status and stats.

**Auth:** Required (edit_posts)

---

### GET /umrebuldum/v1/poster/cache/stats
Get cache statistics.

**Auth:** Required (manage_options)

---

### POST /umrebuldum/v1/poster/cache/cleanup
Clean up old cached files.

**Auth:** Required (manage_options)

---

## 4. USER TIER (Umrebuldum Custom)

### GET /umrebuldum/v1/user/tier
Get current user's subscription tier.

**Auth:** None (works for logged-out users too)

**Response:**
```json
{
  "success": true,
  "tier": "free",
  "is_pro": false,
  "poster_count": 3,
  "remaining": 2,
  "limits": {
    "free_poster_limit": 5,
    "free_templates": ["default", "minimal"]
  }
}
```

---

## 5. SYSTEM HEALTH (Umrebuldum Custom)

### GET /umrebuldum/v1/health
Get system health status.

**Auth:** None (public)

**Response:**
```json
{
  "status": "OK",
  "issues": [],
  "timestamp": 1705312200,
  "core": {
    "plugin_version": "2.0.0",
    "php_version": "8.1.27",
    "wp_version": "6.4.2",
    "memory_limit": "256M",
    "gd_available": true,
    "webp_supported": true
  },
  "cache": {
    "cache_dir_exists": true,
    "cache_writable": true,
    "cache_total_files": 47,
    "cache_total_size_mb": 12.34,
    "oldest_cache_file_age_hours": 168.5
  },
  "errors": {
    "total_errors": 3,
    "errors_by_type": {
      "rate_limited": 2,
      "quota_exceeded": 1
    },
    "critical_errors": 0
  },
  "performance": {
    "avg_render_time_ms": 245.3,
    "cache_hit_ratio": 72.5,
    "total_renders_today": 156
  },
  "monetization": {
    "woo_active": true,
    "subscriptions_active": true,
    "pro_product_id_set": true,
    "pro_users_count": 8
  },
  "insights": [
    {
      "type": "opportunity",
      "title": "Yüksek Free Kullanımı",
      "message": "Kullanıcıların %85 kadarı Free planda.",
      "action": "Limitleri sıkılaştırarak dönüşüm artırılabilir."
    }
  ]
}
```

**Status Codes:**
| Status | HTTP | Meaning |
|--------|------|---------|
| `OK` | 200 | All systems operational |
| `DEGRADED` | 200 | Working but performance issues |
| `FAIL` | 503 | Critical component failure |

---

## 6. WORDPRESS CORE (wp/v2)

### GET /wp/v2/hp_listing
Get listings via standard WP REST.

**Params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search term |
| `page` | integer | Page number |
| `per_page` | integer | Items per page (max 100) |
| `categories` | array | Category IDs |
| `orderby` | string | `date`, `title`, `meta_value` |

**Response:** Array of listing post objects

---

### GET /wp/v2/hp_listing/{id}
Get single listing.

---

### GET /wp/v2/hp_listing_category
Get listing categories.

---

### GET /wp/v2/hp_vendor
Get vendors (organizers).

---

## Authentication Notes

### Cookie Auth (Browser)
For browser-based requests, WordPress nonce is required:
```js
fetch('/wp-json/umrebuldum/v1/poster/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-WP-Nonce': wpApiSettings.nonce
  },
  body: JSON.stringify({ listing_id: 123 })
});
```

### Application Passwords
For external apps, use Basic Auth with Application Password:
```
Authorization: Basic base64(username:app_password)
```

---

## Error Response Format

All errors return:
```json
{
  "code": "error_code",
  "message": "Human readable message",
  "data": {
    "status": 400
  }
}
```

Common codes:
| Code | HTTP | Meaning |
|------|------|---------|
| `rest_forbidden` | 403 | Permission denied |
| `rest_not_found` | 404 | Resource not found |
| `rest_invalid_param` | 400 | Validation error |
| `quota_exceeded` | 429 | Rate/quota limit |

---

## Frontend Integration Example

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_WP_API || 'https://umrebuldum.com/wp-json';

// Public listing fetch (no auth)
export async function getListings(params: {
  search?: string;
  page?: number;
  per_page?: number;
}) {
  const url = new URL(`${API_BASE}/wp/v2/hp_listing`);
  if (params.search) url.searchParams.set('search', params.search);
  if (params.page) url.searchParams.set('page', String(params.page));
  if (params.per_page) url.searchParams.set('per_page', String(params.per_page));
  
  const res = await fetch(url.toString());
  return res.json();
}

// User login
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/hivepress/v1/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ username_or_email: email, password })
  });
  return res.json();
}

// Get user tier (public)
export async function getUserTier() {
  const res = await fetch(`${API_BASE}/umrebuldum/v1/user/tier`, {
    credentials: 'include'
  });
  return res.json();
}
```
