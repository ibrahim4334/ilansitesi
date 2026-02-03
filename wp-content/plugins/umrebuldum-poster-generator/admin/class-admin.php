<?php
/**
 * Admin Page
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Admin {
    
    private $generator;
    
    public function __construct(Generator_Interface $generator) {
        $this->generator = $generator;
        
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_upg_generate', [$this, 'ajax_generate']);
    }
    
    /**
     * Admin menü
     */
    public function add_menu(): void {
        add_submenu_page(
            'hivepress',
            'Afiş Üretici',
            '🖼️ Afişler',
            'manage_options',
            'umrebuldum-posters',
            [$this, 'render_page']
        );
    }
    
    /**
     * Ayarları kaydet
     */
    public function register_settings(): void {
        register_setting('upg_settings', 'upg_auto_generate');
        register_setting('upg_settings', 'upg_default_template');
        register_setting('upg_settings', 'upg_default_size');
        register_setting('upg_settings', 'upg_generator_type');
        register_setting('upg_settings', 'upg_api_url');
    }
    
    /**
     * CSS/JS yükle
     */
    public function enqueue_assets($hook): void {
        if (strpos($hook, 'umrebuldum-posters') === false) {
            return;
        }
        
        wp_enqueue_style(
            'upg-admin',
            UPG_ASSETS . 'css/admin.css',
            [],
            UPG_VERSION
        );
    }
    
    /**
     * AJAX: Afiş üret
     */
    public function ajax_generate(): void {
        check_ajax_referer('upg_generate');
        
        if (!current_user_can('edit_posts')) {
            wp_send_json_error('Yetki yok');
        }
        
        $listing_id = intval($_POST['listing_id']);
        $template = sanitize_text_field($_POST['template'] ?? 'default');
        $size = sanitize_text_field($_POST['size'] ?? 'instagram');
        
        $result = $this->generator->generate($listing_id, $template, $size);
        
        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        }
        
        wp_send_json_success($result);
    }
    
    /**
     * Admin sayfasını render et
     */
    public function render_page(): void {
        // Form işleme
        $message = '';
        $generated = null;
        
        if (isset($_POST['upg_test_generate']) && wp_verify_nonce($_POST['_wpnonce'], 'upg_test')) {
            $listing_id = intval($_POST['listing_id']);
            $template = sanitize_text_field($_POST['template']);
            $size = sanitize_text_field($_POST['size']);
            
            $result = $this->generator->generate($listing_id, $template, $size);
            
            if (is_wp_error($result)) {
                $message = '<div class="notice notice-error"><p>' . $result->get_error_message() . '</p></div>';
            } else {
                $generated = $result;
                $message = '<div class="notice notice-success"><p>Afiş başarıyla üretildi!</p></div>';
            }
        }
        
        // View yükle
        include UPG_PATH . 'admin/views/settings-page.php';
    }
    
    /**
     * Son üretilen afişleri al
     */
    public function get_recent_posters(int $limit = 12): array {
        $upload = wp_upload_dir();
        $posters_dir = $upload['basedir'] . '/posters';
        
        $files = glob($posters_dir . '/*.png');
        if (!$files) return [];
        
        rsort($files);
        $files = array_slice($files, 0, $limit);
        
        $posters = [];
        foreach ($files as $file) {
            $posters[] = [
                'filename' => basename($file),
                'url'      => $upload['baseurl'] . '/posters/' . basename($file),
                'size'     => filesize($file),
                'date'     => filemtime($file),
            ];
        }
        
        return $posters;
    }
}
