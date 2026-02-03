<?php
/**
 * Listing Requests View Page Template
 *
 * @package HivePress\Extensions\ListingRequests
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

$listing_requests = $context['listing_requests'] ?? [];
$is_vendor_view = $context['is_vendor_view'] ?? false;
?>
<div class="hp-page hp-page--listing-requests">
    <div class="hp-page__header">
        <div class="hp-page__header-content">
            <h1 class="hp-page__title">
                <?php echo $is_vendor_view 
                    ? esc_html__( 'Incoming Requests', 'hivepress-listing-requests' )
                    : esc_html__( 'My Requests', 'hivepress-listing-requests' ); 
                ?>
            </h1>
            <?php if ( ! $is_vendor_view ) : ?>
                <a href="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_submit_page' ) ); ?>" 
                   class="button button--primary">
                    <?php esc_html_e( 'Submit New Request', 'hivepress-listing-requests' ); ?>
                </a>
            <?php endif; ?>
        </div>

        <?php if ( $is_vendor_view ) : ?>
            <p class="hp-page__description">
                <?php esc_html_e( 'Browse requests from travelers and send your offers.', 'hivepress-listing-requests' ); ?>
            </p>
        <?php endif; ?>
    </div>

    <div class="hp-page__content">
        <?php if ( empty( $listing_requests ) ) : ?>
            <div class="hp-listing-requests--empty">
                <div class="hp-empty-state">
                    <span class="hp-empty-state__icon">📋</span>
                    <h3><?php esc_html_e( 'No requests found', 'hivepress-listing-requests' ); ?></h3>
                    <?php if ( ! $is_vendor_view ) : ?>
                        <p><?php esc_html_e( 'You haven\'t submitted any requests yet.', 'hivepress-listing-requests' ); ?></p>
                        <a href="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_submit_page' ) ); ?>" 
                           class="button button--primary">
                            <?php esc_html_e( 'Submit Your First Request', 'hivepress-listing-requests' ); ?>
                        </a>
                    <?php else : ?>
                        <p><?php esc_html_e( 'No active requests from travelers at the moment.', 'hivepress-listing-requests' ); ?></p>
                    <?php endif; ?>
                </div>
            </div>
        <?php else : ?>
            <div class="hp-listing-requests hp-listing-requests--grid">
                <?php foreach ( $listing_requests as $request ) : ?>
                    <div class="hp-listing-request hp-listing-request--card">
                        <div class="hp-listing-request__header">
                            <h3 class="hp-listing-request__title">
                                <a href="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_view_page', [ 'listing_request_id' => $request->get_id() ] ) ); ?>">
                                    <?php echo esc_html( $request->get_title() ); ?>
                                </a>
                            </h3>
                            <span class="hp-listing-request__status hp-listing-request__status--<?php echo esc_attr( $request->get_status() ); ?>">
                                <?php
                                $statuses = [
                                    'hp_pending'   => __( 'Pending', 'hivepress-listing-requests' ),
                                    'hp_active'    => __( 'Active', 'hivepress-listing-requests' ),
                                    'hp_responded' => __( 'Responded', 'hivepress-listing-requests' ),
                                    'hp_closed'    => __( 'Closed', 'hivepress-listing-requests' ),
                                    'hp_expired'   => __( 'Expired', 'hivepress-listing-requests' ),
                                    'publish'      => __( 'Active', 'hivepress-listing-requests' ),
                                ];
                                echo esc_html( $statuses[ $request->get_status() ] ?? $request->get_status() );
                                ?>
                            </span>
                        </div>

                        <div class="hp-listing-request__meta">
                            <span class="hp-listing-request__meta-item">
                                <i class="hp-icon hp-icon--location"></i>
                                <?php 
                                $destinations = [
                                    'mecca'  => __( 'Mecca', 'hivepress-listing-requests' ),
                                    'medina' => __( 'Medina', 'hivepress-listing-requests' ),
                                    'both'   => __( 'Mecca & Medina', 'hivepress-listing-requests' ),
                                ];
                                echo esc_html( $destinations[ $request->get_destination() ] ?? '' );
                                ?>
                            </span>
                            <span class="hp-listing-request__meta-item">
                                <i class="hp-icon hp-icon--calendar"></i>
                                <?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $request->get_travel_date() ) ) ); ?>
                            </span>
                            <span class="hp-listing-request__meta-item">
                                <i class="hp-icon hp-icon--clock"></i>
                                <?php printf( esc_html__( '%d days', 'hivepress-listing-requests' ), $request->get_duration() ); ?>
                            </span>
                            <span class="hp-listing-request__meta-item">
                                <i class="hp-icon hp-icon--users"></i>
                                <?php printf( esc_html__( '%d travelers', 'hivepress-listing-requests' ), $request->get_travelers() ); ?>
                            </span>
                        </div>

                        <?php if ( $request->get_budget_min() || $request->get_budget_max() ) : ?>
                            <div class="hp-listing-request__budget">
                                <strong><?php esc_html_e( 'Budget:', 'hivepress-listing-requests' ); ?></strong>
                                <?php
                                if ( $request->get_budget_min() && $request->get_budget_max() ) {
                                    printf( '$%s - $%s', number_format( $request->get_budget_min() ), number_format( $request->get_budget_max() ) );
                                } elseif ( $request->get_budget_min() ) {
                                    printf( esc_html__( 'From $%s', 'hivepress-listing-requests' ), number_format( $request->get_budget_min() ) );
                                } elseif ( $request->get_budget_max() ) {
                                    printf( esc_html__( 'Up to $%s', 'hivepress-listing-requests' ), number_format( $request->get_budget_max() ) );
                                }
                                ?>
                            </div>
                        <?php endif; ?>

                        <div class="hp-listing-request__description">
                            <?php echo esc_html( wp_trim_words( $request->get_description(), 30 ) ); ?>
                        </div>

                        <div class="hp-listing-request__footer">
                            <span class="hp-listing-request__responses">
                                <i class="hp-icon hp-icon--message"></i>
                                <?php printf( esc_html__( '%d responses', 'hivepress-listing-requests' ), $request->get_response_count() ); ?>
                            </span>
                            <span class="hp-listing-request__date">
                                <?php printf( esc_html__( 'Posted %s', 'hivepress-listing-requests' ), human_time_diff( strtotime( $request->get_created_date() ) ) . ' ' . __( 'ago', 'hivepress-listing-requests' ) ); ?>
                            </span>
                        </div>

                        <div class="hp-listing-request__actions">
                            <a href="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_view_page', [ 'listing_request_id' => $request->get_id() ] ) ); ?>" 
                               class="button button--secondary">
                                <?php echo $is_vendor_view 
                                    ? esc_html__( 'View & Respond', 'hivepress-listing-requests' )
                                    : esc_html__( 'View Details', 'hivepress-listing-requests' ); 
                                ?>
                            </a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<style>
.hp-page__header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}
.hp-listing-requests--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
}
.hp-listing-request--card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    transition: box-shadow 0.2s;
}
.hp-listing-request--card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.hp-listing-request__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
}
.hp-listing-request__title {
    margin: 0;
    font-size: 1.125rem;
}
.hp-listing-request__title a {
    color: inherit;
    text-decoration: none;
}
.hp-listing-request__title a:hover {
    color: var(--hp-primary-color, #3182ce);
}
.hp-listing-request__status {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    flex-shrink: 0;
}
.hp-listing-request__status--hp_pending,
.hp-listing-request__status--hp_active,
.hp-listing-request__status--publish {
    background: #c6f6d5;
    color: #22543d;
}
.hp-listing-request__status--hp_responded {
    background: #bee3f8;
    color: #2a4365;
}
.hp-listing-request__status--hp_closed,
.hp-listing-request__status--hp_expired {
    background: #fed7d7;
    color: #742a2a;
}
.hp-listing-request__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 1rem;
}
.hp-listing-request__budget {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    color: #2d3748;
}
.hp-listing-request__description {
    font-size: 0.875rem;
    color: #4a5568;
    line-height: 1.5;
    margin-bottom: 1rem;
}
.hp-listing-request__footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #a0aec0;
    margin-bottom: 1rem;
}
.hp-empty-state {
    text-align: center;
    padding: 3rem;
    background: #f7fafc;
    border-radius: 12px;
}
.hp-empty-state__icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
}
</style>
