<?php
/**
 * Plugin Name: Umrebuldum Tour Export
 * Description: Export Umrah tour plans as offline-ready single HTML files
 * Version: 1.0.0
 * Author: Umrebuldum
 * Text Domain: umrebuldum-tour-export
 *
 * @package Umrebuldum\TourExport
 */

namespace Umrebuldum\TourExport;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

define( 'UTE_VERSION', '1.0.0' );
define( 'UTE_PATH', plugin_dir_path( __FILE__ ) );
define( 'UTE_URL', plugin_dir_url( __FILE__ ) );

/**
 * Main Export Class
 */
class Tour_Exporter {

    /**
     * Instance
     */
    private static $instance = null;

    /**
     * Maximum image dimension for base64 encoding
     */
    const MAX_IMAGE_DIMENSION = 400;

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
        add_action( 'init', [ $this, 'register_endpoints' ] );
        add_action( 'admin_menu', [ $this, 'add_admin_menu' ] );
        add_action( 'wp_ajax_ute_export_tour', [ $this, 'ajax_export_tour' ] );
        add_action( 'wp_ajax_nopriv_ute_export_tour', [ $this, 'ajax_export_tour_public' ] );
        
        // Add export button to listing actions
        add_filter( 'hivepress/v1/templates/listing_view_page/blocks', [ $this, 'add_export_button' ], 100 );
    }

    /**
     * Register rewrite endpoints
     */
    public function register_endpoints() {
        add_rewrite_endpoint( 'export-tour', EP_PERMALINK );
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'hivepress',
            __( 'Tour Export', 'umrebuldum-tour-export' ),
            __( 'Tour Export', 'umrebuldum-tour-export' ),
            'manage_options',
            'umrebuldum-tour-export',
            [ $this, 'render_admin_page' ]
        );
    }

    /**
     * Render admin page
     */
    public function render_admin_page() {
        include UTE_PATH . 'templates/admin-page.php';
    }

    /**
     * Add export button to listing page
     */
    public function add_export_button( $blocks ) {
        $listing_id = get_the_ID();
        if ( ! $listing_id ) {
            return $blocks;
        }

        $export_url = add_query_arg([
            'action' => 'ute_export_tour',
            'listing_id' => $listing_id,
            '_wpnonce' => wp_create_nonce( 'ute_export_' . $listing_id ),
        ], admin_url( 'admin-ajax.php' ));

        $blocks['export_button'] = [
            'type'       => 'content',
            '_order'     => 100,
            'content'    => sprintf(
                '<a href="%s" class="hp-listing__action hp-listing__action--export button button--secondary" download>
                    📄 %s
                </a>',
                esc_url( $export_url ),
                esc_html__( 'Offline PDF İndir', 'umrebuldum-tour-export' )
            ),
        ];

        return $blocks;
    }

    /**
     * AJAX handler for public export
     */
    public function ajax_export_tour_public() {
        $listing_id = absint( $_GET['listing_id'] ?? 0 );
        
        if ( ! $listing_id ) {
            wp_die( 'Invalid listing' );
        }

        $listing = get_post( $listing_id );
        if ( ! $listing || $listing->post_status !== 'publish' ) {
            wp_die( 'Listing not found' );
        }

        $this->export_listing( $listing_id );
    }

    /**
     * AJAX handler for authenticated export
     */
    public function ajax_export_tour() {
        $listing_id = absint( $_GET['listing_id'] ?? 0 );
        
        // Verify nonce
        if ( ! wp_verify_nonce( $_GET['_wpnonce'] ?? '', 'ute_export_' . $listing_id ) ) {
            wp_die( 'Security check failed' );
        }

        $this->export_listing( $listing_id );
    }

    /**
     * Export listing as HTML
     */
    public function export_listing( $listing_id ) {
        $listing = get_post( $listing_id );
        if ( ! $listing ) {
            wp_die( 'Listing not found' );
        }

        // Gather all data
        $data = $this->gather_listing_data( $listing );

        // Generate HTML
        $html = $this->generate_html( $data );

        // Output as download
        $filename = sanitize_title( $data['title'] ) . '-tur-plani.html';
        
        header( 'Content-Type: text/html; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Content-Length: ' . strlen( $html ) );
        header( 'Cache-Control: no-cache, must-revalidate' );
        
        echo $html;
        exit;
    }

    /**
     * Gather all listing data
     */
    private function gather_listing_data( $listing ) {
        $listing_id = $listing->ID;

        // Basic info
        $data = [
            'id'          => $listing_id,
            'title'       => $listing->post_title,
            'description' => $listing->post_content,
            'excerpt'     => $listing->post_excerpt ?: wp_trim_words( $listing->post_content, 50 ),
            'url'         => get_permalink( $listing_id ),
            'export_date' => current_time( 'Y-m-d H:i' ),
        ];

        // Featured image
        $thumbnail_id = get_post_thumbnail_id( $listing_id );
        if ( $thumbnail_id ) {
            $data['featured_image'] = $this->image_to_base64( $thumbnail_id );
        }

        // Meta fields (HivePress style)
        $meta_keys = [
            'hp_price'           => 'price',
            'hp_price_extras'    => 'price_extras',
            'hp_duration'        => 'duration',
            'hp_departure_date'  => 'departure_date',
            'hp_return_date'     => 'return_date',
            'hp_departure_city'  => 'departure_city',
            'hp_hotel_mecca'     => 'hotel_mecca',
            'hp_hotel_medina'    => 'hotel_medina',
            'hp_hotel_address'   => 'hotel_address',
            'hp_included'        => 'included',
            'hp_not_included'    => 'not_included',
            'hp_itinerary'       => 'itinerary',
            // Emergency contact info
            'hp_guide_name'      => 'guide_name',
            'hp_guide_phone'     => 'guide_phone',
        ];

        foreach ( $meta_keys as $meta_key => $data_key ) {
            $value = get_post_meta( $listing_id, $meta_key, true );
            if ( $value ) {
                $data[ $data_key ] = $value;
            }
        }

        // Vendor/Organizer info
        $vendor_id = get_post_meta( $listing_id, 'hp_vendor', true );
        if ( $vendor_id ) {
            $vendor = get_post( $vendor_id );
            if ( $vendor ) {
                $data['organizer'] = [
                    'name'    => $vendor->post_title,
                    'phone'   => get_post_meta( $vendor_id, 'hp_phone', true ),
                    'email'   => get_post_meta( $vendor_id, 'hp_email', true ),
                    'address' => get_post_meta( $vendor_id, 'hp_address', true ),
                ];

                // Vendor logo
                $vendor_image = get_post_thumbnail_id( $vendor_id );
                if ( $vendor_image ) {
                    $data['organizer']['logo'] = $this->image_to_base64( $vendor_image, 100 );
                }
            }
        }

        // Parse itinerary if exists
        if ( ! empty( $data['itinerary'] ) ) {
            $data['days'] = $this->parse_itinerary( $data['itinerary'] );
        } else {
            // Generate sample days based on duration
            $data['days'] = $this->generate_sample_itinerary( $data );
        }

        // Gallery images (limited to 5, small size)
        $gallery = get_post_meta( $listing_id, 'hp_images', true );
        if ( is_array( $gallery ) ) {
            $data['gallery'] = [];
            $count = 0;
            foreach ( $gallery as $image_id ) {
                if ( $count >= 5 ) break;
                $base64 = $this->image_to_base64( $image_id, 200 );
                if ( $base64 ) {
                    $data['gallery'][] = $base64;
                    $count++;
                }
            }
        }

        return $data;
    }

    /**
     * Convert image to base64
     */
    private function image_to_base64( $attachment_id, $max_dimension = null ) {
        if ( ! $max_dimension ) {
            $max_dimension = self::MAX_IMAGE_DIMENSION;
        }

        $file_path = get_attached_file( $attachment_id );
        if ( ! $file_path || ! file_exists( $file_path ) ) {
            return null;
        }

        // Get image info
        $image_info = getimagesize( $file_path );
        if ( ! $image_info ) {
            return null;
        }

        $mime_type = $image_info['mime'];
        $width = $image_info[0];
        $height = $image_info[1];

        // Resize if needed
        if ( $width > $max_dimension || $height > $max_dimension ) {
            $image = wp_get_image_editor( $file_path );
            if ( ! is_wp_error( $image ) ) {
                $image->resize( $max_dimension, $max_dimension, false );
                
                // Save to temp file
                $temp_file = wp_tempnam( 'ute_' );
                $saved = $image->save( $temp_file, $mime_type );
                
                if ( ! is_wp_error( $saved ) ) {
                    $file_path = $saved['path'];
                }
            }
        }

        // Read and encode
        $image_data = file_get_contents( $file_path );
        if ( ! $image_data ) {
            return null;
        }

        return 'data:' . $mime_type . ';base64,' . base64_encode( $image_data );
    }

    /**
     * Parse itinerary from content
     */
    private function parse_itinerary( $itinerary ) {
        $days = [];

        // Try to parse as JSON first
        if ( is_string( $itinerary ) ) {
            $parsed = json_decode( $itinerary, true );
            if ( is_array( $parsed ) ) {
                $itinerary = $parsed;
            }
        }

        // If array, process each day
        if ( is_array( $itinerary ) ) {
            foreach ( $itinerary as $index => $day ) {
                $days[] = [
                    'day_number'  => $index + 1,
                    'title'       => $day['title'] ?? sprintf( __( '%d. Gün', 'umrebuldum-tour-export' ), $index + 1 ),
                    'description' => $day['description'] ?? $day['content'] ?? '',
                    'activities'  => $day['activities'] ?? [],
                    'meals'       => $day['meals'] ?? '',
                    'hotel'       => $day['hotel'] ?? '',
                    'location'    => $day['location'] ?? '',
                ];
            }
        }

        return $days;
    }

    /**
     * Generate sample itinerary based on duration
     */
    private function generate_sample_itinerary( $data ) {
        $duration = intval( $data['duration'] ?? 10 );
        $days = [];

        // Standard Umrah itinerary template
        $templates = [
            1 => [
                'title' => 'Türkiye\'den Hareket',
                'description' => 'Havalimanından uçuşumuz. Cidde\'ye varış ve Mekke\'ye transfer.',
                'location' => 'İstanbul → Cidde → Mekke',
            ],
            2 => [
                'title' => 'Mekke - Umre İbadetleri',
                'description' => 'Sabah dinlenme, öğleden sonra Umre ibadetleri. Tavaf ve Sa\'y.',
                'location' => 'Mekke - Harem-i Şerif',
            ],
            3 => [
                'title' => 'Mekke - Ziyaretler',
                'description' => 'Hira Dağı, Sevr Mağarası, Arafat ve Müzdelife ziyaretleri.',
                'location' => 'Mekke ve çevresi',
            ],
        ];

        for ( $i = 1; $i <= $duration; $i++ ) {
            if ( isset( $templates[ $i ] ) ) {
                $days[] = array_merge( [ 'day_number' => $i ], $templates[ $i ] );
            } elseif ( $i === $duration ) {
                $days[] = [
                    'day_number'  => $i,
                    'title'       => 'Dönüş',
                    'description' => 'Cidde Havalimanı\'na transfer ve Türkiye\'ye dönüş.',
                    'location'    => 'Cidde → İstanbul',
                ];
            } elseif ( $i <= ceil( $duration / 2 ) ) {
                $days[] = [
                    'day_number'  => $i,
                    'title'       => 'Mekke - Serbest Program',
                    'description' => 'Harem-i Şerif\'te ibadet, Kabe\'yi tavaf, namazlar.',
                    'location'    => 'Mekke - Harem-i Şerif',
                ];
            } else {
                $days[] = [
                    'day_number'  => $i,
                    'title'       => 'Medine - Ziyaretler',
                    'description' => 'Mescid-i Nebevi ziyareti, Ravza-i Mutahhara, Uhud Şehitliği.',
                    'location'    => 'Medine',
                ];
            }
        }

        return $days;
    }

    /**
     * Generate complete HTML document
     */
    private function generate_html( $data ) {
        ob_start();
        include UTE_PATH . 'templates/offline-tour.php';
        return ob_get_clean();
    }
}

// Initialize
Tour_Exporter::get_instance();

// Activation hook
register_activation_hook( __FILE__, function() {
    flush_rewrite_rules();
});

// Deactivation hook  
register_deactivation_hook( __FILE__, function() {
    flush_rewrite_rules();
});
