<?php
/**
 * Listing Request Detail View Page Template
 *
 * @package HivePress\Extensions\ListingRequests
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

$listing_request = $context['listing_request'] ?? null;
$responses = $context['responses'] ?? [];
$is_owner = $context['is_owner'] ?? false;
$vendor = $context['vendor'] ?? null;

if ( ! $listing_request ) {
    return;
}
?>
<div class="hp-page hp-page--listing-request-view">
    <div class="hp-page__header">
        <nav class="hp-breadcrumb">
            <a href="<?php echo esc_url( hivepress()->router->get_url( $is_owner ? 'listing_requests_view_page' : 'listing_requests_incoming_page' ) ); ?>">
                ← <?php echo $is_owner 
                    ? esc_html__( 'My Requests', 'hivepress-listing-requests' )
                    : esc_html__( 'All Requests', 'hivepress-listing-requests' ); 
                ?>
            </a>
        </nav>
        <h1 class="hp-page__title"><?php echo esc_html( $listing_request->get_title() ); ?></h1>
    </div>

    <div class="hp-page__content hp-listing-request-detail">
        <div class="hp-listing-request-detail__main">
            <!-- Request Info Card -->
            <div class="hp-card hp-listing-request-detail__info">
                <div class="hp-card__header">
                    <h2 class="hp-card__title"><?php esc_html_e( 'Request Details', 'hivepress-listing-requests' ); ?></h2>
                    <span class="hp-listing-request__status hp-listing-request__status--<?php echo esc_attr( $listing_request->get_status() ); ?>">
                        <?php
                        $statuses = [
                            'hp_pending'   => __( 'Pending Review', 'hivepress-listing-requests' ),
                            'hp_active'    => __( 'Active', 'hivepress-listing-requests' ),
                            'hp_responded' => __( 'Responded', 'hivepress-listing-requests' ),
                            'hp_closed'    => __( 'Closed', 'hivepress-listing-requests' ),
                            'hp_expired'   => __( 'Expired', 'hivepress-listing-requests' ),
                            'publish'      => __( 'Active', 'hivepress-listing-requests' ),
                        ];
                        echo esc_html( $statuses[ $listing_request->get_status() ] ?? $listing_request->get_status() );
                        ?>
                    </span>
                </div>
                <div class="hp-card__body">
                    <dl class="hp-listing-request-detail__fields">
                        <div class="hp-field-group">
                            <dt><?php esc_html_e( 'Destination', 'hivepress-listing-requests' ); ?></dt>
                            <dd>
                                <?php
                                $destinations = [
                                    'mecca'  => __( 'Mecca', 'hivepress-listing-requests' ),
                                    'medina' => __( 'Medina', 'hivepress-listing-requests' ),
                                    'both'   => __( 'Mecca & Medina', 'hivepress-listing-requests' ),
                                ];
                                echo esc_html( $destinations[ $listing_request->get_destination() ] ?? '' );
                                ?>
                            </dd>
                        </div>
                        <div class="hp-field-group">
                            <dt><?php esc_html_e( 'Travel Date', 'hivepress-listing-requests' ); ?></dt>
                            <dd><?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $listing_request->get_travel_date() ) ) ); ?></dd>
                        </div>
                        <div class="hp-field-group">
                            <dt><?php esc_html_e( 'Duration', 'hivepress-listing-requests' ); ?></dt>
                            <dd><?php printf( esc_html__( '%d days', 'hivepress-listing-requests' ), $listing_request->get_duration() ); ?></dd>
                        </div>
                        <div class="hp-field-group">
                            <dt><?php esc_html_e( 'Travelers', 'hivepress-listing-requests' ); ?></dt>
                            <dd><?php echo esc_html( $listing_request->get_travelers() ); ?></dd>
                        </div>
                        <?php if ( $listing_request->get_budget_min() || $listing_request->get_budget_max() ) : ?>
                            <div class="hp-field-group">
                                <dt><?php esc_html_e( 'Budget', 'hivepress-listing-requests' ); ?></dt>
                                <dd>
                                    <?php
                                    if ( $listing_request->get_budget_min() && $listing_request->get_budget_max() ) {
                                        printf( '$%s - $%s', number_format( $listing_request->get_budget_min() ), number_format( $listing_request->get_budget_max() ) );
                                    } elseif ( $listing_request->get_budget_min() ) {
                                        printf( esc_html__( 'From $%s', 'hivepress-listing-requests' ), number_format( $listing_request->get_budget_min() ) );
                                    } else {
                                        printf( esc_html__( 'Up to $%s', 'hivepress-listing-requests' ), number_format( $listing_request->get_budget_max() ) );
                                    }
                                    ?>
                                </dd>
                            </div>
                        <?php endif; ?>
                        <?php if ( $listing_request->get_hotel_preference() ) : ?>
                            <div class="hp-field-group">
                                <dt><?php esc_html_e( 'Hotel Preference', 'hivepress-listing-requests' ); ?></dt>
                                <dd>
                                    <?php
                                    $hotels = [
                                        'economy'  => __( '3 Star', 'hivepress-listing-requests' ),
                                        'standard' => __( '4 Star', 'hivepress-listing-requests' ),
                                        'luxury'   => __( '5 Star', 'hivepress-listing-requests' ),
                                    ];
                                    echo esc_html( $hotels[ $listing_request->get_hotel_preference() ] ?? '' );
                                    ?>
                                </dd>
                            </div>
                        <?php endif; ?>
                    </dl>

                    <div class="hp-listing-request-detail__description">
                        <h3><?php esc_html_e( 'Description', 'hivepress-listing-requests' ); ?></h3>
                        <p><?php echo nl2br( esc_html( $listing_request->get_description() ) ); ?></p>
                    </div>

                    <?php if ( $listing_request->get_special_requirements() ) : ?>
                        <div class="hp-listing-request-detail__requirements">
                            <h3><?php esc_html_e( 'Special Requirements', 'hivepress-listing-requests' ); ?></h3>
                            <p><?php echo nl2br( esc_html( $listing_request->get_special_requirements() ) ); ?></p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Responses Section -->
            <div class="hp-card hp-listing-request-detail__responses">
                <div class="hp-card__header">
                    <h2 class="hp-card__title">
                        <?php printf( esc_html__( 'Responses (%d)', 'hivepress-listing-requests' ), count( $responses ) ); ?>
                    </h2>
                </div>
                <div class="hp-card__body">
                    <?php if ( empty( $responses ) ) : ?>
                        <div class="hp-empty-state hp-empty-state--small">
                            <p><?php esc_html_e( 'No responses yet.', 'hivepress-listing-requests' ); ?></p>
                            <?php if ( $is_owner ) : ?>
                                <small><?php esc_html_e( 'Organizers will respond to your request soon.', 'hivepress-listing-requests' ); ?></small>
                            <?php endif; ?>
                        </div>
                    <?php else : ?>
                        <div class="hp-responses-list">
                            <?php foreach ( $responses as $response ) : 
                                $vendor_id = get_comment_meta( $response->comment_ID, 'vendor_id', true );
                                $listing_id = get_comment_meta( $response->comment_ID, 'listing_id', true );
                                $response_vendor = $vendor_id ? \HivePress\Models\Vendor::query()->get_by_id( $vendor_id ) : null;
                            ?>
                                <div class="hp-response-item">
                                    <div class="hp-response-item__header">
                                        <div class="hp-response-item__author">
                                            <?php if ( $response_vendor ) : ?>
                                                <a href="<?php echo esc_url( get_permalink( $response_vendor->get_id() ) ); ?>">
                                                    <strong><?php echo esc_html( $response_vendor->get_title() ); ?></strong>
                                                </a>
                                            <?php else : ?>
                                                <strong><?php echo esc_html( $response->comment_author ); ?></strong>
                                            <?php endif; ?>
                                        </div>
                                        <time class="hp-response-item__date">
                                            <?php echo esc_html( human_time_diff( strtotime( $response->comment_date ) ) . ' ' . __( 'ago', 'hivepress-listing-requests' ) ); ?>
                                        </time>
                                    </div>
                                    <div class="hp-response-item__content">
                                        <?php echo nl2br( esc_html( $response->comment_content ) ); ?>
                                    </div>
                                    <?php if ( $listing_id && $is_owner ) : 
                                        $linked_listing = \HivePress\Models\Listing::query()->get_by_id( $listing_id );
                                        if ( $linked_listing ) :
                                    ?>
                                        <div class="hp-response-item__listing">
                                            <a href="<?php echo esc_url( get_permalink( $linked_listing->get_id() ) ); ?>" class="button button--small">
                                                <?php esc_html_e( 'View Recommended Listing', 'hivepress-listing-requests' ); ?> →
                                            </a>
                                        </div>
                                    <?php endif; endif; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Sidebar -->
        <aside class="hp-listing-request-detail__sidebar">
            <?php if ( $vendor && ! $is_owner ) : ?>
                <!-- Respond Form for Vendors -->
                <div class="hp-card hp-listing-request-detail__respond">
                    <div class="hp-card__header">
                        <h3 class="hp-card__title"><?php esc_html_e( 'Send Response', 'hivepress-listing-requests' ); ?></h3>
                    </div>
                    <div class="hp-card__body">
                        <form method="POST" action="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_respond_action', [ 'listing_request_id' => $listing_request->get_id() ] ) ); ?>" data-component="form">
                            <?php wp_nonce_field( 'hivepress_listing_request_respond' ); ?>
                            
                            <div class="hp-form__field">
                                <label><?php esc_html_e( 'Your Message', 'hivepress-listing-requests' ); ?></label>
                                <textarea name="message" rows="5" required minlength="20" 
                                          placeholder="<?php esc_attr_e( 'Introduce yourself and explain how you can help...', 'hivepress-listing-requests' ); ?>"></textarea>
                            </div>

                            <div class="hp-form__field">
                                <label><?php esc_html_e( 'Recommend a Listing (Optional)', 'hivepress-listing-requests' ); ?></label>
                                <select name="listing_id">
                                    <option value=""><?php esc_html_e( 'Select a listing', 'hivepress-listing-requests' ); ?></option>
                                    <?php
                                    $my_listings = \HivePress\Models\Listing::query()->filter([
                                        'user' => get_current_user_id(),
                                        'status' => 'publish',
                                    ])->get();
                                    foreach ( $my_listings as $my_listing ) :
                                    ?>
                                        <option value="<?php echo esc_attr( $my_listing->get_id() ); ?>">
                                            <?php echo esc_html( $my_listing->get_title() ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <button type="submit" class="button button--primary button--block">
                                <?php esc_html_e( 'Send Response', 'hivepress-listing-requests' ); ?>
                            </button>
                        </form>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Request Meta -->
            <div class="hp-card">
                <div class="hp-card__body">
                    <div class="hp-meta-list">
                        <div class="hp-meta-item">
                            <span class="hp-meta-item__label"><?php esc_html_e( 'Posted', 'hivepress-listing-requests' ); ?></span>
                            <span class="hp-meta-item__value"><?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $listing_request->get_created_date() ) ) ); ?></span>
                        </div>
                        <div class="hp-meta-item">
                            <span class="hp-meta-item__label"><?php esc_html_e( 'Responses', 'hivepress-listing-requests' ); ?></span>
                            <span class="hp-meta-item__value"><?php echo esc_html( $listing_request->get_response_count() ); ?></span>
                        </div>
                        <?php if ( $listing_request->get_expires_at() ) : ?>
                            <div class="hp-meta-item">
                                <span class="hp-meta-item__label"><?php esc_html_e( 'Expires', 'hivepress-listing-requests' ); ?></span>
                                <span class="hp-meta-item__value"><?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $listing_request->get_expires_at() ) ) ); ?></span>
                            </div>
                        <?php endif; ?>
                    </div>

                    <?php if ( $is_owner && $listing_request->get_contact_phone() ) : ?>
                        <div class="hp-meta-item hp-meta-item--highlight">
                            <span class="hp-meta-item__label"><?php esc_html_e( 'Your Contact', 'hivepress-listing-requests' ); ?></span>
                            <span class="hp-meta-item__value"><?php echo esc_html( $listing_request->get_contact_phone() ); ?></span>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </aside>
    </div>
</div>

<style>
.hp-listing-request-detail {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
}
@media (min-width: 768px) {
    .hp-listing-request-detail {
        grid-template-columns: 2fr 1fr;
    }
}
.hp-listing-request-detail__main {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}
.hp-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
}
.hp-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f7fafc;
}
.hp-card__title {
    margin: 0;
    font-size: 1rem;
}
.hp-card__body {
    padding: 1.5rem;
}
.hp-listing-request-detail__fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.hp-field-group {
    margin: 0;
}
.hp-field-group dt {
    font-size: 0.75rem;
    color: #718096;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
}
.hp-field-group dd {
    margin: 0;
    font-weight: 500;
}
.hp-response-item {
    padding: 1rem;
    background: #f7fafc;
    border-radius: 8px;
    margin-bottom: 1rem;
}
.hp-response-item:last-child {
    margin-bottom: 0;
}
.hp-response-item__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}
.hp-response-item__date {
    font-size: 0.75rem;
    color: #a0aec0;
}
.hp-meta-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.hp-meta-item {
    display: flex;
    justify-content: space-between;
}
.hp-meta-item__label {
    color: #718096;
    font-size: 0.875rem;
}
.hp-meta-item__value {
    font-weight: 500;
}
.button--block {
    width: 100%;
}
.hp-breadcrumb {
    margin-bottom: 1rem;
}
.hp-breadcrumb a {
    color: #718096;
    text-decoration: none;
}
.hp-breadcrumb a:hover {
    color: var(--hp-primary-color, #3182ce);
}
</style>
