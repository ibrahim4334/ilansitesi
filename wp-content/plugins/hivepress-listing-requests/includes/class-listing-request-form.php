<?php
/**
 * Listing Request Forms
 *
 * @package HivePress\Extensions\ListingRequests
 */

namespace HivePress\Extensions\ListingRequests\Forms;

use HivePress\Helpers as hp;
use HivePress\Forms;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Listing Request Submit Form
 */
class Listing_Request_Submit extends Forms\Form {

    /**
     * Form name
     *
     * @var string
     */
    protected static $name = 'listing_request_submit';

    /**
     * Form fields
     *
     * @var array
     */
    protected static $fields = [];

    /**
     * Initialize form
     */
    public static function init() {
        self::$fields = [
            'title' => [
                'label'       => esc_html__( 'Request Title', 'hivepress-listing-requests' ),
                'description' => esc_html__( 'Briefly describe what you are looking for', 'hivepress-listing-requests' ),
                'type'        => 'text',
                'required'    => true,
                'max_length'  => 256,
                '_order'      => 10,
            ],

            'destination' => [
                'label'    => esc_html__( 'Destination', 'hivepress-listing-requests' ),
                'type'     => 'select',
                'options'  => [
                    ''       => esc_html__( 'Select destination', 'hivepress-listing-requests' ),
                    'mecca'  => esc_html__( 'Mecca Only', 'hivepress-listing-requests' ),
                    'medina' => esc_html__( 'Medina Only', 'hivepress-listing-requests' ),
                    'both'   => esc_html__( 'Both Mecca & Medina', 'hivepress-listing-requests' ),
                ],
                'required' => true,
                '_order'   => 20,
            ],

            'travel_date' => [
                'label'       => esc_html__( 'Preferred Travel Date', 'hivepress-listing-requests' ),
                'description' => esc_html__( 'When do you want to travel?', 'hivepress-listing-requests' ),
                'type'        => 'date',
                'min_date'    => 'today',
                'required'    => true,
                '_order'      => 30,
            ],

            'duration' => [
                'label'       => esc_html__( 'Duration (days)', 'hivepress-listing-requests' ),
                'type'        => 'number',
                'min'         => 5,
                'max'         => 30,
                'default'     => 10,
                'required'    => true,
                '_order'      => 40,
            ],

            'travelers' => [
                'label'       => esc_html__( 'Number of Travelers', 'hivepress-listing-requests' ),
                'type'        => 'number',
                'min'         => 1,
                'max'         => 50,
                'default'     => 1,
                'required'    => true,
                '_order'      => 50,
            ],

            'budget_min' => [
                'label'       => esc_html__( 'Minimum Budget (USD)', 'hivepress-listing-requests' ),
                'type'        => 'number',
                'min'         => 0,
                '_order'      => 60,
            ],

            'budget_max' => [
                'label'       => esc_html__( 'Maximum Budget (USD)', 'hivepress-listing-requests' ),
                'type'        => 'number',
                'min'         => 0,
                '_order'      => 70,
            ],

            'hotel_preference' => [
                'label'   => esc_html__( 'Hotel Preference', 'hivepress-listing-requests' ),
                'type'    => 'select',
                'options' => [
                    ''         => esc_html__( 'No preference', 'hivepress-listing-requests' ),
                    'economy'  => esc_html__( '3 Star (Economy)', 'hivepress-listing-requests' ),
                    'standard' => esc_html__( '4 Star (Standard)', 'hivepress-listing-requests' ),
                    'luxury'   => esc_html__( '5 Star (Luxury)', 'hivepress-listing-requests' ),
                ],
                '_order'  => 80,
            ],

            'description' => [
                'label'       => esc_html__( 'Detailed Description', 'hivepress-listing-requests' ),
                'description' => esc_html__( 'Describe any specific requirements or preferences', 'hivepress-listing-requests' ),
                'type'        => 'textarea',
                'required'    => true,
                'max_length'  => 2048,
                '_order'      => 90,
            ],

            'special_requirements' => [
                'label'       => esc_html__( 'Special Requirements', 'hivepress-listing-requests' ),
                'description' => esc_html__( 'E.g., wheelchair access, dietary needs, family rooms', 'hivepress-listing-requests' ),
                'type'        => 'textarea',
                'max_length'  => 1024,
                '_order'      => 100,
            ],

            'contact_phone' => [
                'label'       => esc_html__( 'Contact Phone', 'hivepress-listing-requests' ),
                'description' => esc_html__( 'Optional - organizers can contact you directly', 'hivepress-listing-requests' ),
                'type'        => 'phone',
                '_order'      => 110,
            ],
        ];

        parent::init();
    }

    /**
     * Get form button
     *
     * @return array
     */
    public function get_button(): array {
        return [
            'label' => esc_html__( 'Submit Request', 'hivepress-listing-requests' ),
        ];
    }
}

// Initialize form
Listing_Request_Submit::init();

/**
 * Listing Request Respond Form
 */
class Listing_Request_Respond extends Forms\Form {

    /**
     * Form name
     *
     * @var string
     */
    protected static $name = 'listing_request_respond';

    /**
     * Form fields
     *
     * @var array
     */
    protected static $fields = [];

    /**
     * Initialize form
     */
    public static function init() {
        self::$fields = [
            'listing_id' => [
                'label'       => esc_html__( 'Select Your Listing', 'hivepress-listing-requests' ),
                'description' => esc_html__( 'Optional - recommend one of your tours', 'hivepress-listing-requests' ),
                'type'        => 'select',
                'options'     => 'listings', // Will be populated dynamically
                '_order'      => 10,
            ],

            'message' => [
                'label'       => esc_html__( 'Your Response', 'hivepress-listing-requests' ),
                'description' => esc_html__( 'Introduce yourself and explain how you can help', 'hivepress-listing-requests' ),
                'type'        => 'textarea',
                'required'    => true,
                'min_length'  => 20,
                'max_length'  => 2000,
                '_order'      => 20,
            ],

            'price_quote' => [
                'label'       => esc_html__( 'Price Quote (per person)', 'hivepress-listing-requests' ),
                'type'        => 'currency',
                '_order'      => 30,
            ],
        ];

        parent::init();
    }

    /**
     * Get form button
     *
     * @return array
     */
    public function get_button(): array {
        return [
            'label' => esc_html__( 'Send Response', 'hivepress-listing-requests' ),
        ];
    }
}

// Initialize form
Listing_Request_Respond::init();
