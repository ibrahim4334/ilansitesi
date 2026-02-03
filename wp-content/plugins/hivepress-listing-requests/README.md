# HivePress Listing Requests Extension

A WordPress/HivePress extension that allows users to post tour requests that organizers can respond to.

## Features

- ✅ Users can submit detailed Umrah tour requests
- ✅ Organizers can view and respond to requests
- ✅ Admin moderation for request approval
- ✅ Email notifications
- ✅ REST API for headless frontend

## Installation

1. Upload the `hivepress-listing-requests` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu
3. Requires HivePress plugin to be active

## Directory Structure

```
hivepress-listing-requests/
├── hivepress-listing-requests.php    # Main plugin file
├── includes/
│   ├── class-listing-request.php             # Model (CPT + fields)
│   ├── class-listing-request-controller.php  # Routes & API
│   └── class-listing-request-form.php        # Forms
├── templates/
│   ├── listing-request-submit-page.php       # Submit form
│   ├── listing-requests-view-page.php        # List view
│   ├── listing-request-view-page.php         # Detail view
│   └── listing-request-view-block.php        # Card block
└── languages/                                 # i18n files
```

## HivePress Hooks Reference

### Filters

#### `hivepress/v1/models`
Register custom models.
```php
add_filter('hivepress/v1/models', function($models) {
    $models['listing_request'] = [
        'class' => 'Your\Namespace\Models\Listing_Request',
    ];
    return $models;
});
```

#### `hivepress/v1/forms`
Register custom forms.
```php
add_filter('hivepress/v1/forms', function($forms) {
    $forms['listing_request_submit'] = [
        'class' => 'Your\Namespace\Forms\Listing_Request_Submit',
    ];
    return $forms;
});
```

#### `hivepress/v1/controllers`
Register custom controllers (routes).
```php
add_filter('hivepress/v1/controllers', function($controllers) {
    $controllers['listing_request'] = [
        'class' => 'Your\Namespace\Controllers\Listing_Request',
    ];
    return $controllers;
});
```

#### `hivepress/v1/templates`
Register custom templates.
```php
add_filter('hivepress/v1/templates', function($templates) {
    $templates['my_template'] = [
        'path' => PLUGIN_PATH . 'templates/my-template.php',
    ];
    return $templates;
});
```

#### `hivepress/v1/menus/user_account`
Add items to user account menu.
```php
add_filter('hivepress/v1/menus/user_account', function($menu) {
    $menu['items']['my_item'] = [
        'label'  => 'My Item',
        'url'    => hivepress()->router->get_url('my_page'),
        '_order' => 25,
    ];
    return $menu;
});
```

### Actions

#### `hivepress/v1/models/listing_request/create`
Fires when a new request is created.
```php
add_action('hivepress/v1/models/listing_request/create', function($request_id, $request) {
    // Send notification, log analytics, etc.
}, 10, 2);
```

#### `hivepress/v1/models/listing_request/update`
Fires when a request is updated.
```php
add_action('hivepress/v1/models/listing_request/update', function($request_id, $request) {
    // Handle status changes
}, 10, 2);
```

#### `hivepress/v1/models/user/register`
Fires when a new user registers.
```php
add_action('hivepress/v1/models/user/register', function($user_id, $values) {
    // Custom registration logic
}, 10, 2);
```

## REST API Endpoints

### Public Endpoints

#### GET `/wp-json/hivepress/v1/listing-requests`
Get active listing requests.

**Params:**
| Param | Type | Description |
|-------|------|-------------|
| `destination` | string | Filter by destination |
| `user_id` | int | Filter by user (auth required) |

**Response:**
```json
[
  {
    "id": 123,
    "title": "Looking for family Umrah package",
    "destination": "both",
    "travel_date": "2024-03-15",
    "duration": 14,
    "travelers": 4,
    "budget_max": 3000,
    "responses": 5
  }
]
```

### Authenticated Endpoints

#### POST `/wp-json/hivepress/v1/listing-requests`
Submit a new request.

**Body:**
```json
{
  "title": "Family Umrah for Ramadan",
  "destination": "both",
  "travel_date": "2024-03-15",
  "duration": 14,
  "travelers": 4,
  "budget_min": 2000,
  "budget_max": 3000,
  "hotel_preference": "standard",
  "description": "Looking for a family-friendly package...",
  "special_requirements": "Wheelchair access needed",
  "contact_phone": "+905551234567"
}
```

#### POST `/wp-json/hivepress/v1/listing-requests/{id}/respond`
Respond to a request (vendors only).

**Body:**
```json
{
  "message": "Hello! We have the perfect package for you...",
  "listing_id": 456,
  "price_quote": 2500
}
```

## Frontend Routes

| Path | Description | Auth |
|------|-------------|------|
| `/submit-request` | Submit form | User |
| `/account/requests` | User's requests | User |
| `/account/requests/{id}` | Request detail | User/Vendor |
| `/account/incoming-requests` | Vendor inbox | Vendor |

## Admin Features

- **Post Type:** `hp_listing_request` registered under HivePress menu
- **Statuses:** Pending, Active, Responded, Closed, Expired
- **Moderation:** Admins can approve/reject requests from WP Admin

## Customization

### Override Templates

Copy template files to your theme:
```
your-theme/
└── hivepress/
    └── listing-requests/
        ├── listing-request-submit-page.php
        └── listing-requests-view-page.php
```

### Add Custom Fields

```php
add_filter('hivepress/v1/models/listing_request/fields', function($fields) {
    $fields['visa_assistance'] = [
        'label'    => 'Need Visa Assistance?',
        'type'     => 'checkbox',
        '_external' => true,
    ];
    return $fields;
});
```

### Modify Form

```php
add_filter('hivepress/v1/forms/listing_request_submit/fields', function($fields) {
    $fields['custom_field'] = [
        'label' => 'Custom Field',
        'type'  => 'text',
        '_order' => 95,
    ];
    return $fields;
});
```

## Email Notifications

The extension sends emails for:
- New request submitted (to admin)
- Request approved (to user)
- New response received (to user)

Configure email templates in **HivePress > Settings > Emails**.
