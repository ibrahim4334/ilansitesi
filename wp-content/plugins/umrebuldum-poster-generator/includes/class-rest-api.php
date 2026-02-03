<?php
/**
 * REST API Endpoints
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Rest_API {
    
    private $generator;
    private $rate_limiter;
    private $namespace = 'umrebuldum/v1';
    
    public function __construct(Generator_Interface $generator) {
        $this->generator = $generator;
        $this->rate_limiter = new Rate_Limiter();
    }
    
    /**
     * Route'ları kaydet
     */
    public function register_routes(): void {
        // POST /umrebuldum/v1/poster/generate
        register_rest_route($this->namespace, '/poster/generate', [
            'methods'             => 'POST',
            'callback'            => [$this, 'generate_poster'],
            'permission_callback' => [$this, 'can_edit'],
            'args'                => [
                'listing_id' => [
                    'required' => true,
                    'type'     => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'template' => [
                    'default' => 'default',
                    'type'    => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'size' => [
                    'default' => 'instagram',
                    'type'    => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'force' => [
                    'default' => false,
                    'type'    => 'boolean',
                ],
            ],
        ]);
        
        // GET /umrebuldum/v1/poster/{id}
        register_rest_route($this->namespace, '/poster/(?P<id>\d+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_poster'],
            'permission_callback' => '__return_true',
        ]);
        
        // DELETE /umrebuldum/v1/poster/{id}
        register_rest_route($this->namespace, '/poster/(?P<id>\d+)', [
            'methods'             => 'DELETE',
            'callback'            => [$this, 'delete_poster'],
            'permission_callback' => [$this, 'can_edit'],
        ]);
        
        // GET /umrebuldum/v1/poster/templates
        register_rest_route($this->namespace, '/poster/templates', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_templates'],
            'permission_callback' => '__return_true',
        ]);
        
        // GET /umrebuldum/v1/poster/status
        register_rest_route($this->namespace, '/poster/status', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_status'],
            'permission_callback' => [$this, 'can_edit'],
        ]);
        
        // GET /umrebuldum/v1/poster/cache/stats
        register_rest_route($this->namespace, '/poster/cache/stats', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_cache_stats'],
            'permission_callback' => [$this, 'can_manage'],
        ]);
        
        // POST /umrebuldum/v1/poster/cache/cleanup
        register_rest_route($this->namespace, '/poster/cache/cleanup', [
            'methods'             => 'POST',
            'callback'            => [$this, 'cleanup_cache'],
            'permission_callback' => [$this, 'can_manage'],
        ]);
        
        // GET /umrebuldum/v1/user/tier
        // [UPGRADE_POINT] Mobil/PWA için kullanıcı tier bilgisi
        register_rest_route($this->namespace, '/user/tier', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_user_tier'],
            'permission_callback' => '__return_true', // Login olmamışsa da çağrılabilir
        ]);
        
        // GET /umrebuldum/v1/health
        // System health check - read-only, public
        register_rest_route($this->namespace, '/health', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_health'],
            'permission_callback' => '__return_true',
        ]);
    }
    
    /**
     * Permission check - edit
     */
    public function can_edit(): bool {
        return current_user_can('edit_posts');
    }
    
    /**
     * Permission check - manage
     */
    public function can_manage(): bool {
        return current_user_can('manage_options');
    }
    
    /**
     * POST: Afiş üret (Rate Limited)
     */
    public function generate_poster(\WP_REST_Request $request): \WP_REST_Response {
        // Rate limit kontrolü
        if (!$this->rate_limiter->is_whitelisted()) {
            $rate_check = $this->rate_limiter->check('generate');
            $this->rate_limiter->add_headers($rate_check);
            
            if (!$rate_check['allowed']) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error'   => 'Rate limit aşıldı. Lütfen ' . $rate_check['retry_after'] . ' saniye bekleyin.',
                    'retry_after' => $rate_check['retry_after'],
                ], 429);
            }
        }
        
        $listing_id = $request->get_param('listing_id');
        $template = $request->get_param('template');
        $size = $request->get_param('size');
        $force = $request->get_param('force');
        
        // Template ve size validasyonu
        $valid_templates = array_keys(Templates::get_templates());
        $valid_sizes = array_keys(Templates::get_sizes());
        
        if (!in_array($template, $valid_templates)) {
            return new \WP_REST_Response([
                'success' => false,
                'error'   => 'Geçersiz template: ' . $template,
            ], 400);
        }
        
        if (!in_array($size, $valid_sizes)) {
            return new \WP_REST_Response([
                'success' => false,
                'error'   => 'Geçersiz size: ' . $size,
            ], 400);
        }
        
        $result = $this->generator->generate($listing_id, $template, $size, $force);
        
        if (is_wp_error($result)) {
            return new \WP_REST_Response([
                'success' => false,
                'error'   => $result->get_error_message(),
            ], 400);
        }
        
        // Cache header'ları
        $response = new \WP_REST_Response($result, 200);
        $response->header('X-Poster-Cached', $result['cached'] ? 'true' : 'false');
        $response->header('X-Poster-Format', $result['format'] ?? 'png');
        
        return $response;
    }
    
    /**
     * GET: Afiş bilgisi
     */
    public function get_poster(\WP_REST_Request $request): \WP_REST_Response {
        $listing_id = (int) $request->get_param('id');
        
        $poster = $this->generator->get($listing_id);
        
        if (!$poster) {
            return new \WP_REST_Response([
                'success' => false,
                'error'   => 'Afiş bulunamadı',
            ], 404);
        }
        
        return new \WP_REST_Response([
            'success'    => true,
            'listing_id' => $listing_id,
            'poster'     => $poster,
        ], 200);
    }
    
    /**
     * DELETE: Afiş sil
     */
    public function delete_poster(\WP_REST_Request $request): \WP_REST_Response {
        $listing_id = (int) $request->get_param('id');
        
        $result = $this->generator->delete($listing_id);
        
        return new \WP_REST_Response([
            'success'    => $result,
            'listing_id' => $listing_id,
        ], $result ? 200 : 400);
    }
    
    /**
     * GET: Template listesi
     */
    public function get_templates(): \WP_REST_Response {
        return new \WP_REST_Response([
            'templates' => Templates::get_templates(),
            'sizes'     => Templates::get_sizes(),
        ], 200);
    }
    
    /**
     * GET: Generator durumu
     */
    public function get_status(): \WP_REST_Response {
        $cache = new Cache();
        $processor = new Image_Processor();
        
        return new \WP_REST_Response([
            'generator_type'  => $this->generator->get_type(),
            'generator_ready' => $this->generator->is_ready(),
            'gd_loaded'       => extension_loaded('gd'),
            'imagick_loaded'  => extension_loaded('imagick'),
            'webp_support'    => $cache->supports_webp(),
            'memory'          => $processor->get_memory_usage(),
            'cache'           => $cache->stats(),
        ], 200);
    }
    
    /**
     * GET: Cache istatistikleri
     */
    public function get_cache_stats(): \WP_REST_Response {
        $cache = new Cache();
        
        return new \WP_REST_Response([
            'success' => true,
            'stats'   => $cache->stats(),
        ], 200);
    }
    
    /**
     * POST: Cache temizliği
     */
    public function cleanup_cache(\WP_REST_Request $request): \WP_REST_Response {
        $cache = new Cache();
        $max_age = $request->get_param('max_age') ?? (7 * DAY_IN_SECONDS);
        
        $result = $cache->cleanup((int) $max_age);
        
        return new \WP_REST_Response([
            'success' => true,
            'result'  => $result,
        ], 200);
    }
    
    /**
     * GET: Kullanıcı tier bilgisi
     * 
     * [UPGRADE_POINT]
     * Mobil app ve PWA bu endpoint'i kullanarak:
     * - Kullanıcının tier'ını öğrenir
     * - Kalan hakkını gösterir
     * - Pro'ya yükseltme butonu gösterir
     */
    public function get_user_tier(): \WP_REST_Response {
        $access = new Access_Control();
        
        return new \WP_REST_Response([
            'success'           => true,
            'tier'              => $access->get_tier(),
            'is_pro'            => $access->is_pro(),
            'poster_count'      => $access->get_poster_count(),
            'remaining'         => $access->get_remaining_quota(),
            'quality'           => $access->get_quality(),
            'has_watermark'     => $access->requires_watermark(),
            'allowed_templates' => $access->get_allowed_templates(),
            'upgrade_url'       => $access->get_upgrade_url(),
            'limits' => [
                'free_poster_limit' => Access_Control::FREE_POSTER_LIMIT,
                'free_templates'    => Access_Control::FREE_TEMPLATES,
            ],
        ], 200);
    }
    
    /**
     * GET: System Health Check
     * 
     * @return \WP_REST_Response
     */
    public function get_health(): \WP_REST_Response {
        global $wpdb;
        
        $cache = new Cache();
        $tracker = new Usage_Tracker();
        $processor = new Image_Processor();
        
        // ====================================
        // 1. CORE STATUS
        // ====================================
        $core = [
            'plugin_version'  => defined('UPG_VERSION') ? UPG_VERSION : 'unknown',
            'php_version'     => PHP_VERSION,
            'wp_version'      => get_bloginfo('version'),
            'memory_limit'    => ini_get('memory_limit'),
            'gd_available'    => extension_loaded('gd'),
            'webp_supported'  => $cache->supports_webp(),
        ];
        
        // ====================================
        // 2. CACHE HEALTH
        // ====================================
        $cache_health = $cache->health_stats();
        
        // ====================================
        // 3. ERROR HEALTH (son 24 saat)
        // ====================================
        $today_errors = $tracker->get_today_errors();
        $critical_codes = [
            Usage_Tracker::ERROR_FETCH_FAILED,
            Usage_Tracker::ERROR_GD_FAILED,
            Usage_Tracker::ERROR_SAVE_FAILED,
        ];
        
        $critical_count = 0;
        foreach ($critical_codes as $code) {
            $critical_count += $today_errors['by_type'][$code] ?? 0;
        }
        
        $error_health = [
            'total_errors'    => $today_errors['total'],
            'errors_by_type'  => $today_errors['by_type'],
            'critical_errors' => $critical_count,
        ];
        
        // ====================================
        // 4. PERFORMANCE SNAPSHOT
        // ====================================
        $today = date('Y-m-d');
        $daily_stats = get_option(Usage_Tracker::OPTION_DAILY_STATS, []);
        $today_stats = $daily_stats[$today] ?? [
            'total_renders' => 0,
            'cache_hits'    => 0,
            'total_cpu_ms'  => 0,
        ];
        
        $avg_render_time = $today_stats['total_renders'] > 0 
            ? round($today_stats['total_cpu_ms'] / $today_stats['total_renders'], 1)
            : 0;
        
        $cache_hit_ratio = $today_stats['total_renders'] > 0 
            ? round(($today_stats['cache_hits'] / $today_stats['total_renders']) * 100, 1)
            : 0;
        
        $performance = [
            'avg_render_time_ms'  => $avg_render_time,
            'cache_hit_ratio'     => $cache_hit_ratio,
            'total_renders_today' => $today_stats['total_renders'],
        ];
        
        // ====================================
        // 5. MONETIZATION READINESS
        // ====================================
        $pro_product_id = get_option('upg_pro_product_id', 0);
        
        // Pro users count (approximate - cached query)
        $pro_count = wp_cache_get('upg_pro_users_count');
        if ($pro_count === false) {
            $pro_count = (int) $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->usermeta} 
                 WHERE meta_key = '_upg_tier_override' AND meta_value = 'pro'"
            );
            wp_cache_set('upg_pro_users_count', $pro_count, '', 300); // 5 min cache
        }
        
        $monetization = [
            'woo_active'          => class_exists('WooCommerce'),
            'subscriptions_active' => function_exists('wcs_user_has_subscription'),
            'pro_product_id_set'  => $pro_product_id > 0,
            'pro_users_count'     => $pro_count,
        ];
        
        // ====================================
        // OVERALL STATUS
        // ====================================
        $status = 'OK';
        $issues = [];
        
        // FAIL conditions
        if (!$core['gd_available']) {
            $status = 'FAIL';
            $issues[] = 'GD extension not available';
        }
        if (!$cache_health['cache_dir_exists']) {
            $status = 'FAIL';
            $issues[] = 'Cache directory does not exist';
        }
        if (!$cache_health['cache_writable']) {
            $status = 'FAIL';
            $issues[] = 'Cache directory not writable';
        }
        
        // DEGRADED conditions (only if not already FAIL)
        if ($status === 'OK') {
            if ($error_health['critical_errors'] > 10) {
                $status = 'DEGRADED';
                $issues[] = 'High critical error count: ' . $error_health['critical_errors'];
            }
            if (!$core['webp_supported']) {
                $status = 'DEGRADED';
                $issues[] = 'WebP not supported, using PNG fallback';
            }
            if ($performance['cache_hit_ratio'] < 30 && $performance['total_renders_today'] > 10) {
                $status = 'DEGRADED';
                $issues[] = 'Low cache hit ratio: ' . $performance['cache_hit_ratio'] . '%';
            }
        }
        
        // Response
        $http_code = $status === 'FAIL' ? 503 : 200;
        
        return new \WP_REST_Response([
            'status'       => $status,
            'issues'       => $issues,
            'timestamp'    => time(),
            'core'         => $core,
            'cache'        => $cache_health,
            'errors'       => $error_health,
            'performance'  => $performance,
            'monetization' => $monetization,
        ], $http_code);
    }
}
