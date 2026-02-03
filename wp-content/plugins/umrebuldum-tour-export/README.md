# Umrebuldum Tour Export

WordPress plugin to export Umrah tour plans as offline-ready single HTML files.

## Features

- ✅ **Single HTML File** - No external CSS, JS, or images required
- ✅ **100% Offline** - Works without internet connection
- ✅ **Base64 Images** - All images embedded in the HTML
- ✅ **Mobile Responsive** - Optimized for phone screens
- ✅ **Print Ready** - Clean print styles included
- ✅ **Day-by-Day Itinerary** - Full program breakdown
- ✅ **Text-based Locations** - No map dependencies

## Installation

1. Upload `umrebuldum-tour-export` folder to `/wp-content/plugins/`
2. Activate the plugin
3. Access via **HivePress > Tour Export**

## Usage

### Admin Panel

1. Go to **HivePress > Tour Export**
2. Select a tour from the dropdown
3. Click **Download HTML**

### On Listing Pages

An "Offline PDF İndir" button is automatically added to listing pages.

### Direct URL

```
/wp-admin/admin-ajax.php?action=ute_export_tour&listing_id=123
```

### Shortcode

```php
[tour_export listing_id="123" label="Download Tour Plan"]
```

## Exported HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
    <style>/* All CSS inline */</style>
</head>
<body>
    <!-- Header with tour title -->
    <!-- Featured image (base64) -->
    <!-- Quick info grid (duration, dates, departure) -->
    <!-- Price section -->
    <!-- Hotels section -->
    <!-- Day-by-day itinerary -->
    <!-- Included/Not included lists -->
    <!-- Gallery (base64 images) -->
    <!-- Organizer contact info -->
    <!-- Footer with source URL -->
</body>
</html>
```

## Customization

### Override Template

Copy `templates/offline-tour.php` to your theme:

```
your-theme/umrebuldum-tour-export/offline-tour.php
```

### Modify CSS

Edit the `<style>` block in `templates/offline-tour.php`

### Add Custom Fields

Filter the data before export:

```php
add_filter( 'ute_export_data', function( $data, $listing_id ) {
    $data['custom_field'] = get_post_meta( $listing_id, 'my_field', true );
    return $data;
}, 10, 2 );
```

## Image Handling

- Images are resized to max 400px (configurable)
- Converted to base64 for embedding
- Gallery limited to 5 images to reduce file size
- Vendor logos resized to 100px

## File Size Optimization

Typical export sizes:
- Text only: ~30KB
- With 1 image: ~100KB
- With 5 gallery images: ~400KB

## Browser Compatibility

- Chrome, Firefox, Safari, Edge (latest versions)
- iOS Safari (mobile)
- Android Chrome (mobile)

## Print Support

Press `Ctrl+P` (or `Cmd+P` on Mac) to print:
- Optimized for A4 paper
- Page breaks between days
- Background colors preserved

## Localization

Turkish (`tr_TR`) is the default language. Add translations in:
```
plugins/umrebuldum-tour-export/languages/
```

## Hooks

### Actions

```php
// Before export
do_action( 'ute_before_export', $listing_id );

// After export
do_action( 'ute_after_export', $listing_id, $html );
```

### Filters

```php
// Modify export data
add_filter( 'ute_export_data', function( $data, $listing_id ) {
    return $data;
}, 10, 2 );

// Modify HTML output
add_filter( 'ute_export_html', function( $html, $data ) {
    return $html;
}, 10, 2 );

// Change image max dimension
add_filter( 'ute_max_image_dimension', function( $size ) {
    return 600; // pixels
});
```

## Changelog

### 1.0.0
- Initial release
- Single-file HTML export
- Base64 image embedding
- Mobile-responsive template
- Day-by-day itinerary support
- Organizer contact info
