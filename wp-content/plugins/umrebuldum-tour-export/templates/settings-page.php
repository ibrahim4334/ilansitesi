<?php
/**
 * Settings Page Template
 *
 * @package Umrebuldum\TourExport
 */

use Umrebuldum\TourExport\Access_Control;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

// Handle form submission
if ( isset( $_POST['ute_save_settings'] ) && check_admin_referer( 'ute_settings' ) ) {
    update_option( Access_Control::OPTION_PLAN_MODE, isset( $_POST['plan_mode_enabled'] ) ? '1' : '0' );
    update_option( Access_Control::OPTION_PLUS_PRODUCT, sanitize_text_field( $_POST['plus_product_id'] ?? '' ) );
    update_option( Access_Control::OPTION_PRO_PRODUCT, sanitize_text_field( $_POST['pro_product_id'] ?? '' ) );
    
    echo '<div class="notice notice-success"><p>' . esc_html__( 'Ayarlar kaydedildi.', 'umrebuldum-tour-export' ) . '</p></div>';
}

// Get current values
$plan_mode_enabled = get_option( Access_Control::OPTION_PLAN_MODE, false );
$plus_product_id = get_option( Access_Control::OPTION_PLUS_PRODUCT, '' );
$pro_product_id = get_option( Access_Control::OPTION_PRO_PRODUCT, '' );

// Get WooCommerce products if available
$wc_products = [];
if ( function_exists( 'wc_get_products' ) ) {
    $wc_products = wc_get_products( [
        'limit'  => 100,
        'status' => 'publish',
        'orderby' => 'title',
        'order' => 'ASC',
    ] );
}
?>
<div class="wrap">
    <h1><?php esc_html_e( 'Tour Export - Ayarlar', 'umrebuldum-tour-export' ); ?></h1>
    
    <form method="post" action="">
        <?php wp_nonce_field( 'ute_settings' ); ?>
        
        <!-- Monetization Toggle -->
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2><?php esc_html_e( '💰 Monetizasyon', 'umrebuldum-tour-export' ); ?></h2>
            
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="plan_mode_enabled"><?php esc_html_e( 'Plan Sistemi', 'umrebuldum-tour-export' ); ?></label>
                    </th>
                    <td>
                        <label>
                            <input type="checkbox" 
                                   name="plan_mode_enabled" 
                                   id="plan_mode_enabled" 
                                   value="1" 
                                   <?php checked( $plan_mode_enabled, '1' ); ?>>
                            <?php esc_html_e( 'Etkinleştir', 'umrebuldum-tour-export' ); ?>
                        </label>
                        <p class="description">
                            <?php esc_html_e( 'FREE / PLUS / PRO plan sistemini aktif eder. Kapalı olduğunda tüm özellikler herkese açık.', 'umrebuldum-tour-export' ); ?>
                        </p>
                    </td>
                </tr>
            </table>
        </div>

        <!-- WooCommerce Product IDs -->
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2><?php esc_html_e( '🛒 WooCommerce Entegrasyonu', 'umrebuldum-tour-export' ); ?></h2>
            
            <?php if ( ! function_exists( 'WC' ) ) : ?>
                <div class="notice notice-warning inline">
                    <p><?php esc_html_e( 'WooCommerce eklentisi aktif değil. Ürün atamak için WooCommerce gereklidir.', 'umrebuldum-tour-export' ); ?></p>
                </div>
            <?php endif; ?>
            
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="plus_product_id"><?php esc_html_e( 'PLUS Ürün ID', 'umrebuldum-tour-export' ); ?></label>
                    </th>
                    <td>
                        <?php if ( ! empty( $wc_products ) ) : ?>
                            <select name="plus_product_id" id="plus_product_id" class="regular-text">
                                <option value=""><?php esc_html_e( '— Seçiniz —', 'umrebuldum-tour-export' ); ?></option>
                                <?php foreach ( $wc_products as $product ) : ?>
                                    <option value="<?php echo esc_attr( $product->get_id() ); ?>" 
                                            <?php selected( $plus_product_id, $product->get_id() ); ?>>
                                        <?php echo esc_html( $product->get_name() . ' (#' . $product->get_id() . ')' ); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        <?php else : ?>
                            <input type="number" 
                                   name="plus_product_id" 
                                   id="plus_product_id" 
                                   value="<?php echo esc_attr( $plus_product_id ); ?>" 
                                   class="regular-text" 
                                   placeholder="<?php esc_attr_e( 'Ürün ID', 'umrebuldum-tour-export' ); ?>">
                        <?php endif; ?>
                        <p class="description">
                            <?php esc_html_e( 'PLUS planı için satılan WooCommerce ürün ID\'si.', 'umrebuldum-tour-export' ); ?>
                        </p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row">
                        <label for="pro_product_id"><?php esc_html_e( 'PRO Ürün ID', 'umrebuldum-tour-export' ); ?></label>
                    </th>
                    <td>
                        <?php if ( ! empty( $wc_products ) ) : ?>
                            <select name="pro_product_id" id="pro_product_id" class="regular-text">
                                <option value=""><?php esc_html_e( '— Seçiniz —', 'umrebuldum-tour-export' ); ?></option>
                                <?php foreach ( $wc_products as $product ) : ?>
                                    <option value="<?php echo esc_attr( $product->get_id() ); ?>" 
                                            <?php selected( $pro_product_id, $product->get_id() ); ?>>
                                        <?php echo esc_html( $product->get_name() . ' (#' . $product->get_id() . ')' ); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        <?php else : ?>
                            <input type="number" 
                                   name="pro_product_id" 
                                   id="pro_product_id" 
                                   value="<?php echo esc_attr( $pro_product_id ); ?>" 
                                   class="regular-text" 
                                   placeholder="<?php esc_attr_e( 'Ürün ID', 'umrebuldum-tour-export' ); ?>">
                        <?php endif; ?>
                        <p class="description">
                            <?php esc_html_e( 'PRO planı için satılan WooCommerce ürün ID\'si.', 'umrebuldum-tour-export' ); ?>
                        </p>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Plan Features -->
        <div class="card" style="max-width: 800px; margin-top: 20px;">
            <h2><?php esc_html_e( '📋 Plan Özellikleri', 'umrebuldum-tour-export' ); ?></h2>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <!-- FREE Plan -->
                <div style="border: 2px solid #ddd; border-radius: 8px; padding: 15px; background: #f9f9f9;">
                    <h3 style="margin-top: 0; color: #666;">FREE</h3>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
                        <li>✓ 5 poster/gün</li>
                        <li>✓ Kalite: 60</li>
                        <li>✓ Watermark var</li>
                        <li>✓ Temel export</li>
                    </ul>
                </div>
                
                <!-- PLUS Plan -->
                <div style="border: 2px solid #667eea; border-radius: 8px; padding: 15px; background: #f0f1ff;">
                    <h3 style="margin-top: 0; color: #667eea;">PLUS ⭐</h3>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
                        <li>✓ Sınırsız poster</li>
                        <li>✓ Kalite: 85</li>
                        <li>✓ Watermark yok</li>
                        <li>✓ Acil durum ekranı</li>
                        <li>✓ Rehber bilgileri</li>
                        <li>✓ QR kod</li>
                    </ul>
                </div>
                
                <!-- PRO Plan -->
                <div style="border: 2px solid #764ba2; border-radius: 8px; padding: 15px; background: #f5f0ff;">
                    <h3 style="margin-top: 0; color: #764ba2;">PRO 💎</h3>
                    <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px;">
                        <li>✓ PLUS + </li>
                        <li>✓ Özel branding</li>
                        <li>✓ Logo ekleme</li>
                        <li>✓ Çoklu turlar</li>
                        <li>✓ YouTube</li>
                        <li>✓ Analytics</li>
                    </ul>
                </div>
            </div>
        </div>

        <p class="submit">
            <button type="submit" name="ute_save_settings" class="button button-primary">
                <?php esc_html_e( 'Ayarları Kaydet', 'umrebuldum-tour-export' ); ?>
            </button>
        </p>
    </form>
</div>
