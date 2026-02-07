<?php
/**
 * HivePress Custom Fields for Emergency / Kayboldum Feature
 * 
 * Adds guide name, guide phone, and agency name fields to listings
 * for the offline emergency help feature.
 *
 * @package Umrebuldum\TourExport
 */

namespace Umrebuldum\TourExport;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * Register HivePress listing fields for emergency contact info
 */
class HivePress_Fields {

    /**
     * Instance
     */
    private static $instance = null;

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
        // Register custom listing attributes via HivePress filter
        add_filter( 'hivepress/v1/models/listing/attributes', [ $this, 'add_listing_attributes' ], 100 );
        
        // Alternative: Add meta boxes for admin edit screen
        add_action( 'add_meta_boxes', [ $this, 'add_emergency_meta_box' ] );
        add_action( 'save_post', [ $this, 'save_emergency_meta' ], 10, 2 );
    }

    /**
     * Add custom listing attributes for HivePress
     * 
     * @param array $attributes Existing attributes
     * @return array Modified attributes
     */
    public function add_listing_attributes( $attributes ) {
        
        // Guide Name
        $attributes['guide_name'] = [
            'editable'    => true,
            'searchable'  => false,
            'sortable'    => false,
            'label'       => __( 'Rehber Adı', 'umrebuldum-tour-export' ),
            'description' => __( 'Tur rehberinin adı soyadı (Acil durum ekranında gösterilir)', 'umrebuldum-tour-export' ),
            'type'        => 'text',
            'edit_field'  => [
                'label'       => __( 'Rehber Adı', 'umrebuldum-tour-export' ),
                'description' => __( 'Acil durum ekranında gösterilecek rehber adı', 'umrebuldum-tour-export' ),
                'type'        => 'text',
                'required'    => false,
                '_order'      => 150,
            ],
        ];

        // Guide Phone
        $attributes['guide_phone'] = [
            'editable'    => true,
            'searchable'  => false,
            'sortable'    => false,
            'label'       => __( 'Rehber Telefonu', 'umrebuldum-tour-export' ),
            'description' => __( 'Tur rehberinin telefon numarası (Acil durum ekranında gösterilir)', 'umrebuldum-tour-export' ),
            'type'        => 'text',
            'edit_field'  => [
                'label'       => __( 'Rehber Telefonu', 'umrebuldum-tour-export' ),
                'description' => __( 'Uluslararası formatta: +90 5XX XXX XX XX', 'umrebuldum-tour-export' ),
                'type'        => 'text',
                'required'    => false,
                '_order'      => 151,
            ],
        ];

        // Agency Name
        $attributes['agency_name'] = [
            'editable'    => true,
            'searchable'  => false,
            'sortable'    => false,
            'label'       => __( 'Organizasyon Adı', 'umrebuldum-tour-export' ),
            'description' => __( 'Tur organizasyonunun adı (Acil durum ekranında gösterilir)', 'umrebuldum-tour-export' ),
            'type'        => 'text',
            'edit_field'  => [
                'label'       => __( 'Organizasyon Adı', 'umrebuldum-tour-export' ),
                'description' => __( 'Acil durum ekranında gösterilecek organizasyon/acente adı', 'umrebuldum-tour-export' ),
                'type'        => 'text',
                'required'    => false,
                '_order'      => 152,
            ],
        ];

        return $attributes;
    }

    /**
     * Add meta box for emergency contact info (Admin edit screen fallback)
     */
    public function add_emergency_meta_box() {
        add_meta_box(
            'ute_emergency_info',
            __( '🆘 Acil Durum Bilgileri (Kayboldum)', 'umrebuldum-tour-export' ),
            [ $this, 'render_emergency_meta_box' ],
            'hp_listing', // HivePress listing post type
            'side',
            'high'
        );
    }

    /**
     * Render emergency info meta box
     *
     * @param \WP_Post $post Current post object
     */
    public function render_emergency_meta_box( $post ) {
        // Nonce for security
        wp_nonce_field( 'ute_emergency_meta', 'ute_emergency_nonce' );

        // Get existing values
        $guide_name  = get_post_meta( $post->ID, 'hp_guide_name', true );
        $guide_phone = get_post_meta( $post->ID, 'hp_guide_phone', true );
        $agency_name = get_post_meta( $post->ID, 'hp_agency_name', true );

        ?>
        <style>
            .ute-meta-field {
                margin-bottom: 12px;
            }
            .ute-meta-field label {
                display: block;
                font-weight: 600;
                margin-bottom: 4px;
                color: #1e3a5f;
            }
            .ute-meta-field input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .ute-meta-field small {
                display: block;
                color: #666;
                font-size: 11px;
                margin-top: 4px;
            }
            .ute-meta-info {
                background: #fff8e1;
                border-left: 3px solid #ffc107;
                padding: 8px;
                margin-bottom: 12px;
                font-size: 12px;
            }
        </style>
        
        <div class="ute-meta-info">
            <strong>📋 Not:</strong> Bu bilgiler offline HTML'de "Kayboldum" acil yardım ekranında gösterilir.
        </div>

        <div class="ute-meta-field">
            <label for="ute_guide_name">👤 Rehber Adı</label>
            <input type="text" 
                   id="ute_guide_name" 
                   name="ute_guide_name" 
                   value="<?php echo esc_attr( $guide_name ); ?>" 
                   placeholder="Örn: Ahmet Yılmaz">
            <small>Tur rehberinin adı soyadı</small>
        </div>

        <div class="ute-meta-field">
            <label for="ute_guide_phone">📞 Rehber Telefonu</label>
            <input type="tel" 
                   id="ute_guide_phone" 
                   name="ute_guide_phone" 
                   value="<?php echo esc_attr( $guide_phone ); ?>" 
                   placeholder="+90 5XX XXX XX XX">
            <small>Uluslararası format önerilir</small>
        </div>

        <div class="ute-meta-field">
            <label for="ute_agency_name">🏢 Organizasyon Adı</label>
            <input type="text" 
                   id="ute_agency_name" 
                   name="ute_agency_name" 
                   value="<?php echo esc_attr( $agency_name ); ?>" 
                   placeholder="Örn: ABC Turizm">
            <small>Tur organizasyonu / acente adı</small>
        </div>
        <?php
    }

    /**
     * Save emergency meta data
     *
     * @param int      $post_id Post ID
     * @param \WP_Post $post    Post object
     */
    public function save_emergency_meta( $post_id, $post ) {
        // Check nonce
        if ( ! isset( $_POST['ute_emergency_nonce'] ) || 
             ! wp_verify_nonce( $_POST['ute_emergency_nonce'], 'ute_emergency_meta' ) ) {
            return;
        }

        // Check autosave
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        // Check post type
        if ( $post->post_type !== 'hp_listing' ) {
            return;
        }

        // Check permissions
        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        // Save guide name
        if ( isset( $_POST['ute_guide_name'] ) ) {
            update_post_meta( $post_id, 'hp_guide_name', sanitize_text_field( $_POST['ute_guide_name'] ) );
        }

        // Save guide phone
        if ( isset( $_POST['ute_guide_phone'] ) ) {
            update_post_meta( $post_id, 'hp_guide_phone', sanitize_text_field( $_POST['ute_guide_phone'] ) );
        }

        // Save agency name
        if ( isset( $_POST['ute_agency_name'] ) ) {
            update_post_meta( $post_id, 'hp_agency_name', sanitize_text_field( $_POST['ute_agency_name'] ) );
        }
    }
}

// Initialize
HivePress_Fields::get_instance();
