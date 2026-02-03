<?php
/**
 * Plugin Name: HivePress Listing Requests
 * Description: Allow users to post Umrah tour requests that organizers can respond to
 * Version: 1.0.0
 * Author: Umrebuldum
 * Text Domain: hivepress-listing-requests
 * Domain Path: /languages
 * Requires Plugins: hivepress
 *
 * @package HivePress\Extensions\ListingRequests
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

// Define constants.
define( 'HPLR_VERSION', '1.0.0' );
define( 'HPLR_PATH', plugin_dir_path( __FILE__ ) );
define( 'HPLR_URL', plugin_dir_url( __FILE__ ) );

/**
 * Check HivePress dependency
 */
function hplr_check_dependencies() {
    if ( ! class_exists( 'HivePress\Core' ) ) {
        add_action( 'admin_notices', function() {
            echo '<div class="notice notice-error"><p>';
            esc_html_e( 'HivePress Listing Requests requires HivePress plugin to be installed and activated.', 'hivepress-listing-requests' );
            echo '</p></div>';
        });
        return false;
    }
    return true;
}

/**
 * Initialize the extension
 */
function hplr_init() {
    if ( ! hplr_check_dependencies() ) {
        return;
    }

    // Load text domain
    load_plugin_textdomain( 'hivepress-listing-requests', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

    // Include files
    require_once HPLR_PATH . 'includes/class-listing-request.php';
    require_once HPLR_PATH . 'includes/class-listing-request-controller.php';
    require_once HPLR_PATH . 'includes/class-listing-request-form.php';

    // Initialize components
    add_filter( 'hivepress/v1/models', 'hplr_register_models' );
    add_filter( 'hivepress/v1/forms', 'hplr_register_forms' );
    add_filter( 'hivepress/v1/controllers', 'hplr_register_controllers' );
    add_filter( 'hivepress/v1/templates', 'hplr_register_templates' );
    add_filter( 'hivepress/v1/menus', 'hplr_register_menus' );
    add_filter( 'hivepress/v1/emails', 'hplr_register_emails' );
    
    // Custom hooks
    add_action( 'hivepress/v1/models/listing_request/create', 'hplr_on_request_created', 10, 2 );
    add_action( 'hivepress/v1/models/listing_request/update', 'hplr_on_request_updated', 10, 2 );
}
add_action( 'plugins_loaded', 'hplr_init', 20 );

/**
 * Register custom post type on activation
 */
function hplr_activate() {
    // Register post type first
    register_post_type( 'hp_listing_request', [
        'public' => false,
        'show_ui' => true,
        'supports' => [ 'title', 'editor', 'author' ],
    ]);
    
    flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'hplr_activate' );

/**
 * Clean up on deactivation
 */
function hplr_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'hplr_deactivate' );

/**
 * Register listing request model
 */
function hplr_register_models( $models ) {
    $models['listing_request'] = [
        'class' => 'HivePress\Extensions\ListingRequests\Models\Listing_Request',
    ];
    return $models;
}

/**
 * Register forms
 */
function hplr_register_forms( $forms ) {
    $forms['listing_request_submit'] = [
        'class' => 'HivePress\Extensions\ListingRequests\Forms\Listing_Request_Submit',
    ];
    $forms['listing_request_respond'] = [
        'class' => 'HivePress\Extensions\ListingRequests\Forms\Listing_Request_Respond',
    ];
    return $forms;
}

/**
 * Register controllers
 */
function hplr_register_controllers( $controllers ) {
    $controllers['listing_request'] = [
        'class' => 'HivePress\Extensions\ListingRequests\Controllers\Listing_Request',
    ];
    return $controllers;
}

/**
 * Register templates
 */
function hplr_register_templates( $templates ) {
    $templates['listing_requests_view_page'] = [
        'path' => HPLR_PATH . 'templates/listing-requests-view-page.php',
    ];
    $templates['listing_request_view_page'] = [
        'path' => HPLR_PATH . 'templates/listing-request-view-page.php',
    ];
    $templates['listing_request_submit_page'] = [
        'path' => HPLR_PATH . 'templates/listing-request-submit-page.php',
    ];
    $templates['listing_request_view_block'] = [
        'path' => HPLR_PATH . 'templates/listing-request-view-block.php',
    ];
    return $templates;
}

/**
 * Register menus
 */
function hplr_register_menus( $menus ) {
    // Add to user account menu
    add_filter( 'hivepress/v1/menus/user_account', function( $menu ) {
        $menu['items']['listing_requests'] = [
            'label' => esc_html__( 'My Requests', 'hivepress-listing-requests' ),
            'url'   => hivepress()->router->get_url( 'listing_requests_view_page' ),
            '_order' => 25,
        ];
        return $menu;
    });

    // Add to vendor menu
    add_filter( 'hivepress/v1/menus/vendor_account', function( $menu ) {
        $menu['items']['incoming_requests'] = [
            'label' => esc_html__( 'Incoming Requests', 'hivepress-listing-requests' ),
            'url'   => hivepress()->router->get_url( 'listing_requests_incoming_page' ),
            '_order' => 30,
        ];
        return $menu;
    });

    return $menus;
}

/**
 * Register emails
 */
function hplr_register_emails( $emails ) {
    $emails['listing_request_submitted'] = [
        'class' => 'HivePress\Extensions\ListingRequests\Emails\Listing_Request_Submitted',
    ];
    $emails['listing_request_response'] = [
        'class' => 'HivePress\Extensions\ListingRequests\Emails\Listing_Request_Response',
    ];
    return $emails;
}

/**
 * Hook: On request created
 */
function hplr_on_request_created( $request_id, $request ) {
    // Notify admin
    $admin_email = get_option( 'admin_email' );
    
    wp_mail(
        $admin_email,
        sprintf( __( 'New Listing Request: %s', 'hivepress-listing-requests' ), $request->get_title() ),
        sprintf(
            __( "A new listing request has been submitted.\n\nTitle: %s\nUser: %s\n\nReview it here: %s", 'hivepress-listing-requests' ),
            $request->get_title(),
            $request->get_user()->get_display_name(),
            admin_url( 'post.php?post=' . $request_id . '&action=edit' )
        )
    );
    
    // Log for analytics
    do_action( 'hplr_request_created', $request_id, $request );
}

/**
 * Hook: On request updated (response added)
 */
function hplr_on_request_updated( $request_id, $request ) {
    // If status changed to responded, notify user
    if ( $request->get_status() === 'responded' ) {
        $user = $request->get_user();
        if ( $user ) {
            // Send notification email
            do_action( 'hplr_request_responded', $request_id, $request );
        }
    }
}
