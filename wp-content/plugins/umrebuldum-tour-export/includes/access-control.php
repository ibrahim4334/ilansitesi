<?php
/**
 * Access Control Class - 3-Tier System
 * 
 * Manages FREE / PLUS / PRO tier logic
 *
 * @package Umrebuldum\TourExport
 */

namespace Umrebuldum\TourExport;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Access Control Class
 */
class Access_Control {

    /**
     * Tier constants
     */
    const TIER_FREE = 'free';
    const TIER_PLUS = 'plus';
    const TIER_PRO = 'pro';

    /**
     * Option keys
     */
    const OPTION_QUOTA = 'ute_daily_quota_';
    const OPTION_PLAN_MODE = 'ute_plan_mode_enabled';
    const OPTION_PLUS_PRODUCT = 'ute_plus_product_id';
    const OPTION_PRO_PRODUCT = 'ute_pro_product_id';

    /**
     * Daily quota limits
     */
    const QUOTA_FREE = 5;

    /**
     * Instance
     */
    private static $instance = null;

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
        // Constructor intentionally empty - stateless class
    }

    /**
     * Check if monetization is enabled
     *
     * @return bool
     */
    public function is_enabled() {
        return (bool) get_option( self::OPTION_PLAN_MODE, false );
    }

    /**
     * Get user's current tier
     *
     * @param int $user_id User ID (0 for current user)
     * @return string 'free', 'plus', or 'pro'
     */
    public function get_user_tier( $user_id = 0 ) {
        if ( ! $user_id ) {
            $user_id = get_current_user_id();
        }

        // If monetization disabled, everyone is PRO
        if ( ! $this->is_enabled() ) {
            return self::TIER_PRO;
        }

        // Check if WooCommerce is active
        if ( ! function_exists( 'wc_customer_bought_product' ) ) {
            return self::TIER_FREE;
        }

        $user = get_user_by( 'id', $user_id );
        if ( ! $user ) {
            return self::TIER_FREE;
        }

        // Check PRO first (highest tier)
        $pro_product_id = get_option( self::OPTION_PRO_PRODUCT );
        if ( $pro_product_id && wc_customer_bought_product( $user->user_email, $user_id, $pro_product_id ) ) {
            return self::TIER_PRO;
        }

        // Check PLUS
        $plus_product_id = get_option( self::OPTION_PLUS_PRODUCT );
        if ( $plus_product_id && wc_customer_bought_product( $user->user_email, $user_id, $plus_product_id ) ) {
            return self::TIER_PLUS;
        }

        return self::TIER_FREE;
    }

    /**
     * Check if user has feature access
     *
     * @param string $feature Feature key
     * @param int    $user_id User ID
     * @return bool
     */
    public function has_feature( $feature, $user_id = 0 ) {
        $tier = $this->get_user_tier( $user_id );

        $features = [
            // FREE features
            'offline_export_basic' => [ self::TIER_FREE, self::TIER_PLUS, self::TIER_PRO ],
            
            // PLUS features
            'no_watermark'         => [ self::TIER_PLUS, self::TIER_PRO ],
            'high_quality'         => [ self::TIER_PLUS, self::TIER_PRO ],
            'unlimited_exports'    => [ self::TIER_PLUS, self::TIER_PRO ],
            'emergency_screen'     => [ self::TIER_PLUS, self::TIER_PRO ],
            'guide_info'           => [ self::TIER_PLUS, self::TIER_PRO ],
            'qr_emergency'         => [ self::TIER_PLUS, self::TIER_PRO ],
            
            // PRO features
            'custom_branding'      => [ self::TIER_PRO ],
            'organization_logo'    => [ self::TIER_PRO ],
            'multiple_tours'       => [ self::TIER_PRO ],
            'youtube_embeds'       => [ self::TIER_PRO ],
            'analytics_hooks'      => [ self::TIER_PRO ],
        ];

        if ( ! isset( $features[ $feature ] ) ) {
            return false;
        }

        return in_array( $tier, $features[ $feature ], true );
    }

    /**
     * Get quality level for user
     *
     * @param int $user_id User ID
     * @return int Quality percentage (60, 85, or 100)
     */
    public function get_quality_level( $user_id = 0 ) {
        $tier = $this->get_user_tier( $user_id );

        switch ( $tier ) {
            case self::TIER_PRO:
                return 100;
            case self::TIER_PLUS:
                return 85;
            default:
                return 60;
        }
    }

    /**
     * Check daily quota for FREE users
     *
     * @param int $user_id User ID
     * @return array ['allowed' => bool, 'used' => int, 'limit' => int]
     */
    public function check_quota( $user_id = 0 ) {
        if ( ! $user_id ) {
            $user_id = get_current_user_id();
        }

        $tier = $this->get_user_tier( $user_id );

        // PLUS and PRO have unlimited
        if ( $tier !== self::TIER_FREE ) {
            return [
                'allowed' => true,
                'used'    => 0,
                'limit'   => -1, // unlimited
                'tier'    => $tier,
            ];
        }

        // FREE tier - check daily quota
        $today = date( 'Y-m-d' );
        $quota_key = self::OPTION_QUOTA . $user_id . '_' . $today;
        $used = (int) get_transient( $quota_key );

        return [
            'allowed' => $used < self::QUOTA_FREE,
            'used'    => $used,
            'limit'   => self::QUOTA_FREE,
            'tier'    => $tier,
        ];
    }

    /**
     * Increment quota usage
     *
     * @param int $user_id User ID
     * @return bool Success
     */
    public function increment_quota( $user_id = 0 ) {
        if ( ! $user_id ) {
            $user_id = get_current_user_id();
        }

        $tier = $this->get_user_tier( $user_id );

        // Only track for FREE tier
        if ( $tier !== self::TIER_FREE ) {
            return true;
        }

        $today = date( 'Y-m-d' );
        $quota_key = self::OPTION_QUOTA . $user_id . '_' . $today;
        $used = (int) get_transient( $quota_key );
        
        $new_value = $used + 1;
        
        // Expire at end of day
        $midnight = strtotime( 'tomorrow' ) - time();
        
        return set_transient( $quota_key, $new_value, $midnight );
    }

    /**
     * Get tier display name
     *
     * @param string $tier Tier key
     * @return string
     */
    public function get_tier_name( $tier ) {
        $names = [
            self::TIER_FREE => __( 'FREE', 'umrebuldum-tour-export' ),
            self::TIER_PLUS => __( 'PLUS', 'umrebuldum-tour-export' ),
            self::TIER_PRO  => __( 'PRO', 'umrebuldum-tour-export' ),
        ];

        return $names[ $tier ] ?? $tier;
    }

    /**
     * Get tier features list
     *
     * @param string $tier Tier key
     * @return array
     */
    public function get_tier_features( $tier ) {
        $features = [
            self::TIER_FREE => [
                '5 poster/gün',
                'Kalite: 60 (Standart)',
                'Watermark var',
                'Temel offline export',
            ],
            self::TIER_PLUS => [
                'Sınırsız poster',
                'Kalite: 85 (Yüksek)',
                'Watermark yok',
                'Gelişmiş offline export',
                'Acil yardım ekranı',
                'Rehber bilgileri',
                'QR kod acil durum',
            ],
            self::TIER_PRO => [
                'PLUS\'taki her şey',
                'Özel markalama',
                'Organizasyon logosu',
                'Çoklu turlar',
                'YouTube videoları',
                'Analytics entegrasyonu',
            ],
        ];

        return $features[ $tier ] ?? [];
    }
}
