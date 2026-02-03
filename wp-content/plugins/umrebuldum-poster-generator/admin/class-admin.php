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
        
        // System Health Dashboard
        add_submenu_page(
            'hivepress',
            'Sistem Durumu',
            '🩺 Sistem Durumu',
            'manage_options',
            'upg-system-health',
            [$this, 'render_health_page']
        );
        
        // Content & Revenue Dashboard
        add_submenu_page(
            'hivepress',
            'İçerik ve Gelir',
            '📈 İçerik ve Gelir',
            'manage_options',
            'upg-revenue-stats',
            [$this, 'render_revenue_page']
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
        
        // WooCommerce Pro Subscription Product ID
        register_setting('upg_settings', 'upg_pro_product_id', [
            'type'              => 'integer',
            'sanitize_callback' => [$this, 'sanitize_product_id'],
            'default'           => 0,
        ]);
    }
    
    /**
     * Product ID sanitization
     * Negatif veya 0 değer kabul etmez
     */
    public function sanitize_product_id($value): int {
        $value = absint($value);
        return $value > 0 ? $value : 0;
    }
    
    /**
     * CSS/JS yükle
     */
    public function enqueue_assets($hook): void {
        // Main posters page
        if (strpos($hook, 'umrebuldum-posters') !== false) {
            wp_enqueue_style(
                'upg-admin',
                UPG_ASSETS . 'css/admin.css',
                [],
                UPG_VERSION
            );
        }
        
        // System Health page
        if (strpos($hook, 'upg-system-health') !== false) {
            wp_enqueue_style(
                'upg-admin',
                UPG_ASSETS . 'css/admin.css',
                [],
                UPG_VERSION
            );
            
            wp_enqueue_script(
                'upg-admin-health',
                UPG_ASSETS . 'js/admin-health.js',
                [],
                UPG_VERSION,
                true
            );
            
            wp_localize_script('upg-admin-health', 'upgHealth', [
                'endpoint' => rest_url('umrebuldum/v1/health'),
                'nonce'    => wp_create_nonce('wp_rest'),
            ]);
        }
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
        $posters_dir = $upload['basedir'] . '/umrebuldum/generated';
        
        $files = array_merge(
            glob($posters_dir . '/*.webp') ?: [],
            glob($posters_dir . '/*.png') ?: [],
            glob($posters_dir . '/*.jpg') ?: []
        );
        
        if (!$files) return [];
        
        // Tarihe göre sırala (en yeni önce)
        usort($files, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        $files = array_slice($files, 0, $limit);
        
        $posters = [];
        foreach ($files as $file) {
            $posters[] = [
                'filename' => basename($file),
                'url'      => $upload['baseurl'] . '/umrebuldum/generated/' . basename($file),
                'size'     => filesize($file),
                'date'     => filemtime($file),
            ];
        }
        
        return $posters;
    }
    
    // =========================================
    // MINI DASHBOARD - İSTATİSTİKLER
    // =========================================
    
    /**
     * Dashboard istatistiklerini al
     */
    public function get_dashboard_stats(): array {
        global $wpdb;
        
        // Toplam render sayısı (tüm kullanıcılar)
        $total_renders = $this->get_total_renders();
        
        // Cache hit oranı
        $cache_stats = $this->get_cache_hit_ratio();
        
        // Tier breakdown
        $tier_stats = $this->get_tier_stats();
        
        // CPU tasarrufu tahmini
        $cpu_savings = $this->calculate_cpu_savings($cache_stats['hits'], $tier_stats);
        
        // Günlük trend (son 7 gün)
        $daily_trend = $this->get_daily_trend(7);
        
        return [
            'total_renders'   => $total_renders,
            'cache_hit_ratio' => $cache_stats['ratio'],
            'cache_hits'      => $cache_stats['hits'],
            'cache_misses'    => $cache_stats['misses'],
            'tier_stats'      => $tier_stats,
            'cpu_savings'     => $cpu_savings,
            'daily_trend'     => $daily_trend,
            'updated_at'      => time(),
        ];
    }
    
    /**
     * Toplam render sayısı
     */
    private function get_total_renders(): int {
        global $wpdb;
        
        // User meta'dan toplam render sayısını al
        $total = $wpdb->get_var(
            "SELECT SUM(meta_value) FROM {$wpdb->usermeta} 
             WHERE meta_key = '_upg_total_renders'"
        );
        
        return (int) ($total ?: 0);
    }
    
    /**
     * Cache hit oranı
     */
    private function get_cache_hit_ratio(): array {
        global $wpdb;
        
        // Toplam cache hit sayısı
        $total_hits = $wpdb->get_var(
            "SELECT SUM(meta_value) FROM {$wpdb->usermeta} 
             WHERE meta_key = '_upg_cache_hits'"
        );
        $hits = (int) ($total_hits ?: 0);
        
        // Toplam render
        $total = $this->get_total_renders();
        $misses = max(0, $total - $hits);
        
        // Oran hesapla
        $ratio = $total > 0 ? round(($hits / $total) * 100, 1) : 0;
        
        return [
            'hits'   => $hits,
            'misses' => $misses,
            'total'  => $total,
            'ratio'  => $ratio,
        ];
    }
    
    /**
     * Tier bazlı istatistikler
     */
    private function get_tier_stats(): array {
        global $wpdb;
        
        // Tier'a göre kullanıcı sayıları
        $free_users = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->usermeta} 
             WHERE meta_key = '_upg_tier' AND (meta_value = 'free' OR meta_value = '')"
        );
        
        $pro_users = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->usermeta} 
             WHERE meta_key = '_upg_tier' AND meta_value = 'pro'"
        );
        
        $agency_users = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->usermeta} 
             WHERE meta_key = '_upg_tier' AND meta_value LIKE 'agency%'"
        );
        
        // Free vs Pro render dağılımı (tahmini)
        // Post meta'dan tier bilgisine bakarak
        $pro_renders = $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->postmeta} 
             WHERE meta_key = '_poster_tier' AND meta_value = 'pro'"
        );
        
        $total_renders = $this->get_total_renders();
        $free_renders = max(0, $total_renders - (int)$pro_renders);
        
        return [
            'free_users'    => (int) ($free_users ?: 0),
            'pro_users'     => (int) ($pro_users ?: 0),
            'agency_users'  => (int) ($agency_users ?: 0),
            'free_renders'  => $free_renders,
            'pro_renders'   => (int) ($pro_renders ?: 0),
        ];
    }
    
    /**
     * CPU tasarrufu hesapla
     * Cache hit = ~400ms tasarruf
     * Pro cache 30x daha uzun = daha fazla hit
     */
    private function calculate_cpu_savings(int $cache_hits, array $tier_stats): array {
        // Her cache hit ortalama 400ms tasarruf
        $avg_render_ms = 400;
        $saved_ms = $cache_hits * $avg_render_ms;
        $saved_seconds = round($saved_ms / 1000, 1);
        $saved_minutes = round($saved_seconds / 60, 1);
        
        // Pro kullanıcıların 30x cache avantajı
        $pro_cache_multiplier = 30;
        $pro_estimated_extra_hits = $tier_stats['pro_renders'] * 0.7; // %70'i cache hit olur
        $pro_extra_savings_ms = $pro_estimated_extra_hits * $avg_render_ms * ($pro_cache_multiplier - 1) / $pro_cache_multiplier;
        
        return [
            'total_saved_ms'     => $saved_ms,
            'total_saved_seconds'=> $saved_seconds,
            'total_saved_minutes'=> $saved_minutes,
            'pro_bonus_ms'       => round($pro_extra_savings_ms),
            'human_readable'     => $this->format_time_saved($saved_seconds),
        ];
    }
    
    /**
     * Zaman formatla
     */
    private function format_time_saved(float $seconds): string {
        if ($seconds < 60) {
            return round($seconds) . ' saniye';
        } elseif ($seconds < 3600) {
            return round($seconds / 60, 1) . ' dakika';
        } else {
            return round($seconds / 3600, 1) . ' saat';
        }
    }
    
    /**
     * Günlük render trendi
     */
    private function get_daily_trend(int $days = 7): array {
        $trend = [];
        $today = strtotime('today');
        
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', $today - ($i * DAY_IN_SECONDS));
            $day_name = date('D', $today - ($i * DAY_IN_SECONDS));
            
            // Günlük stats option'dan al (Usage_Tracker'dan kaydediliyor)
            $daily_key = 'upg_daily_stats_' . $date;
            $daily_stats = get_option($daily_key, ['renders' => 0, 'cache_hits' => 0]);
            
            $trend[] = [
                'date'       => $date,
                'day'        => $day_name,
                'day_tr'     => $this->translate_day($day_name),
                'renders'    => (int) ($daily_stats['renders'] ?? 0),
                'cache_hits' => (int) ($daily_stats['cache_hits'] ?? 0),
            ];
        }
        
        return $trend;
    }
    
    /**
     * Gün adını Türkçe'ye çevir
     */
    private function translate_day(string $day): string {
        $days = [
            'Mon' => 'Pzt',
            'Tue' => 'Sal',
            'Wed' => 'Çar',
            'Thu' => 'Per',
            'Fri' => 'Cum',
            'Sat' => 'Cmt',
            'Sun' => 'Paz',
        ];
        return $days[$day] ?? $day;
    }
    
    /**
     * System Health Dashboard render
     */
    public function render_health_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Yetkiniz yok.');
        }
        
        include UPG_PATH . 'admin/views/health-dashboard.php';
    }
    
    /**
     * Content & Revenue Dashboard render
     */
    public function render_revenue_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Yetkiniz yok.');
        }
        
        include UPG_PATH . 'admin/views/revenue-dashboard.php';
    }
}

