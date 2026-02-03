<?php
/**
 * Listing Request Controller
 *
 * @package HivePress\Extensions\ListingRequests
 */

namespace HivePress\Extensions\ListingRequests\Controllers;

use HivePress\Helpers as hp;
use HivePress\Controllers;
use HivePress\Models;
use HivePress\Forms;
use HivePress\Blocks;
use HivePress\Extensions\ListingRequests\Models\Listing_Request;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Listing Request controller class
 */
final class Listing_Request extends Controllers\Controller {

    /**
     * Class constructor
     *
     * @param array $args Controller arguments.
     */
    public function __construct( $args = [] ) {
        $args = hp\merge_arrays(
            [
                'routes' => [
                    // REST API endpoints
                    'listing_requests_resource' => [
                        'path'   => '/listing-requests',
                        'method' => 'GET',
                        'action' => [ $this, 'get_listing_requests' ],
                        'rest'   => true,
                    ],

                    'listing_request_resource' => [
                        'base' => 'listing_requests_resource',
                        'path' => '/(?P<listing_request_id>\d+)',
                        'rest' => true,
                    ],

                    'listing_request_submit_action' => [
                        'base'   => 'listing_requests_resource',
                        'method' => 'POST',
                        'action' => [ $this, 'submit_listing_request' ],
                        'rest'   => true,
                    ],

                    'listing_request_respond_action' => [
                        'base'   => 'listing_request_resource',
                        'path'   => '/respond',
                        'method' => 'POST',
                        'action' => [ $this, 'respond_to_request' ],
                        'rest'   => true,
                    ],

                    // Frontend pages
                    'listing_requests_view_page' => [
                        'title'    => esc_html__( 'My Requests', 'hivepress-listing-requests' ),
                        'base'     => 'user_account_page',
                        'path'     => '/requests',
                        'redirect' => [ $this, 'redirect_listing_requests_page' ],
                        'action'   => [ $this, 'render_listing_requests_page' ],
                    ],

                    'listing_request_view_page' => [
                        'base'     => 'listing_requests_view_page',
                        'path'     => '/(?P<listing_request_id>\d+)',
                        'title'    => [ $this, 'get_request_title' ],
                        'redirect' => [ $this, 'redirect_listing_request_page' ],
                        'action'   => [ $this, 'render_listing_request_page' ],
                    ],

                    'listing_request_submit_page' => [
                        'title'    => esc_html__( 'Submit Request', 'hivepress-listing-requests' ),
                        'path'     => '/submit-request',
                        'redirect' => [ $this, 'redirect_submit_page' ],
                        'action'   => [ $this, 'render_submit_page' ],
                    ],

                    // Organizer/Vendor pages
                    'listing_requests_incoming_page' => [
                        'title'    => esc_html__( 'Incoming Requests', 'hivepress-listing-requests' ),
                        'base'     => 'user_account_page',
                        'path'     => '/incoming-requests',
                        'redirect' => [ $this, 'redirect_incoming_requests_page' ],
                        'action'   => [ $this, 'render_incoming_requests_page' ],
                    ],
                ],
            ],
            $args
        );

        parent::__construct( $args );
    }

    /**
     * Get listing requests (REST API)
     *
     * @param \WP_REST_Request $request API request.
     * @return \WP_REST_Response
     */
    public function get_listing_requests( $request ) {
        // Check authentication for non-public access
        $status = sanitize_text_field( $request->get_param( 'status' ) );
        
        // Build query
        $query_args = [
            'status__in' => [ 'hp_active', 'publish' ],
        ];

        // Filter by user if specified
        if ( $request->get_param( 'user_id' ) ) {
            if ( ! is_user_logged_in() ) {
                return hp\rest_error( 401 );
            }
            $query_args['user'] = absint( $request->get_param( 'user_id' ) );
        }

        // Filter by destination
        if ( $request->get_param( 'destination' ) ) {
            $query_args['destination'] = sanitize_text_field( $request->get_param( 'destination' ) );
        }

        // Get requests
        $requests = Listing_Request::query()
            ->filter( $query_args )
            ->order( [ 'created_date' => 'desc' ] )
            ->limit( 20 )
            ->get();

        // Format response
        $results = [];
        foreach ( $requests as $req ) {
            $results[] = [
                'id'          => $req->get_id(),
                'title'       => $req->get_title(),
                'description' => wp_trim_words( $req->get_description(), 30 ),
                'destination' => $req->get_destination(),
                'travel_date' => $req->get_travel_date(),
                'duration'    => $req->get_duration(),
                'travelers'   => $req->get_travelers(),
                'budget_min'  => $req->get_budget_min(),
                'budget_max'  => $req->get_budget_max(),
                'hotel'       => $req->get_hotel_preference(),
                'created'     => $req->get_created_date(),
                'responses'   => $req->get_response_count(),
            ];
        }

        return hp\rest_response( 200, $results );
    }

    /**
     * Submit new listing request (REST API)
     *
     * @param \WP_REST_Request $request API request.
     * @return \WP_REST_Response
     */
    public function submit_listing_request( $request ) {
        // Check authentication
        if ( ! is_user_logged_in() ) {
            return hp\rest_error( 401 );
        }

        // Validate form
        $form = new Forms\Listing_Request_Submit();
        $form->set_values( $request->get_params() );

        if ( ! $form->validate() ) {
            return hp\rest_error( 400, $form->get_errors() );
        }

        // Create request
        $listing_request = new Listing_Request();
        $listing_request->fill( $form->get_values() );
        $listing_request->set_user( get_current_user_id() );
        $listing_request->set_status( 'hp_pending' ); // Needs moderation
        
        // Set expiry (30 days from now)
        $listing_request->set_expires_at( date( 'Y-m-d', strtotime( '+30 days' ) ) );

        if ( ! $listing_request->save() ) {
            return hp\rest_error( 400, $listing_request->_get_errors() );
        }

        // Trigger hook
        do_action( 'hivepress/v1/models/listing_request/create', $listing_request->get_id(), $listing_request );

        return hp\rest_response( 201, [
            'id' => $listing_request->get_id(),
        ]);
    }

    /**
     * Respond to listing request (REST API)
     *
     * @param \WP_REST_Request $request API request.
     * @return \WP_REST_Response
     */
    public function respond_to_request( $request ) {
        // Check authentication
        if ( ! is_user_logged_in() ) {
            return hp\rest_error( 401 );
        }

        // Check if user is a vendor
        $vendor = Models\Vendor::query()->filter([
            'user' => get_current_user_id(),
            'status' => 'publish',
        ])->get_first();

        if ( ! $vendor ) {
            return hp\rest_error( 403, esc_html__( 'Only verified organizers can respond to requests.', 'hivepress-listing-requests' ) );
        }

        // Get listing request
        $listing_request = Listing_Request::query()->get_by_id( $request->get_param( 'listing_request_id' ) );

        if ( ! $listing_request || ! $listing_request->is_active() ) {
            return hp\rest_error( 404 );
        }

        // Validate response
        $message = sanitize_textarea_field( $request->get_param( 'message' ) );
        $listing_id = absint( $request->get_param( 'listing_id' ) );

        if ( empty( $message ) || strlen( $message ) < 20 ) {
            return hp\rest_error( 400, esc_html__( 'Response message must be at least 20 characters.', 'hivepress-listing-requests' ) );
        }

        // Check if vendor owns the listing
        if ( $listing_id ) {
            $listing = Models\Listing::query()->get_by_id( $listing_id );
            if ( ! $listing || $listing->get_user__id() !== get_current_user_id() ) {
                return hp\rest_error( 403, esc_html__( 'Invalid listing.', 'hivepress-listing-requests' ) );
            }
        }

        // Store response as comment
        $comment_id = wp_insert_comment([
            'comment_post_ID'      => $listing_request->get_id(),
            'comment_author'       => $vendor->get_title(),
            'comment_author_email' => wp_get_current_user()->user_email,
            'comment_content'      => $message,
            'comment_type'         => 'hp_request_response',
            'comment_approved'     => 1,
            'user_id'              => get_current_user_id(),
            'comment_meta'         => [
                'vendor_id'   => $vendor->get_id(),
                'listing_id'  => $listing_id,
            ],
        ]);

        if ( ! $comment_id ) {
            return hp\rest_error( 500 );
        }

        // Update request
        $listing_request->increment_responses();
        
        if ( $listing_request->get_status() === 'hp_pending' || $listing_request->get_status() === 'hp_active' ) {
            $listing_request->set_status( 'hp_responded' );
            $listing_request->save();
        }

        // Trigger hook
        do_action( 'hivepress/v1/models/listing_request/update', $listing_request->get_id(), $listing_request );

        return hp\rest_response( 200, [
            'id' => $comment_id,
        ]);
    }

    /**
     * Redirect listing requests page
     *
     * @return mixed
     */
    public function redirect_listing_requests_page() {
        if ( ! is_user_logged_in() ) {
            return hivepress()->router->get_return_url( 'user_login_page' );
        }
        return false;
    }

    /**
     * Render listing requests page
     *
     * @return string
     */
    public function render_listing_requests_page() {
        // Get user's requests
        $requests = Listing_Request::query()
            ->filter([
                'user' => get_current_user_id(),
            ])
            ->order([ 'created_date' => 'desc' ])
            ->limit( 20 )
            ->get();

        hivepress()->request->set_context( 'listing_requests', $requests );

        return ( new Blocks\Template([
            'template' => 'listing_requests_view_page',
            'context'  => [
                'listing_requests' => $requests,
            ],
        ]) )->render();
    }

    /**
     * Redirect incoming requests page
     *
     * @return mixed
     */
    public function redirect_incoming_requests_page() {
        if ( ! is_user_logged_in() ) {
            return hivepress()->router->get_return_url( 'user_login_page' );
        }

        // Check if user is a vendor
        $vendor = Models\Vendor::query()->filter([
            'user' => get_current_user_id(),
            'status' => 'publish',
        ])->get_first();

        if ( ! $vendor ) {
            return hivepress()->router->get_url( 'user_account_page' );
        }

        return false;
    }

    /**
     * Render incoming requests page
     *
     * @return string
     */
    public function render_incoming_requests_page() {
        // Get active requests
        $requests = Listing_Request::query()
            ->filter([
                'status__in' => [ 'hp_active', 'hp_pending', 'publish' ],
            ])
            ->order([ 'created_date' => 'desc' ])
            ->limit( 50 )
            ->get();

        return ( new Blocks\Template([
            'template' => 'listing_requests_view_page',
            'context'  => [
                'listing_requests' => $requests,
                'is_vendor_view'   => true,
            ],
        ]) )->render();
    }

    /**
     * Redirect submit page
     *
     * @return mixed
     */
    public function redirect_submit_page() {
        if ( ! is_user_logged_in() ) {
            return hivepress()->router->get_return_url( 'user_login_page' );
        }
        return false;
    }

    /**
     * Render submit page
     *
     * @return string
     */
    public function render_submit_page() {
        return ( new Blocks\Template([
            'template' => 'listing_request_submit_page',
        ]) )->render();
    }

    /**
     * Get request title
     *
     * @return string
     */
    public function get_request_title() {
        $request = Listing_Request::query()->get_by_id( hivepress()->request->get_param( 'listing_request_id' ) );
        return $request ? $request->get_title() : '';
    }

    /**
     * Redirect listing request page
     *
     * @return mixed
     */
    public function redirect_listing_request_page() {
        $request = Listing_Request::query()->get_by_id( hivepress()->request->get_param( 'listing_request_id' ) );

        if ( ! $request ) {
            return hivepress()->router->get_url( 'listing_requests_view_page' );
        }

        // Check permissions
        if ( ! is_user_logged_in() ) {
            return hivepress()->router->get_return_url( 'user_login_page' );
        }

        // Owner or vendor can view
        $is_owner = $request->get_user__id() === get_current_user_id();
        $vendor = Models\Vendor::query()->filter([
            'user' => get_current_user_id(),
            'status' => 'publish',
        ])->get_first();

        if ( ! $is_owner && ! $vendor && ! current_user_can( 'manage_options' ) ) {
            return hivepress()->router->get_url( 'user_account_page' );
        }

        hivepress()->request->set_context( 'listing_request', $request );
        hivepress()->request->set_context( 'is_owner', $is_owner );
        hivepress()->request->set_context( 'vendor', $vendor );

        return false;
    }

    /**
     * Render listing request page
     *
     * @return string
     */
    public function render_listing_request_page() {
        $request = hivepress()->request->get_context( 'listing_request' );

        // Get responses
        $responses = get_comments([
            'post_id'      => $request->get_id(),
            'comment_type' => 'hp_request_response',
            'status'       => 'approve',
        ]);

        return ( new Blocks\Template([
            'template' => 'listing_request_view_page',
            'context'  => [
                'listing_request' => $request,
                'responses'       => $responses,
                'is_owner'        => hivepress()->request->get_context( 'is_owner' ),
                'vendor'          => hivepress()->request->get_context( 'vendor' ),
            ],
        ]) )->render();
    }
}
