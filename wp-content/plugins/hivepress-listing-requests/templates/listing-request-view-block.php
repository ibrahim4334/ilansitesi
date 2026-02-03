<?php
/**
 * Listing Request Block Template
 * 
 * Used to display a single request in cards/grids
 *
 * @package HivePress\Extensions\ListingRequests
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

$listing_request = $context['listing_request'] ?? null;
if ( ! $listing_request ) {
    return;
}

$destinations = [
    'mecca'  => __( 'Mecca', 'hivepress-listing-requests' ),
    'medina' => __( 'Medina', 'hivepress-listing-requests' ),
    'both'   => __( 'Mecca & Medina', 'hivepress-listing-requests' ),
];
?>
<article class="hp-listing-request hp-listing-request--block" data-id="<?php echo esc_attr( $listing_request->get_id() ); ?>">
    <header class="hp-listing-request__header">
        <h3 class="hp-listing-request__title">
            <a href="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_view_page', [ 'listing_request_id' => $listing_request->get_id() ] ) ); ?>">
                <?php echo esc_html( $listing_request->get_title() ); ?>
            </a>
        </h3>
    </header>

    <div class="hp-listing-request__attributes">
        <span class="hp-listing-request__attribute hp-listing-request__attribute--destination">
            📍 <?php echo esc_html( $destinations[ $listing_request->get_destination() ] ?? '' ); ?>
        </span>
        <span class="hp-listing-request__attribute hp-listing-request__attribute--date">
            📅 <?php echo esc_html( date_i18n( 'M j', strtotime( $listing_request->get_travel_date() ) ) ); ?>
        </span>
        <span class="hp-listing-request__attribute hp-listing-request__attribute--travelers">
            👥 <?php echo esc_html( $listing_request->get_travelers() ); ?>
        </span>
        <span class="hp-listing-request__attribute hp-listing-request__attribute--duration">
            ⏱️ <?php printf( esc_html__( '%d days', 'hivepress-listing-requests' ), $listing_request->get_duration() ); ?>
        </span>
    </div>

    <?php if ( $listing_request->get_budget_max() ) : ?>
        <div class="hp-listing-request__budget">
            💰 <?php printf( esc_html__( 'Budget: up to $%s', 'hivepress-listing-requests' ), number_format( $listing_request->get_budget_max() ) ); ?>
        </div>
    <?php endif; ?>

    <div class="hp-listing-request__excerpt">
        <?php echo esc_html( wp_trim_words( $listing_request->get_description(), 20 ) ); ?>
    </div>

    <footer class="hp-listing-request__footer">
        <span class="hp-listing-request__meta">
            <?php printf( 
                esc_html__( '%d responses', 'hivepress-listing-requests' ), 
                $listing_request->get_response_count() 
            ); ?>
        </span>
        <a href="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_view_page', [ 'listing_request_id' => $listing_request->get_id() ] ) ); ?>" 
           class="hp-listing-request__link">
            <?php esc_html_e( 'View Details', 'hivepress-listing-requests' ); ?> →
        </a>
    </footer>
</article>
