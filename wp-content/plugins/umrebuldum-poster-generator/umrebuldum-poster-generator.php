<?php
/**
 * Plugin Name: Umrebuldum Poster Generator
 * Description: İlanlar için otomatik afiş üretimi (Modüler Mimari)
 * Version: 2.0.0
 * Author: Umrebuldum Team
 * Requires PHP: 7.4
 */

defined('ABSPATH') || exit;

// Plugin sabitleri
define('UPG_VERSION', '2.0.0');
define('UPG_PATH', plugin_dir_path(__FILE__));
define('UPG_URL', plugin_dir_url(__FILE__));
define('UPG_ASSETS', UPG_URL . 'assets/');

/**
 * Autoloader
 */
spl_autoload_register(function ($class) {
    $prefix = 'Umrebuldum\\Poster\\';
    
    if (strpos($class, $prefix) !== 0) {
        return;
    }
    
    $relative_class = substr($class, strlen($prefix));
    $relative_class = strtolower(str_replace('_', '-', $relative_class));
    
    // Interface kontrolü
    if (strpos($relative_class, 'interface') !== false) {
        $file = UPG_PATH . 'includes/interface-' . str_replace('interface-', '', $relative_class) . '.php';
    } else {
        $file = UPG_PATH . 'includes/class-' . $relative_class . '.php';
    }
    
    // Admin sınıfları
    if (strpos($relative_class, 'admin') !== false) {
        $file = UPG_PATH . 'admin/class-' . $relative_class . '.php';
    }
    
    if (file_exists($file)) {
        require_once $file;
    }
});

/**
 * Plugin başlatıcı
 */
final class Umrebuldum_Poster_Plugin {
    
    private static $instance = null;
    private $generator;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    private function load_dependencies() {
        // Core
        require_once UPG_PATH . 'includes/interface-generator.php';
        require_once UPG_PATH . 'includes/class-templates.php';
        require_once UPG_PATH . 'includes/class-cache.php';
        require_once UPG_PATH . 'includes/class-rate-limiter.php';
        require_once UPG_PATH . 'includes/class-image-processor.php';
        require_once UPG_PATH . 'includes/class-access-control.php'; // Free/Pro tier
        require_once UPG_PATH . 'includes/class-usage-tracker.php';  // Usage metrics & friction
        require_once UPG_PATH . 'includes/class-offer-engine.php';   // Multi-plan pricing
        require_once UPG_PATH . 'includes/class-upgrade-funnel.php'; // Conversion
        require_once UPG_PATH . 'includes/class-gd-generator.php';
        require_once UPG_PATH . 'includes/class-api-generator.php';
        require_once UPG_PATH . 'includes/class-rest-api.php';
        
        // Admin
        if (is_admin()) {
            require_once UPG_PATH . 'admin/class-admin.php';
            require_once UPG_PATH . 'admin/class-metabox.php';
        }
    }
    
    private function init_hooks() {
        // Generator'ı belirle (MVP: GD, Phase 3: API)
        $this->generator = $this->get_generator();
        
        // Core hooks
        add_action('hivepress/v1/models/listing/update_status', [$this, 'on_listing_publish'], 10, 4);
        add_action('init', [$this, 'create_upload_dir']);
        
        // REST API
        add_action('rest_api_init', function() {
            $rest = new Umrebuldum\Poster\Rest_API($this->generator);
            $rest->register_routes();
        });
        
        // Admin
        if (is_admin()) {
            new Umrebuldum\Poster\Admin($this->generator);
            new Umrebuldum\Poster\Metabox($this->generator);
        }
        
        // Upgrade Funnel (Free → Pro conversion)
        new Umrebuldum\Poster\Upgrade_Funnel();
        
        // Shortcode
        add_shortcode('listing_poster', [$this, 'poster_shortcode']);
    }
    
    /**
     * Generator factory - Abstraction katmanı
     * Phase 3'te burası API_Generator döndürecek
     */
    private function get_generator() {
        // Config'den generator tipini al
        $type = get_option('upg_generator_type', 'gd');
        
        switch ($type) {
            case 'api':
                // Phase 3: Python API
                // return new Umrebuldum\Poster\API_Generator();
                // Şimdilik GD'ye fallback
                return new Umrebuldum\Poster\GD_Generator();
                
            case 'gd':
            default:
                return new Umrebuldum\Poster\GD_Generator();
        }
    }
    
    /**
     * Upload klasörü oluştur
     */
    public function create_upload_dir() {
        $upload = wp_upload_dir();
        $posters_dir = $upload['basedir'] . '/posters';
        
        if (!file_exists($posters_dir)) {
            wp_mkdir_p($posters_dir);
        }
    }
    
    /**
     * İlan yayınlandığında hook
     */
    public function on_listing_publish($listing_id, $new_status, $old_status, $listing) {
        if ($new_status === 'publish' && $old_status !== 'publish') {
            if (get_option('upg_auto_generate', true)) {
                $this->generator->generate($listing_id);
            }
        }
    }
    
    /**
     * Shortcode handler
     */
    public function poster_shortcode($atts) {
        $atts = shortcode_atts(['id' => 0], $atts);
        $listing_id = intval($atts['id']);
        
        if (!$listing_id) return '';
        
        $poster_url = get_post_meta($listing_id, '_poster_url', true);
        
        if (!$poster_url) {
            return '<p class="upg-no-poster">Afiş bulunamadı</p>';
        }
        
        return sprintf(
            '<img src="%s" alt="İlan Afişi" class="upg-poster-image">',
            esc_url($poster_url)
        );
    }
    
    /**
     * Generator'a erişim
     */
    public function generator() {
        return $this->generator;
    }
}

/**
 * Global erişim fonksiyonu
 */
function upg() {
    return Umrebuldum_Poster_Plugin::instance();
}

// Başlat
add_action('plugins_loaded', 'upg');
