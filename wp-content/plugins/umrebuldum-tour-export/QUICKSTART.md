# Quick Start Guide - 3-Tier Monetization

## 5-Minute Setup

### Step 1: Enable Monetization
1. Go to WordPress Admin → **HivePress** → **Tour Export Ayarlar**
2. Check **"Etkinleştir"** under "Plan Sistemi"
3. Click **"Ayarları Kaydet"**

✅ System is now active (all users are FREE by default)

---

### Step 2: Create WooCommerce Products (Optional)

#### For PLUS Tier:
1. Go to **Products** → **Add New**
2. Name: "Tour Export PLUS"
3. Price: e.g., 299 TL
4. Description: List PLUS features
5. Publish

#### For PRO Tier:
1. Go to **Products** → **Add New**
2. Name: "Tour Export PRO"
3. Price: e.g., 999 TL
4. Description: List PRO features
5. Publish

---

### Step 3: Connect Products to Tiers
1. Return to **HivePress** → **Tour Export Ayarlar**
2. Under "WooCommerce Entegrasyonu":
   - Select PLUS product from dropdown
   - Select PRO product from dropdown
3. Click **"Ayarları Kaydet"**

✅ Tiers now active. Users who purchase get upgraded.

---

## How It Works

### FREE Users (Default)
- Can export 5 times per day
- See usage bar: `[====.] 4/5 used`
- Get upsell prompts
- Export quality: 60%

### PLUS Users (After Purchase)
- Automatic detection via purchase history
- Unlimited exports
- No watermark
- Quality: 85%
- Emergency features enabled

### PRO Users (After Purchase)
- All PLUS features
- Quality: 100%
- Future: Custom branding, analytics

---

## Testing

### Test FREE Tier:
1. Log out or use incognito
2. Try to export 6 times
3. 6th attempt → "Quota exceeded" page

### Test PLUS Tier:
1. Create test user
2. Manually complete test order for PLUS product
3. Log in as test user
4. Export → unlimited, no quota

### Test PRO Tier:
1. Same as PLUS but use PRO product
2. Log in as test user
3. Export → quality=100, all features

---

## Disable Monetization
1. Go to **Tour Export Ayarlar**
2. Uncheck **"Plan Sistemi"**
3. Save

✅ All users now have PRO access (free mode)

---

## Troubleshooting

### "I don't see usage bar"
- Only shows for FREE tier logged-in users
- Only shows on Dashboard/Listings pages
- Check if monetization is enabled

### "Purchased user still FREE"
- Check WooCommerce order is "Completed"
- Verify correct product ID in settings
- Try logging out and back in

### "Want to give someone PLUS access manually"
- Go to WooCommerce → Orders
- Create manual order for the user
- Add PLUS product
- Mark as "Completed"

---

## Quick Reference

| Action | Location |
|--------|----------|
| Enable system | HivePress → Tour Export Ayarlar |
| Set product IDs | Same settings page |
| View usage | Dashboard (auto-shows for FREE users) |
| Grant manual access | WooCommerce → Orders → Create |
| Disable system | Uncheck "Plan Sistemi" |

---

## Default Behavior

**Monetization OFF:**
- Everyone = PRO
- No limits
- No notices

**Monetization ON + No Products Set:**
- Everyone = FREE tier
- 5/day quota enforced
- Upsells link to settings page

**Monetization ON + Products Set:**
- FREE = Default
- PLUS = After product purchase
- PRO = After product purchase
- Upsells link to WooCommerce product pages

---

## Support

**Settings:** `wp-admin/admin.php?page=umrebuldum-tour-export-settings`
**Full docs:** `MONETIZATION.md`
**Implementation:** `IMPLEMENTATION_SUMMARY.md`
