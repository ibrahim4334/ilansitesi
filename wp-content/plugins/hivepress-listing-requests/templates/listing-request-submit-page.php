<?php
/**
 * Listing Request Submit Page Template
 *
 * @package HivePress\Extensions\ListingRequests
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

?>
<div class="hp-page hp-page--listing-request-submit">
    <div class="hp-page__header">
        <h1 class="hp-page__title"><?php esc_html_e( 'Submit a Request', 'hivepress-listing-requests' ); ?></h1>
        <p class="hp-page__description">
            <?php esc_html_e( 'Tell organizers what you are looking for and receive personalized offers.', 'hivepress-listing-requests' ); ?>
        </p>
    </div>

    <div class="hp-page__content">
        <div class="hp-form hp-form--listing-request-submit">
            <form method="POST" action="<?php echo esc_url( hivepress()->router->get_url( 'listing_request_submit_action' ) ); ?>" data-component="form">
                
                <?php wp_nonce_field( 'hivepress_listing_request_submit' ); ?>

                <div class="hp-form__fields">
                    <!-- Title -->
                    <div class="hp-form__field hp-form__field--text">
                        <label class="hp-form__label">
                            <?php esc_html_e( 'Request Title', 'hivepress-listing-requests' ); ?>
                            <span class="hp-form__label--required">*</span>
                        </label>
                        <input type="text" name="title" class="hp-field hp-field--text" required maxlength="256" 
                               placeholder="<?php esc_attr_e( 'E.g., Looking for family Umrah package in Ramadan', 'hivepress-listing-requests' ); ?>">
                    </div>

                    <!-- Destination -->
                    <div class="hp-form__field hp-form__field--select">
                        <label class="hp-form__label">
                            <?php esc_html_e( 'Destination', 'hivepress-listing-requests' ); ?>
                            <span class="hp-form__label--required">*</span>
                        </label>
                        <select name="destination" class="hp-field hp-field--select" required>
                            <option value=""><?php esc_html_e( 'Select destination', 'hivepress-listing-requests' ); ?></option>
                            <option value="mecca"><?php esc_html_e( 'Mecca Only', 'hivepress-listing-requests' ); ?></option>
                            <option value="medina"><?php esc_html_e( 'Medina Only', 'hivepress-listing-requests' ); ?></option>
                            <option value="both"><?php esc_html_e( 'Both Mecca & Medina', 'hivepress-listing-requests' ); ?></option>
                        </select>
                    </div>

                    <div class="hp-form__row">
                        <!-- Travel Date -->
                        <div class="hp-form__field hp-form__field--date">
                            <label class="hp-form__label">
                                <?php esc_html_e( 'Preferred Travel Date', 'hivepress-listing-requests' ); ?>
                                <span class="hp-form__label--required">*</span>
                            </label>
                            <input type="date" name="travel_date" class="hp-field hp-field--date" required 
                                   min="<?php echo esc_attr( date( 'Y-m-d' ) ); ?>">
                        </div>

                        <!-- Duration -->
                        <div class="hp-form__field hp-form__field--number">
                            <label class="hp-form__label">
                                <?php esc_html_e( 'Duration (days)', 'hivepress-listing-requests' ); ?>
                                <span class="hp-form__label--required">*</span>
                            </label>
                            <input type="number" name="duration" class="hp-field hp-field--number" required 
                                   min="5" max="30" value="10">
                        </div>

                        <!-- Travelers -->
                        <div class="hp-form__field hp-form__field--number">
                            <label class="hp-form__label">
                                <?php esc_html_e( 'Number of Travelers', 'hivepress-listing-requests' ); ?>
                                <span class="hp-form__label--required">*</span>
                            </label>
                            <input type="number" name="travelers" class="hp-field hp-field--number" required 
                                   min="1" max="50" value="1">
                        </div>
                    </div>

                    <div class="hp-form__row">
                        <!-- Budget Min -->
                        <div class="hp-form__field hp-form__field--number">
                            <label class="hp-form__label">
                                <?php esc_html_e( 'Minimum Budget (USD)', 'hivepress-listing-requests' ); ?>
                            </label>
                            <input type="number" name="budget_min" class="hp-field hp-field--number" min="0" step="100">
                        </div>

                        <!-- Budget Max -->
                        <div class="hp-form__field hp-form__field--number">
                            <label class="hp-form__label">
                                <?php esc_html_e( 'Maximum Budget (USD)', 'hivepress-listing-requests' ); ?>
                            </label>
                            <input type="number" name="budget_max" class="hp-field hp-field--number" min="0" step="100">
                        </div>
                    </div>

                    <!-- Hotel Preference -->
                    <div class="hp-form__field hp-form__field--select">
                        <label class="hp-form__label">
                            <?php esc_html_e( 'Hotel Preference', 'hivepress-listing-requests' ); ?>
                        </label>
                        <select name="hotel_preference" class="hp-field hp-field--select">
                            <option value=""><?php esc_html_e( 'No preference', 'hivepress-listing-requests' ); ?></option>
                            <option value="economy"><?php esc_html_e( '3 Star (Economy)', 'hivepress-listing-requests' ); ?></option>
                            <option value="standard"><?php esc_html_e( '4 Star (Standard)', 'hivepress-listing-requests' ); ?></option>
                            <option value="luxury"><?php esc_html_e( '5 Star (Luxury)', 'hivepress-listing-requests' ); ?></option>
                        </select>
                    </div>

                    <!-- Description -->
                    <div class="hp-form__field hp-form__field--textarea">
                        <label class="hp-form__label">
                            <?php esc_html_e( 'Detailed Description', 'hivepress-listing-requests' ); ?>
                            <span class="hp-form__label--required">*</span>
                        </label>
                        <textarea name="description" class="hp-field hp-field--textarea" required 
                                  maxlength="2048" rows="5"
                                  placeholder="<?php esc_attr_e( 'Describe your ideal Umrah experience, specific dates, group details, etc.', 'hivepress-listing-requests' ); ?>"></textarea>
                    </div>

                    <!-- Special Requirements -->
                    <div class="hp-form__field hp-form__field--textarea">
                        <label class="hp-form__label">
                            <?php esc_html_e( 'Special Requirements', 'hivepress-listing-requests' ); ?>
                        </label>
                        <textarea name="special_requirements" class="hp-field hp-field--textarea" 
                                  maxlength="1024" rows="3"
                                  placeholder="<?php esc_attr_e( 'E.g., wheelchair access, dietary needs, connecting rooms for family', 'hivepress-listing-requests' ); ?>"></textarea>
                    </div>

                    <!-- Contact Phone -->
                    <div class="hp-form__field hp-form__field--phone">
                        <label class="hp-form__label">
                            <?php esc_html_e( 'Contact Phone (Optional)', 'hivepress-listing-requests' ); ?>
                        </label>
                        <input type="tel" name="contact_phone" class="hp-field hp-field--phone" 
                               placeholder="<?php esc_attr_e( '+90 555 123 4567', 'hivepress-listing-requests' ); ?>">
                        <small class="hp-form__description">
                            <?php esc_html_e( 'Organizers may contact you directly via phone', 'hivepress-listing-requests' ); ?>
                        </small>
                    </div>
                </div>

                <div class="hp-form__footer">
                    <button type="submit" class="hp-form__button button button--primary">
                        <span><?php esc_html_e( 'Submit Request', 'hivepress-listing-requests' ); ?></span>
                    </button>
                    
                    <p class="hp-form__notice">
                        <?php esc_html_e( 'Your request will be reviewed before being published. You will receive email notifications when organizers respond.', 'hivepress-listing-requests' ); ?>
                    </p>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
.hp-form__row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
}
.hp-form__label--required {
    color: #e53e3e;
}
.hp-form__notice {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #718096;
}
</style>
