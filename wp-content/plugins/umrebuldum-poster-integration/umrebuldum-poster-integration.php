<?php
/**
 * Plugin Name: Umrebuldum Poster Integration
 * Description: Afiş servisine otomatik webhook gönderimi
 * Version: 1.0.0
 * Author: Umrebuldum Team
 */

defined('ABSPATH') || exit;

class Umrebuldum_Poster_Integration {
    
    private $poster_service_url;
    private $api_key;
    
    public function __construct() {
        $this->poster_service_url = defined('POSTER_SERVICE_URL') 
            ? POSTER_SERVICE_URL 
            : 'http://localhost:8001';
        $this->api_key = defined('POSTER_SERVICE_KEY') 
            ? POSTER_SERVICE_KEY 
            : '';
        
        // HivePress listing hooks
        add_action('hivepress/v1/models/listing/update_status', [$this, 'on_listing_status_change'], 10, 4);
        add_action('hivepress/v1/models/listing/create', [$this, 'on_listing_create'], 10, 2);
        
        // Admin menu
        add_action('admin_menu', [$this, 'add_admin_menu']);
        
        // AJAX handlers
        add_action('wp_ajax_regenerate_poster', [$this, 'ajax_regenerate_poster']);
        
        // Meta box for poster
        add_action('add_meta_boxes', [$this, 'add_poster_metabox']);
    }
    
    /**
     * İlan yayınlandığında afiş üret
     */
    public function on_listing_status_change($listing_id, $new_status, $old_status, $listing) {
        if ($new_status === 'publish' && $old_status !== 'publish') {
            $this->trigger_poster_generation($listing_id);
        }
    }
    
    /**
     * Yeni ilan oluşturulduğunda
     */
    public function on_listing_create($listing_id, $listing) {
        // Moderation kapalıysa hemen üret
        if ($listing->get_status() === 'publish') {
            $this->trigger_poster_generation($listing_id);
        }
    }
    
    /**
     * Poster servisine istek gönder
     */
    private function trigger_poster_generation($listing_id) {
        $listing = \HivePress\Models\Listing::query()->get_by_id($listing_id);
        
        if (!$listing) {
            return false;
        }
        
        $data = [
            'listing' => [
                'listing_id' => $listing_id,
                'title' => $listing->get_title(),
                'description' => wp_strip_all_tags($listing->get_description()),
                'price' => $this->get_listing_price($listing),
                'location' => $this->get_listing_location($listing),
                'category' => $this->get_listing_category($listing),
                'image_url' => $this->get_listing_image($listing),
            ],
            'template' => get_option('umrebuldum_poster_template', 'default'),
            'size' => 'instagram',
            'watermark' => true,
        ];
        
        $response = wp_remote_post($this->poster_service_url . '/api/v1/generate', [
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
            ],
            'body' => json_encode($data),
            'timeout' => 30,
        ]);
        
        if (is_wp_error($response)) {
            error_log('Poster service error: ' . $response->get_error_message());
            return false;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (!empty($body['job_id'])) {
            update_post_meta($listing_id, '_poster_job_id', $body['job_id']);
            update_post_meta($listing_id, '_poster_status', 'processing');
            return true;
        }
        
        return false;
    }
    
    /**
     * Listing helpers
     */
    private function get_listing_price($listing) {
        // HivePress'in fiyat field'ını kontrol et
        $price = $listing->get_price();
        return $price ? number_format($price, 0, ',', '.') . ' TL' : null;
    }
    
    private function get_listing_location($listing) {
        // Konum field'ı
        $location = $listing->get_location();
        return $location ?: null;
    }
    
    private function get_listing_category($listing) {
        $categories = $listing->get_categories();
        if ($categories && count($categories) > 0) {
            $cat = reset($categories);
            return $cat->get_name();
        }
        return null;
    }
    
    private function get_listing_image($listing) {
        $images = $listing->get_images();
        if ($images && count($images) > 0) {
            $image = reset($images);
            return wp_get_attachment_url($image->get_id());
        }
        return null;
    }
    
    /**
     * Admin Menu
     */
    public function add_admin_menu() {
        add_submenu_page(
            'hivepress',
            'Afiş Ayarları',
            'Afiş Ayarları',
            'manage_options',
            'umrebuldum-poster',
            [$this, 'render_admin_page']
        );
    }
    
    public function render_admin_page() {
        ?>
        <div class="wrap">
            <h1>Afiş Üretim Ayarları</h1>
            <form method="post" action="options.php">
                <?php settings_fields('umrebuldum_poster_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th>Varsayılan Şablon</th>
                        <td>
                            <select name="umrebuldum_poster_template">
                                <option value="default">Varsayılan</option>
                                <option value="modern">Modern</option>
                                <option value="umre">Umre Özel</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Otomatik Üretim</th>
                        <td>
                            <label>
                                <input type="checkbox" name="umrebuldum_poster_auto" value="1" 
                                    <?php checked(get_option('umrebuldum_poster_auto', 1)); ?>>
                                İlan yayınlandığında otomatik afiş üret
                            </label>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Meta Box
     */
    public function add_poster_metabox() {
        add_meta_box(
            'umrebuldum_poster',
            'İlan Afişi',
            [$this, 'render_poster_metabox'],
            'hp_listing',
            'side',
            'default'
        );
    }
    
    public function render_poster_metabox($post) {
        $poster_url = get_post_meta($post->ID, '_poster_url', true);
        $poster_status = get_post_meta($post->ID, '_poster_status', true);
        
        if ($poster_url) {
            echo '<img src="' . esc_url($poster_url) . '" style="max-width:100%;margin-bottom:10px;">';
            echo '<p><a href="' . esc_url($poster_url) . '" target="_blank" class="button">Afişi İndir</a></p>';
        } elseif ($poster_status === 'processing') {
            echo '<p>Afiş üretiliyor...</p>';
        } else {
            echo '<p>Afiş henüz üretilmedi.</p>';
        }
        
        echo '<button type="button" class="button" id="regenerate-poster" data-listing="' . $post->ID . '">Yeniden Üret</button>';
        
        ?>
        <script>
        jQuery('#regenerate-poster').on('click', function() {
            var btn = jQuery(this);
            btn.prop('disabled', true).text('Üretiliyor...');
            
            jQuery.post(ajaxurl, {
                action: 'regenerate_poster',
                listing_id: btn.data('listing'),
                _wpnonce: '<?php echo wp_create_nonce('regenerate_poster'); ?>'
            }, function(response) {
                btn.prop('disabled', false).text('Yeniden Üret');
                if (response.success) {
                    alert('Afiş üretimi başlatıldı!');
                } else {
                    alert('Hata: ' + response.data);
                }
            });
        });
        </script>
        <?php
    }
    
    /**
     * AJAX: Regenerate poster
     */
    public function ajax_regenerate_poster() {
        check_ajax_referer('regenerate_poster');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Yetkiniz yok');
        }
        
        $listing_id = intval($_POST['listing_id']);
        
        if ($this->trigger_poster_generation($listing_id)) {
            wp_send_json_success('Afiş üretimi başlatıldı');
        } else {
            wp_send_json_error('Afiş servisi hatası');
        }
    }
}

// Initialize
new Umrebuldum_Poster_Integration();

// Settings registration
add_action('admin_init', function() {
    register_setting('umrebuldum_poster_settings', 'umrebuldum_poster_template');
    register_setting('umrebuldum_poster_settings', 'umrebuldum_poster_auto');
});
