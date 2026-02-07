# Emergency / Kayboldum Feature

## Overview
This feature adds an emergency help screen to the offline-exportable HTML tour files. It's designed for elderly Umrah pilgrims who may get separated from their group.

## Features

### Fixed Bottom Emergency Button
- **Text**: "🆘 Yardım / Kayboldum"
- **Style**: Red pill-shaped button, full-width, pulsing animation
- **Position**: Fixed at bottom of screen

### Fullscreen Emergency Modal
When the button is clicked, a fullscreen overlay opens with:

1. **Multilingual Static Help Text**:
   - **Turkish**: "Kayboldum. Umre grubumdan ayrıldım. Lütfen tur rehberimi arayın."
   - **English**: "I am lost. I am part of an Umrah group. Please call my tour guide."
   - **Arabic**: "أنا ضائع. أنا ضمن مجموعة عمرة. الرجاء الاتصال بمرشد الرحلة."

2. **Guide Information Display**:
   ```
   REHBER:
   {guide_name}

   TEL:
   {guide_phone}

   ORGANİZASYON:
   {agency_name}
   ```

3. **QR Code**: 
   - Encodes `tel:{guide_phone}` for quick scanning
   - Embedded as base64 (works 100% offline)
   - Generated via api.qrserver.com during export

4. **"Show This to Someone" Box**:
   - Yellow highlighted box
   - Contains full help message for someone else to read

### Language Switching
- Tabs for 🇹🇷 Türkçe, 🇬🇧 English, 🇸🇦 العربية
- Arabic content has RTL support
- Phone numbers remain LTR for readability

## Admin Configuration

### HivePress Listing Fields
Three new meta fields are added to listings:

| Field | Meta Key | Description |
|-------|----------|-------------|
| Rehber Adı | `hp_guide_name` | Tour guide's full name |
| Rehber Telefonu | `hp_guide_phone` | Guide's phone (international format) |
| Organizasyon Adı | `hp_agency_name` | Tour agency/organization name |

### Meta Box
A custom meta box "🆘 Acil Durum Bilgileri (Kayboldum)" appears in the WordPress admin sidebar when editing a listing.

## Technical Implementation

### Files Modified/Created

1. **`includes/hivepress-fields.php`** (NEW)
   - Registers HivePress listing attributes
   - Adds admin meta box for emergency info

2. **`includes/qr-generator.php`** (NEW)
   - `QR_Generator::generate_base64($data, $size)` - Generic QR generation
   - `QR_Generator::generate_for_phone($phone, $size)` - Phone-specific QR
   - `QR_Generator::generate_cached($data, $size, $expiry)` - Cached version
   - Fallback SVG if QR API fails

3. **`umrebuldum-tour-export.php`** (UPDATED)
   - Includes new files
   - Adds `hp_agency_name` to export data
   - Generates QR code during export
   - Applies `ute_export_data` filter for extensibility

4. **`templates/offline-tour.php`** (UPDATED)
   - Emergency FAB with text "Yardım / Kayboldum"
   - Complete emergency modal rewrite
   - QR code section CSS
   - Agency card CSS

## Data Flow

```
WordPress Admin
      │
      ▼
Edit Listing → Save Guide Info → Meta saved as hp_guide_*, hp_agency_*
      │
      ▼
Export Click → gather_listing_data() → Get meta values
      │
      ▼
QR_Generator::generate_for_phone() → Fetch from api.qrserver.com
      │
      ▼
Base64 encode → Embed in HTML → Download offline file
```

## Constraints Met

- ✅ **100% Offline**: All data embedded inline, QR as base64
- ✅ **No GPS/Tracking**: Information display only
- ✅ **No External APIs in offline HTML**: QR fetched during export, not at runtime
- ✅ **Mobile-first UI**: Full-width button, large touch targets
- ✅ **Large Fonts for Elderly**: 1.25rem+ font sizes
- ✅ **Fully Reversible**: No DB schema changes, only meta values

## Usage

1. Go to WordPress Admin → Listings → Edit a listing
2. Fill in "Acil Durum Bilgileri" meta box:
   - Rehber Adı: "Ahmet Yılmaz"
   - Rehber Telefonu: "+90 532 123 4567"
   - Organizasyon: "ABC Umre Turizm"
3. Save the listing
4. Click "📄 Offline PDF İndir" on the listing page
5. The exported HTML will include the emergency button with all info

## Filter Hook

Developers can modify export data:

```php
add_filter( 'ute_export_data', function( $data, $listing ) {
    // Add custom data
    $data['emergency_email'] = 'help@example.com';
    return $data;
}, 10, 2 );
```
