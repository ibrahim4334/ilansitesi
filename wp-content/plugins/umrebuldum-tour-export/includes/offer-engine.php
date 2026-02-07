<?php
/**
 * Offer Engine Class
 * 
 * Centralized upgrade messaging and CTAs
 *
 * @package Umrebuldum\TourExport
 */

namespace Umrebuldum\TourExport;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Offer Engine Class
 */
class Offer_Engine {

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
        // Constructor intentionally empty
    }

    /**
     * Get upgrade URL for a tier
     *
     * @param string $tier Target tier (plus or pro)
     * @return string
     */
    public function get_upgrade_url( $tier = 'plus' ) {
        $product_id = '';

        if ( $tier === 'pro' ) {
            $product_id = get_option( Access_Control::OPTION_PRO_PRODUCT );
        } else {
            $product_id = get_option( Access_Control::OPTION_PLUS_PRODUCT );
        }

        if ( ! $product_id || ! function_exists( 'wc_get_product' ) ) {
            return admin_url( 'admin.php?page=umrebuldum-tour-export-settings' );
        }

        $product = wc_get_product( $product_id );
        if ( ! $product ) {
            return admin_url( 'admin.php?page=umrebuldum-tour-export-settings' );
        }

        return $product->get_permalink();
    }

    /**
     * Get quality upsell message
     *
     * @return array ['title', 'message', 'cta_label', 'upgrade_url']
     */
    public function get_quality_upsell() {
        return [
            'title'       => __( 'Görsel Kalitesi: Standart (Web)', 'umrebuldum-tour-export' ),
            'message'     => __( 'Baskı kalitesinde çıktı ve watermark kaldırmak ister misiniz?', 'umrebuldum-tour-export' ),
            'cta_label'   => __( '✨ PRO Kalitesine Geç', 'umrebuldum-tour-export' ),
            'upgrade_url' => $this->get_upgrade_url( 'plus' ),
        ];
    }

    /**
     * Get quota exceeded message
     *
     * @param int $used Used count
     * @param int $limit Limit count
     * @return array ['title', 'message', 'cta_label', 'upgrade_url']
     */
    public function get_quota_exceeded( $used, $limit ) {
        return [
            'title'       => __( 'Günlük Limit Aşıldı', 'umrebuldum-tour-export' ),
            'message'     => sprintf(
                __( 'Bugün %d/%d poster oluşturdunuz. Sınırsız kullanım için yükseltin.', 'umrebuldum-tour-export' ),
                $used,
                $limit
            ),
            'cta_label'   => __( '🚀 Sınırsız Erişim Al', 'umrebuldum-tour-export' ),
            'upgrade_url' => $this->get_upgrade_url( 'plus' ),
        ];
    }

    /**
     * Get feature locked message
     *
     * @param string $feature_name Feature display name
     * @param string $tier Required tier
     * @return array ['title', 'message', 'cta_label', 'upgrade_url']
     */
    public function get_feature_locked( $feature_name, $tier = 'plus' ) {
        $tier_name = Access_Control::get_instance()->get_tier_name( $tier );

        return [
            'title'       => __( 'Özellik Kilitli', 'umrebuldum-tour-export' ),
            'message'     => sprintf(
                __( '%s özelliği %s planında kullanılabilir.', 'umrebuldum-tour-export' ),
                $feature_name,
                $tier_name
            ),
            'cta_label'   => sprintf( __( '%s Planına Geç', 'umrebuldum-tour-export' ), $tier_name ),
            'upgrade_url' => $this->get_upgrade_url( $tier ),
        ];
    }

    /**
     * Get emergency features upsell
     *
     * @return array ['title', 'message', 'cta_label', 'upgrade_url']
     */
    public function get_emergency_upsell() {
        return [
            'title'       => __( 'Acil Durum Özellikleri', 'umrebuldum-tour-export' ),
            'message'     => __( 'Rehber bilgileri, QR kod ve acil yardım ekranı için PLUS plan gerekli.', 'umrebuldum-tour-export' ),
            'cta_label'   => __( '🆘 Acil Durum Özelliklerini Aç', 'umrebuldum-tour-export' ),
            'upgrade_url' => $this->get_upgrade_url( 'plus' ),
        ];
    }

    /**
     * Get watermark removal upsell
     *
     * @return array ['title', 'message', 'cta_label', 'upgrade_url']
     */
    public function get_watermark_upsell() {
        return [
            'title'       => __( 'Watermark Kaldır', 'umrebuldum-tour-export' ),
            'message'     => __( 'Profesyonel görünüm için watermark\'ı kaldırın.', 'umrebuldum-tour-export' ),
            'cta_label'   => __( 'Watermark\'sız Export', 'umrebuldum-tour-export' ),
            'upgrade_url' => $this->get_upgrade_url( 'plus' ),
        ];
    }

    /**
     * Get custom branding upsell (PRO only)
     *
     * @return array ['title', 'message', 'cta_label', 'upgrade_url']
     */
    public function get_branding_upsell() {
        return [
            'title'       => __( 'Özel Markalama', 'umrebuldum-tour-export' ),
            'message'     => __( 'Kendi logonuzu ekleyin ve markanızı öne çıkarın.', 'umrebuldum-tour-export' ),
            'cta_label'   => __( '🎨 PRO\'ya Geç', 'umrebuldum-tour-export' ),
            'upgrade_url' => $this->get_upgrade_url( 'pro' ),
        ];
    }

    /**
     * Render upsell box HTML
     *
     * @param array  $offer Offer data from get_* methods
     * @param string $context Where the box is shown
     * @return string HTML
     */
    public function render_upsell_box( $offer, $context = '' ) {
        // Check if monetization is enabled
        if ( ! Access_Control::get_instance()->is_enabled() ) {
            return '';
        }

        ob_start();
        ?>
        <div class="ute-upsell-box" data-context="<?php echo esc_attr( $context ); ?>">
            <div class="ute-upsell-box__icon">
                <?php echo $context === 'quota' ? '🚀' : '✨'; ?>
            </div>
            <div class="ute-upsell-box__content">
                <h3 class="ute-upsell-box__title"><?php echo esc_html( $offer['title'] ); ?></h3>
                <p class="ute-upsell-box__message"><?php echo esc_html( $offer['message'] ); ?></p>
                <a href="<?php echo esc_url( $offer['upgrade_url'] ); ?>" 
                   class="ute-upsell-box__cta button button-primary">
                    <?php echo esc_html( $offer['cta_label'] ); ?>
                </a>
            </div>
        </div>
        <style>
            .ute-upsell-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                display: flex;
                align-items: center;
                gap: 15px;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
            }
            .ute-upsell-box__icon {
                font-size: 3rem;
                line-height: 1;
            }
            .ute-upsell-box__content {
                flex: 1;
            }
            .ute-upsell-box__title {
                color: #fff;
                font-size: 1.25rem;
                margin: 0 0 8px;
                font-weight: 600;
            }
            .ute-upsell-box__message {
                color: rgba(255,255,255,0.9);
                margin: 0 0 12px;
                font-size: 0.95rem;
            }
            .ute-upsell-box__cta {
                background: #fff !important;
                color: #667eea !important;
                border: none !important;
                font-weight: 600 !important;
                padding: 8px 20px !important;
                text-decoration: none !important;
                border-radius: 6px !important;
                display: inline-block;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
            .ute-upsell-box__cta:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
            }
        </style>
        <?php
        return ob_get_clean();
    }
}
