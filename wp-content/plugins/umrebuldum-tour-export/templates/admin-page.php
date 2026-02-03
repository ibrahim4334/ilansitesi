<?php
/**
 * Admin Page Template
 *
 * @package Umrebuldum\TourExport
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

// Get listings for selection
$listings = get_posts([
    'post_type'      => 'hp_listing',
    'post_status'    => 'publish',
    'posts_per_page' => 100,
    'orderby'        => 'title',
    'order'          => 'ASC',
]);
?>
<div class="wrap">
    <h1><?php esc_html_e( 'Tour Export', 'umrebuldum-tour-export' ); ?></h1>
    
    <div class="card" style="max-width: 600px; margin-top: 20px; padding: 20px;">
        <h2><?php esc_html_e( 'Export Tour as Offline HTML', 'umrebuldum-tour-export' ); ?></h2>
        
        <p><?php esc_html_e( 'Select a tour listing to export as a single HTML file that works offline.', 'umrebuldum-tour-export' ); ?></p>
        
        <form method="get" action="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>">
            <input type="hidden" name="action" value="ute_export_tour">
            <?php wp_nonce_field( 'ute_export_bulk', '_wpnonce', false ); ?>
            
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="listing_id"><?php esc_html_e( 'Select Tour', 'umrebuldum-tour-export' ); ?></label>
                    </th>
                    <td>
                        <select name="listing_id" id="listing_id" class="regular-text" required>
                            <option value=""><?php esc_html_e( '— Select a tour —', 'umrebuldum-tour-export' ); ?></option>
                            <?php foreach ( $listings as $listing ) : ?>
                                <option value="<?php echo esc_attr( $listing->ID ); ?>">
                                    <?php echo esc_html( $listing->post_title ); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </td>
                </tr>
            </table>
            
            <p class="submit">
                <button type="submit" class="button button-primary">
                    <?php esc_html_e( 'Download HTML', 'umrebuldum-tour-export' ); ?>
                </button>
            </p>
        </form>
    </div>
    
    <div class="card" style="max-width: 600px; margin-top: 20px; padding: 20px;">
        <h3><?php esc_html_e( 'Features', 'umrebuldum-tour-export' ); ?></h3>
        <ul style="list-style: disc; padding-left: 20px;">
            <li><?php esc_html_e( 'Single HTML file - no external dependencies', 'umrebuldum-tour-export' ); ?></li>
            <li><?php esc_html_e( 'Works completely offline', 'umrebuldum-tour-export' ); ?></li>
            <li><?php esc_html_e( 'All images embedded as base64', 'umrebuldum-tour-export' ); ?></li>
            <li><?php esc_html_e( 'Mobile-responsive design', 'umrebuldum-tour-export' ); ?></li>
            <li><?php esc_html_e( 'Print-friendly layout', 'umrebuldum-tour-export' ); ?></li>
            <li><?php esc_html_e( 'Day-by-day itinerary', 'umrebuldum-tour-export' ); ?></li>
            <li><?php esc_html_e( 'Organizer contact info', 'umrebuldum-tour-export' ); ?></li>
        </ul>
    </div>
    
    <div class="card" style="max-width: 600px; margin-top: 20px; padding: 20px;">
        <h3><?php esc_html_e( 'Shortcode', 'umrebuldum-tour-export' ); ?></h3>
        <p><?php esc_html_e( 'Add an export button to any page:', 'umrebuldum-tour-export' ); ?></p>
        <code>[tour_export listing_id="123"]</code>
        
        <h3 style="margin-top: 20px;"><?php esc_html_e( 'Direct Link', 'umrebuldum-tour-export' ); ?></h3>
        <p><?php esc_html_e( 'Or use a direct link:', 'umrebuldum-tour-export' ); ?></p>
        <code><?php echo esc_url( admin_url( 'admin-ajax.php?action=ute_export_tour&listing_id=123' ) ); ?></code>
    </div>
</div>
