<?php
/**
 * REST API Endpoints for Access Control
 * 
 * @package Umrebuldum\TourExport
 */

namespace Umrebuldum\TourExport;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * REST API Class
 */
class REST_API {

    /**
     * Instance
     */
    private static $instance = null;

    /**
     * Namespace
     */
    const NAMESPACE = 'umrebuldum/v1';

    /**
     * Get instance
     */
    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        add_action( 'rest_api_init', [ $this, 'register_routes' ] );
    }

    /**
     * Register REST routes
     */
    public function register_routes() {
        // Get user access info
        register_rest_route( self::NAMESPACE, '/access', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_access_info' ],
            'permission_callback' => function() {
                return is_user_logged_in();
            },
        ] );

        // Get quota status
        register_rest_route( self::NAMESPACE, '/quota', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_quota_status' ],
            'permission_callback' => function() {
                return is_user_logged_in();
            },
        ] );

        // Get upgrade offers
        register_rest_route( self::NAMESPACE, '/offers/(?P<type>[a-z-]+)', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_upgrade_offer' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'type' => [
                    'required'          => true,
                    'validate_callback' => function( $param ) {
                        return in_array( $param, [ 'quality', 'quota', 'emergency', 'watermark', 'branding' ], true );
                    },
                ],
            ],
        ] );

        // Get tier features
        register_rest_route( self::NAMESPACE, '/tiers', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_all_tiers' ],
            'permission_callback' => '__return_true',
        ] );

        // Auth & Sync user
        register_rest_route( self::NAMESPACE, '/auth', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'auth_user' ],
            'permission_callback' => '__return_true', // Public endpoint (secure with secret if needed, but social auth relies on provider token via front)
            'args'                => [
                'email'       => [ 'required' => true, 'validate_callback' => function($p) { return is_email($p); } ],
                'name'        => [ 'required' => false ],
                'provider'    => [ 'required' => false ],
                'role'        => [ 
                    'required' => false,
                    'validate_callback' => function($p) { 
                        return in_array( $p, [ 'umreci', 'rehber', 'organizasyon' ], true ); 
                    }
                ],
            ],
        ] );

    /**
     * Get user access info
     * Single source of truth endpoint
     */
    public function get_access_info( $request ) {
        $access = Access_Control::get_instance();
        $user_id = get_current_user_id();
        
        $tier = $access->get_user_tier( $user_id );
        $quota = $access->check_quota( $user_id );
        $quality = $access->get_quality_level( $user_id );

        // Build response
        $response = [
            'tier'          => $tier,
            'tier_name'     => $access->get_tier_name( $tier ),
            'daily_limit'   => $tier === Access_Control::TIER_FREE ? Access_Control::QUOTA_FREE : null,
            'daily_used'    => $tier === Access_Control::TIER_FREE ? $quota['used'] : 0,
            'can_generate'  => $quota['allowed'],
            'quality'       => $quality,
            'watermark'     => ! $access->has_feature( 'no_watermark', $user_id ),
            'emergency'     => $access->has_feature( 'emergency_screen', $user_id ),
            'features'      => [
                'high_quality'      => $access->has_feature( 'high_quality', $user_id ),
                'unlimited_exports' => $access->has_feature( 'unlimited_exports', $user_id ),
                'guide_info'        => $access->has_feature( 'guide_info', $user_id ),
                'qr_emergency'      => $access->has_feature( 'qr_emergency', $user_id ),
                'custom_branding'   => $access->has_feature( 'custom_branding', $user_id ),
                'organization_logo' => $access->has_feature( 'organization_logo', $user_id ),
                'multiple_tours'    => $access->has_feature( 'multiple_tours', $user_id ),
                'youtube_embeds'    => $access->has_feature( 'youtube_embeds', $user_id ),
                'analytics_hooks'   => $access->has_feature( 'analytics_hooks', $user_id ),
            ],
        ];

        return rest_ensure_response( $response );
    }

    /**
     * Get quota status
     */
    public function get_quota_status( $request ) {
        $access = Access_Control::get_instance();
        $user_id = get_current_user_id();
        
        $quota = $access->check_quota( $user_id );

        return rest_ensure_response( $quota );
    }

    /**
     * Get upgrade offer
     */
    public function get_upgrade_offer( $request ) {
        $type = $request->get_param( 'type' );
        $offer_engine = Offer_Engine::get_instance();

        switch ( $type ) {
            case 'quality':
                $offer = $offer_engine->get_quality_upsell();
                break;
            case 'quota':
                $access = Access_Control::get_instance();
                $quota = $access->check_quota();
                $offer = $offer_engine->get_quota_exceeded( $quota['used'], $quota['limit'] );
                break;
            case 'emergency':
                $offer = $offer_engine->get_emergency_upsell();
                break;
            case 'watermark':
                $offer = $offer_engine->get_watermark_upsell();
                break;
            case 'branding':
                $offer = $offer_engine->get_branding_upsell();
                break;
            default:
                return new \WP_Error( 'invalid_type', 'Geçersiz teklif tipi', [ 'status' => 400 ] );
        }

        return rest_ensure_response( $offer );
    }

    /**
     * Get all tier configurations
     */
    public function get_all_tiers( $request ) {
        $access = Access_Control::get_instance();

        $tiers = [
            Access_Control::TIER_FREE => [
                'id'          => Access_Control::TIER_FREE,
                'name'        => $access->get_tier_name( Access_Control::TIER_FREE ),
                'daily_limit' => Access_Control::QUOTA_FREE,
                'quality'     => $access->get_quality_level( 0 ), // Guest user = FREE
                'price'       => 0,
                'features'    => $access->get_tier_features( Access_Control::TIER_FREE ),
            ],
            Access_Control::TIER_PLUS => [
                'id'          => Access_Control::TIER_PLUS,
                'name'        => $access->get_tier_name( Access_Control::TIER_PLUS ),
                'daily_limit' => null, // unlimited
                'quality'     => 85,
                'price'       => 299, // ₺299
                'features'    => $access->get_tier_features( Access_Control::TIER_PLUS ),
            ],
            Access_Control::TIER_PRO => [
                'id'          => Access_Control::TIER_PRO,
                'name'        => $access->get_tier_name( Access_Control::TIER_PRO ),
                'daily_limit' => null, // unlimited
                'quality'     => 100,
                'price'       => 999, // ₺999
                'features'    => $access->get_tier_features( Access_Control::TIER_PRO ),
            ],
        ];

        return rest_ensure_response( $tiers );
    }


    /**
     * Authenticate or Create User from Social Login
     */
    public function auth_user( $request ) {
        $email    = sanitize_email( $request->get_param( 'email' ) );
        $name     = sanitize_text_field( $request->get_param( 'name' ) );
        $role     = sanitize_text_field( $request->get_param( 'role' ) );
        $provider = sanitize_text_field( $request->get_param( 'provider' ) );

        $user = get_user_by( 'email', $email );

        // Scenario 1: User does not exist
        if ( ! $user ) {
            // If role is missing, require onboarding
            if ( empty( $role ) ) {
                return rest_ensure_response( [
                    'success'             => false,
                    'code'                => 'requires_onboarding',
                    'requires_onboarding' => true,
                    'message'             => 'Role selection required',
                ] );
            }

            // Create new user
            $password = wp_generate_password( 24, true );
            $user_id  = wp_create_user( $email, $password, $email );

            if ( is_wp_error( $user_id ) ) {
                return new \WP_Error( 'create_failed', $user_id->get_error_message(), [ 'status' => 500 ] );
            }

            $user = get_user_by( 'id', $user_id );

            // Update details
            if ( ! empty( $name ) ) {
                wp_update_user( [ 'ID' => $user_id, 'display_name' => $name, 'first_name' => $name ] );
            }

            // Set Role (Custom Meta)
            update_user_meta( $user_id, 'ute_user_role', $role );
            
            // Log provider
            update_user_meta( $user_id, 'ute_auth_provider', $provider );

            $is_new_user = true;

        } else {
            // Scenario 2: User exists
            $user_id = $user->ID;
            $is_new_user = false;

            // Update role if provided and empty (just in case)
            $existing_role = get_user_meta( $user_id, 'ute_user_role', true );
            if ( empty( $existing_role ) && ! empty( $role ) ) {
                update_user_meta( $user_id, 'ute_user_role', $role );
            }
        }

        // --- Log user in (Set Cookies) ---
        wp_clean_auth_cookie( $user_id );
        wp_set_current_user( $user_id );
        wp_set_auth_cookie( $user_id, true );

        // Helper to get role
        $current_role = get_user_meta( $user_id, 'ute_user_role', true );

        return rest_ensure_response( [
            'success'   => true,
            'user_id'   => $user_id,
            'email'     => $email,
            'role'      => $current_role,
            'is_new'    => $is_new_user,
            'name'      => $user->display_name,
            'cookie'    => $_COOKIE[LOGGED_IN_COOKIE] ?? '', // Return cookie for external usage if needed
        ] );
    }
}
