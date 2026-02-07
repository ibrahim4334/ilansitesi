<?php
/**
 * Dashboard Widget Class
 * 
 * Shows usage stats and upgrade prompts
 *
 * @package Umrebuldum\TourExport
 */

namespace Umrebuldum\TourExport;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Dashboard Widget Class
 */
class Dashboard_Widget {

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
        add_action( 'admin_menu', [ $this, 'add_dashboard_notice' ], 20 );
    }

    /**
     * Add usage notice to admin pages
     */
    public function add_dashboard_notice() {
        // Only show on relevant admin pages
        $screen = get_current_screen();
        if ( ! $screen || ! in_array( $screen->id, [ 'dashboard', 'hp_listing', 'edit-hp_listing' ], true ) ) {
            return;
        }

        add_action( 'admin_notices', [ $this, 'render_usage_notice' ] );
    }

    /**
     * Render usage notice
     */
    public function render_usage_notice() {
        $access = Access_Control::get_instance();

        // Don't show if monetization disabled
        if ( ! $access->is_enabled() ) {
            return;
        }

        $user_id = get_current_user_id();
        $tier = $access->get_user_tier( $user_id );
        $quota = $access->check_quota( $user_id );

        // Only show for FREE users
        if ( $tier !== Access_Control::TIER_FREE ) {
            return;
        }

        $percentage = $quota['limit'] > 0 ? ( $quota['used'] / $quota['limit'] ) * 100 : 0;
        $bar_color = $percentage >= 80 ? '#dc3232' : ( $percentage >= 50 ? '#ffb900' : '#46b450' );

        ?>
        <div class="notice notice-info ute-usage-notice" style="position: relative;">
            <button type="button" class="notice-dismiss" onclick="this.parentElement.style.display='none'">
                <span class="screen-reader-text">Dismiss</span>
            </button>
            
            <div style="display: flex; align-items: center; gap: 20px; padding: 10px 0;">
                <div style="font-size: 2rem;">📊</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px;">
                        <?php esc_html_e( 'Günlük Kullanım', 'umrebuldum-tour-export' ); ?>
                    </h3>
                    
                    <!-- Progress Bar -->
                    <div style="background: #e5e5e5; height: 24px; border-radius: 12px; overflow: hidden; position: relative;">
                        <div style="background: <?php echo esc_attr( $bar_color ); ?>; 
                                    height: 100%; 
                                    width: <?php echo esc_attr( $percentage ); ?>%; 
                                    transition: width 0.3s ease;
                                    border-radius: 12px;">
                        </div>
                        <span style="position: absolute; 
                                     top: 50%; 
                                     left: 50%; 
                                     transform: translate(-50%, -50%);
                                     font-weight: 600;
                                     font-size: 12px;
                                     color: <?php echo $percentage > 50 ? '#fff' : '#333'; ?>;">
                            <?php echo esc_html( $quota['used'] . '/' . $quota['limit'] ); ?>
                        </span>
                    </div>
                    
                    <p style="margin: 8px 0 0; font-size: 12px; color: #666;">
                        <?php 
                        printf(
                            esc_html__( 'Bugün %d adet poster oluşturdunuz. Sınırsız kullanım için yükseltin.', 'umrebuldum-tour-export' ),
                            $quota['used']
                        );
                        ?>
                    </p>
                </div>
                
                <div>
                    <?php
                    $offer = Offer_Engine::get_instance()->get_quota_exceeded( $quota['used'], $quota['limit'] );
                    ?>
                    <a href="<?php echo esc_url( $offer['upgrade_url'] ); ?>" 
                       class="button button-primary"
                       style="white-space: nowrap;">
                        🚀 <?php esc_html_e( 'PLUS\'a Geç', 'umrebuldum-tour-export' ); ?>
                    </a>
                </div>
            </div>
        </div>
        <?php
    }
}
