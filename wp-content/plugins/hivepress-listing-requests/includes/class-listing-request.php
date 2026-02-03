<?php
/**
 * Listing Request Model
 *
 * @package HivePress\Extensions\ListingRequests
 */

namespace HivePress\Extensions\ListingRequests\Models;

use HivePress\Helpers as hp;
use HivePress\Models;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Listing Request model class
 */
class Listing_Request extends Models\Post {

    /**
     * Post type name
     *
     * @var string
     */
    protected static $post_type = 'hp_listing_request';

    /**
     * Model fields
     *
     * @var array
     */
    protected static $fields = [];

    /**
     * Initialize model
     */
    public static function init() {
        // Register post type
        add_action( 'init', [ __CLASS__, 'register_post_type' ] );

        // Set fields
        self::$fields = [
            'title' => [
                'label'    => esc_html__( 'Title', 'hivepress-listing-requests' ),
                'type'     => 'text',
                'required' => true,
                'max_length' => 256,
                '_alias'   => 'post_title',
            ],

            'description' => [
                'label'    => esc_html__( 'Description', 'hivepress-listing-requests' ),
                'type'     => 'textarea',
                'required' => true,
                'max_length' => 2048,
                '_alias'   => 'post_content',
            ],

            'status' => [
                'type'    => 'text',
                '_alias'  => 'post_status',
            ],

            'created_date' => [
                'type'    => 'date',
                '_alias'  => 'post_date',
            ],

            'user' => [
                'type'   => 'id',
                '_alias' => 'post_author',
                '_model' => 'user',
            ],

            // Custom meta fields
            'destination' => [
                'label'    => esc_html__( 'Destination', 'hivepress-listing-requests' ),
                'type'     => 'select',
                'options'  => [
                    'mecca'   => esc_html__( 'Mecca', 'hivepress-listing-requests' ),
                    'medina'  => esc_html__( 'Medina', 'hivepress-listing-requests' ),
                    'both'    => esc_html__( 'Both', 'hivepress-listing-requests' ),
                ],
                'required' => true,
                '_external' => true,
            ],

            'travel_date' => [
                'label'    => esc_html__( 'Preferred Travel Date', 'hivepress-listing-requests' ),
                'type'     => 'date',
                'required' => true,
                '_external' => true,
            ],

            'duration' => [
                'label'    => esc_html__( 'Duration (days)', 'hivepress-listing-requests' ),
                'type'     => 'number',
                'min'      => 5,
                'max'      => 30,
                'required' => true,
                '_external' => true,
            ],

            'travelers' => [
                'label'    => esc_html__( 'Number of Travelers', 'hivepress-listing-requests' ),
                'type'     => 'number',
                'min'      => 1,
                'max'      => 50,
                'required' => true,
                '_external' => true,
            ],

            'budget_min' => [
                'label'    => esc_html__( 'Minimum Budget', 'hivepress-listing-requests' ),
                'type'     => 'currency',
                '_external' => true,
            ],

            'budget_max' => [
                'label'    => esc_html__( 'Maximum Budget', 'hivepress-listing-requests' ),
                'type'     => 'currency',
                '_external' => true,
            ],

            'hotel_preference' => [
                'label'   => esc_html__( 'Hotel Preference', 'hivepress-listing-requests' ),
                'type'    => 'select',
                'options' => [
                    'economy'  => esc_html__( '3 Star', 'hivepress-listing-requests' ),
                    'standard' => esc_html__( '4 Star', 'hivepress-listing-requests' ),
                    'luxury'   => esc_html__( '5 Star', 'hivepress-listing-requests' ),
                    'any'      => esc_html__( 'Any', 'hivepress-listing-requests' ),
                ],
                '_external' => true,
            ],

            'special_requirements' => [
                'label'    => esc_html__( 'Special Requirements', 'hivepress-listing-requests' ),
                'type'     => 'textarea',
                'max_length' => 1024,
                '_external' => true,
            ],

            'contact_phone' => [
                'label'    => esc_html__( 'Contact Phone', 'hivepress-listing-requests' ),
                'type'     => 'phone',
                '_external' => true,
            ],

            'response_count' => [
                'label'    => esc_html__( 'Response Count', 'hivepress-listing-requests' ),
                'type'     => 'number',
                'default'  => 0,
                '_external' => true,
            ],

            'expires_at' => [
                'label'    => esc_html__( 'Expires At', 'hivepress-listing-requests' ),
                'type'     => 'date',
                '_external' => true,
            ],
        ];

        parent::init();
    }

    /**
     * Register post type
     */
    public static function register_post_type() {
        register_post_type(
            self::$post_type,
            [
                'labels' => [
                    'name'               => esc_html__( 'Listing Requests', 'hivepress-listing-requests' ),
                    'singular_name'      => esc_html__( 'Listing Request', 'hivepress-listing-requests' ),
                    'add_new'            => esc_html__( 'Add New', 'hivepress-listing-requests' ),
                    'add_new_item'       => esc_html__( 'Add New Request', 'hivepress-listing-requests' ),
                    'edit_item'          => esc_html__( 'Edit Request', 'hivepress-listing-requests' ),
                    'view_item'          => esc_html__( 'View Request', 'hivepress-listing-requests' ),
                    'all_items'          => esc_html__( 'All Requests', 'hivepress-listing-requests' ),
                    'search_items'       => esc_html__( 'Search Requests', 'hivepress-listing-requests' ),
                ],
                'public'              => false,
                'show_ui'             => true,
                'show_in_menu'        => 'hivepress',
                'show_in_admin_bar'   => false,
                'show_in_rest'        => true,
                'supports'            => [ 'title', 'editor', 'author' ],
                'has_archive'         => false,
                'rewrite'             => false,
                'capability_type'     => 'post',
                'map_meta_cap'        => true,
            ]
        );

        // Register post statuses
        register_post_status( 'hp_pending', [
            'label'                     => esc_html__( 'Pending Review', 'hivepress-listing-requests' ),
            'public'                    => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
        ]);

        register_post_status( 'hp_active', [
            'label'                     => esc_html__( 'Active', 'hivepress-listing-requests' ),
            'public'                    => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
        ]);

        register_post_status( 'hp_responded', [
            'label'                     => esc_html__( 'Responded', 'hivepress-listing-requests' ),
            'public'                    => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
        ]);

        register_post_status( 'hp_closed', [
            'label'                     => esc_html__( 'Closed', 'hivepress-listing-requests' ),
            'public'                    => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
        ]);

        register_post_status( 'hp_expired', [
            'label'                     => esc_html__( 'Expired', 'hivepress-listing-requests' ),
            'public'                    => false,
            'show_in_admin_all_list'    => true,
            'show_in_admin_status_list' => true,
        ]);
    }

    /**
     * Check if request is active
     *
     * @return bool
     */
    public function is_active(): bool {
        return in_array( $this->get_status(), [ 'hp_active', 'publish' ], true );
    }

    /**
     * Check if request has expired
     *
     * @return bool
     */
    public function is_expired(): bool {
        $expires = $this->get_expires_at();
        if ( $expires && strtotime( $expires ) < time() ) {
            return true;
        }
        return $this->get_status() === 'hp_expired';
    }

    /**
     * Increment response count
     */
    public function increment_responses(): void {
        $count = (int) $this->get_response_count();
        $this->set_response_count( $count + 1 );
        $this->save();
    }
}

// Initialize model
Listing_Request::init();
