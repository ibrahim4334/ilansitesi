<?php
/**
 * Usage Tracker - Render Metrics & Value Signaling
 * 
 * Free kullanıcıya Pro'nun değerini görünür kılmak için:
 * - Render metrikleri kaydetme
 * - Friction uygulama (JS tarafı gecikme)
 * - Pro value badges
 * - Agency altyapısı
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Usage_Tracker {
    
    /**
     * Friction başlangıç noktası (Free kullanıcı için)
     */
    const FREE_FRICTION_THRESHOLD = 2; // İlk 2 render normal
    
    /**
     * Friction delay (ms) - JS tarafında uygulanır
     */
    const FRICTION_DELAY_MS = 800;
    
    /**
     * User meta keys
     */
    const META_TOTAL_RENDERS    = '_upg_total_renders';
    const META_CACHE_HITS       = '_upg_cache_hits';
    const META_TOTAL_CPU_MS     = '_upg_total_cpu_ms';
    const META_TOTAL_SIZE_KB    = '_upg_total_size_kb';
    const META_LAST_RENDER      = '_upg_last_render';
    const META_DAILY_RENDERS    = '_upg_daily_renders';
    
    /**
     * Error tracking meta keys
     */
    const META_TOTAL_ERRORS     = '_upg_total_errors';
    const META_ERROR_TYPES      = '_upg_error_types';
    
    /**
     * Agency meta keys
     */
    const META_OWNER_USER_ID    = '_upg_owner_user_id';
    const META_SUB_USER_COUNT   = '_upg_sub_user_count';
    
    /**
     * Daily aggregate option key
     */
    const OPTION_DAILY_STATS    = 'upg_daily_stats';
    const OPTION_DAILY_ERRORS   = 'upg_daily_errors';
    
    /**
     * Standard error codes
     */
    const ERROR_RATE_LIMITED    = 'rate_limited';
    const ERROR_QUOTA_EXCEEDED  = 'quota_exceeded';
    const ERROR_LOGIN_REQUIRED  = 'login_required';
    const ERROR_TEMPLATE_RESTRICTED = 'template_restricted';
    const ERROR_FETCH_FAILED    = 'fetch_failed';
    const ERROR_GD_FAILED       = 'gd_failed';
    const ERROR_SAVE_FAILED     = 'save_failed';
    const ERROR_LOW_MEMORY      = 'low_memory';
    const ERROR_NO_LISTING      = 'no_listing';
    
    private $access;
    
    public function __construct() {
        $this->access = new Access_Control();
        
        // Admin hooks
        if (is_admin()) {
            add_action('admin_menu', [$this, 'add_stats_submenu'], 99);
        }
    }
    
    // =========================================
    // USAGE METRICS
    // =========================================
    
    /**
     * Render metriklerini kaydet
     * 
     * @param array $metrics [
     *   'listing_id'     => int,
     *   'render_time_ms' => int,
     *   'from_cache'     => bool,
     *   'output_size_kb' => float,
     *   'tier'           => string,
     *   'template'       => string,
     *   'size'           => string,
     * ]
     */
    public function track_render(array $metrics): void {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return;
        }
        
        // User meta güncelle
        $this->update_user_metrics($user_id, $metrics);
        
        // Daily aggregate güncelle
        $this->update_daily_aggregate($metrics);
        
        // Son render bilgisi
        update_user_meta($user_id, self::META_LAST_RENDER, [
            'timestamp'      => time(),
            'listing_id'     => $metrics['listing_id'] ?? 0,
            'render_time_ms' => $metrics['render_time_ms'] ?? 0,
            'from_cache'     => $metrics['from_cache'] ?? false,
            'tier'           => $metrics['tier'] ?? 'free',
        ]);
    }
    
    /**
     * User metriklerini güncelle
     */
    private function update_user_metrics(int $user_id, array $metrics): void {
        // Toplam render sayısı
        $total = (int) get_user_meta($user_id, self::META_TOTAL_RENDERS, true);
        update_user_meta($user_id, self::META_TOTAL_RENDERS, $total + 1);
        
        // Cache hit sayısı
        if (!empty($metrics['from_cache'])) {
            $hits = (int) get_user_meta($user_id, self::META_CACHE_HITS, true);
            update_user_meta($user_id, self::META_CACHE_HITS, $hits + 1);
        }
        
        // Toplam CPU zamanı
        if (!empty($metrics['render_time_ms'])) {
            $cpu = (int) get_user_meta($user_id, self::META_TOTAL_CPU_MS, true);
            update_user_meta($user_id, self::META_TOTAL_CPU_MS, $cpu + $metrics['render_time_ms']);
        }
        
        // Toplam dosya boyutu
        if (!empty($metrics['output_size_kb'])) {
            $size = (float) get_user_meta($user_id, self::META_TOTAL_SIZE_KB, true);
            update_user_meta($user_id, self::META_TOTAL_SIZE_KB, $size + $metrics['output_size_kb']);
        }
        
        // Günlük render sayısı
        $today = date('Y-m-d');
        $daily = get_user_meta($user_id, self::META_DAILY_RENDERS, true) ?: [];
        
        if (!isset($daily[$today])) {
            $daily[$today] = 0;
        }
        $daily[$today]++;
        
        // Son 7 günü tut
        $week_ago = date('Y-m-d', strtotime('-7 days'));
        $daily = array_filter($daily, function($date) use ($week_ago) {
            return $date >= $week_ago;
        }, ARRAY_FILTER_USE_KEY);
        
        update_user_meta($user_id, self::META_DAILY_RENDERS, $daily);
    }
    
    /**
     * Daily aggregate güncelle (site geneli)
     */
    private function update_daily_aggregate(array $metrics): void {
        $today = date('Y-m-d');
        $stats = get_option(self::OPTION_DAILY_STATS, []);
        
        if (!isset($stats[$today])) {
            $stats[$today] = [
                'total_renders'   => 0,
                'cache_hits'      => 0,
                'total_cpu_ms'    => 0,
                'total_size_kb'   => 0,
                'free_renders'    => 0,
                'pro_renders'     => 0,
            ];
        }
        
        $stats[$today]['total_renders']++;
        
        if (!empty($metrics['from_cache'])) {
            $stats[$today]['cache_hits']++;
        }
        
        if (!empty($metrics['render_time_ms'])) {
            $stats[$today]['total_cpu_ms'] += $metrics['render_time_ms'];
        }
        
        if (!empty($metrics['output_size_kb'])) {
            $stats[$today]['total_size_kb'] += $metrics['output_size_kb'];
        }
        
        // Tier bazlı
        if (($metrics['tier'] ?? 'free') === 'pro') {
            $stats[$today]['pro_renders']++;
        } else {
            $stats[$today]['free_renders']++;
        }
        
        // Son 30 günü tut
        $month_ago = date('Y-m-d', strtotime('-30 days'));
        $stats = array_filter($stats, function($date) use ($month_ago) {
            return $date >= $month_ago;
        }, ARRAY_FILTER_USE_KEY);
        
        update_option(self::OPTION_DAILY_STATS, $stats, false);
    }
    
    // =========================================
    // ERROR TRACKING
    // =========================================
    
    /**
     * Hata kaydı oluştur
     * 
     * @param string $error_code Standart hata kodu (ERROR_* constants)
     * @param array  $context    Opsiyonel context bilgisi
     */
    public function track_error(string $error_code, array $context = []): void {
        $user_id = get_current_user_id();
        
        // User-level error tracking
        if ($user_id) {
            $this->update_user_errors($user_id, $error_code);
        }
        
        // Daily aggregate error tracking
        $this->update_daily_errors($error_code, $context);
        
        // WP Debug log (opsiyonel)
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log(sprintf(
                '[UPG Error] Code: %s, User: %d, Context: %s',
                $error_code,
                $user_id,
                json_encode($context)
            ));
        }
    }
    
    /**
     * User error sayaçlarını güncelle
     */
    private function update_user_errors(int $user_id, string $error_code): void {
        // Toplam hata sayısı
        $total = (int) get_user_meta($user_id, self::META_TOTAL_ERRORS, true);
        update_user_meta($user_id, self::META_TOTAL_ERRORS, $total + 1);
        
        // Hata tipi bazlı sayaçlar
        $error_types = get_user_meta($user_id, self::META_ERROR_TYPES, true) ?: [];
        
        if (!isset($error_types[$error_code])) {
            $error_types[$error_code] = 0;
        }
        $error_types[$error_code]++;
        
        update_user_meta($user_id, self::META_ERROR_TYPES, $error_types);
    }
    
    /**
     * Daily error aggregate güncelle
     */
    private function update_daily_errors(string $error_code, array $context): void {
        $today = date('Y-m-d');
        $option_key = self::OPTION_DAILY_ERRORS . '_' . $today;
        
        $errors = get_option($option_key, [
            'total'       => 0,
            'by_type'     => [],
            'last_errors' => [],
        ]);
        
        // Toplam hata
        $errors['total']++;
        
        // Tip bazlı
        if (!isset($errors['by_type'][$error_code])) {
            $errors['by_type'][$error_code] = 0;
        }
        $errors['by_type'][$error_code]++;
        
        // Son 10 hata (debug için)
        array_unshift($errors['last_errors'], [
            'code'      => $error_code,
            'timestamp' => time(),
            'user_id'   => get_current_user_id(),
            'context'   => array_slice($context, 0, 3), // Sadece ilk 3 context key
        ]);
        $errors['last_errors'] = array_slice($errors['last_errors'], 0, 10);
        
        update_option($option_key, $errors, false);
    }
    
    /**
     * Bugünkü hata istatistikleri
     */
    public function get_today_errors(): array {
        $today = date('Y-m-d');
        $option_key = self::OPTION_DAILY_ERRORS . '_' . $today;
        
        return get_option($option_key, [
            'total'       => 0,
            'by_type'     => [],
            'last_errors' => [],
        ]);
    }
    
    /**
     * Kullanıcının hata istatistikleri
     */
    public function get_user_errors(?int $user_id = null): array {
        $user_id = $user_id ?? get_current_user_id();
        
        if (!$user_id) {
            return ['total' => 0, 'by_type' => []];
        }
        
        return [
            'total'   => (int) get_user_meta($user_id, self::META_TOTAL_ERRORS, true),
            'by_type' => get_user_meta($user_id, self::META_ERROR_TYPES, true) ?: [],
        ];
    }
    
    // =========================================
    // FREE KULLANICI FRICTION
    // =========================================
    
    /**
     * Free kullanıcıya friction uygulanmalı mı?
     */
    public function should_apply_friction(): bool {
        // Pro kullanıcıya ASLA friction yok
        if ($this->access->is_pro()) {
            return false;
        }
        
        $user_id = get_current_user_id();
        if (!$user_id) {
            return true; // Giriş yapmamış = friction
        }
        
        $total = (int) get_user_meta($user_id, self::META_TOTAL_RENDERS, true);
        
        // İlk 2 render normal
        return $total >= self::FREE_FRICTION_THRESHOLD;
    }
    
    /**
     * Friction delay (ms)
     */
    public function get_friction_delay(): int {
        return $this->should_apply_friction() ? self::FRICTION_DELAY_MS : 0;
    }
    
    /**
     * Friction mesajı
     */
    public function get_friction_message(): string {
        if (!$this->should_apply_friction()) {
            return '';
        }
        
        return '⚡ Pro ile anında oluştur - sıra beklemeden!';
    }
    
    /**
     * Friction verisi (JS için)
     */
    public function get_friction_data(): array {
        return [
            'apply'   => $this->should_apply_friction(),
            'delay'   => $this->get_friction_delay(),
            'message' => $this->get_friction_message(),
            'upgrade_url' => $this->access->get_upgrade_url(),
        ];
    }
    
    // =========================================
    // PRO VALUE SIGNAL
    // =========================================
    
    /**
     * Pro value badge verisi
     * Render sonrası gösterilecek
     */
    public function get_value_signal(array $current_metrics): array {
        // Sadece Pro kullanıcılara göster
        if (!$this->access->is_pro()) {
            return [];
        }
        
        $signals = [];
        
        // Cache hızı sinyali
        if (!empty($current_metrics['from_cache'])) {
            // Ortalama render süresini hesapla
            $avg_render_time = $this->get_average_render_time();
            $current_time = $current_metrics['render_time_ms'] ?? 0;
            
            if ($avg_render_time > 0 && $current_time < $avg_render_time) {
                $percent = round((1 - ($current_time / $avg_render_time)) * 100);
                if ($percent > 10) {
                    $signals[] = [
                        'icon'    => '⚡',
                        'text'    => "Cache ile %{$percent} daha hızlı",
                        'type'    => 'speed',
                        'percent' => $percent,
                    ];
                }
            }
        }
        
        // Dosya boyutu sinyali
        if (!empty($current_metrics['output_size_kb'])) {
            // Free kalite ile karşılaştır
            $free_quality = 70;
            $pro_quality = 88;
            
            // Tahmini Free boyutu (Pro × 0.7)
            $pro_size = $current_metrics['output_size_kb'];
            $est_free_size = $pro_size * 0.75; // WebP compression ratio
            
            // Aslında Pro daha büyük ama daha kaliteli
            $quality_boost = round((($pro_quality / $free_quality) - 1) * 100);
            if ($quality_boost > 0) {
                $signals[] = [
                    'icon'    => '✨',
                    'text'    => "%{$quality_boost} daha yüksek kalite",
                    'type'    => 'quality',
                    'percent' => $quality_boost,
                ];
            }
        }
        
        // Cache hit ratio sinyali
        $cache_ratio = $this->get_user_cache_hit_ratio();
        if ($cache_ratio > 50) {
            $signals[] = [
                'icon'    => '💾',
                'text'    => "%{$cache_ratio} cache hit oranı",
                'type'    => 'cache',
                'percent' => $cache_ratio,
            ];
        }
        
        return $signals;
    }
    
    /**
     * Ortalama render süresi (ms)
     */
    public function get_average_render_time(): int {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return 500; // Varsayılan
        }
        
        $total_cpu = (int) get_user_meta($user_id, self::META_TOTAL_CPU_MS, true);
        $total_renders = (int) get_user_meta($user_id, self::META_TOTAL_RENDERS, true);
        
        if ($total_renders === 0) {
            return 500;
        }
        
        return (int) ($total_cpu / $total_renders);
    }
    
    /**
     * Kullanıcının cache hit oranı (%)
     */
    public function get_user_cache_hit_ratio(): int {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            return 0;
        }
        
        $total = (int) get_user_meta($user_id, self::META_TOTAL_RENDERS, true);
        $hits = (int) get_user_meta($user_id, self::META_CACHE_HITS, true);
        
        if ($total === 0) {
            return 0;
        }
        
        return (int) round(($hits / $total) * 100);
    }
    
    // =========================================
    // AGENCY READY
    // =========================================
    
    /**
     * Agency metadata ekle
     */
    public function add_agency_metadata(int $listing_id, int $owner_user_id, int $generated_by_user_id): void {
        update_post_meta($listing_id, '_poster_owner_user_id', $owner_user_id);
        update_post_meta($listing_id, '_poster_generated_by_user_id', $generated_by_user_id);
    }
    
    /**
     * Agency owner'ın sub-user sayısını artır
     */
    public function increment_sub_user_count(int $owner_user_id): void {
        $count = (int) get_user_meta($owner_user_id, self::META_SUB_USER_COUNT, true);
        update_user_meta($owner_user_id, self::META_SUB_USER_COUNT, $count + 1);
    }
    
    /**
     * Kullanıcının agency owner'ını al
     */
    public function get_owner_user_id(int $user_id): int {
        $owner = get_user_meta($user_id, self::META_OWNER_USER_ID, true);
        return $owner ? (int) $owner : $user_id; // Kendisi owner değilse
    }
    
    /**
     * Agency sub-user sayısını al
     */
    public function get_sub_user_count(int $owner_user_id): int {
        return (int) get_user_meta($owner_user_id, self::META_SUB_USER_COUNT, true);
    }
    
    /**
     * Agency poster üretimi
     */
    public function track_agency_render(int $listing_id, array $metrics): void {
        $current_user = get_current_user_id();
        $owner_user = $this->get_owner_user_id($current_user);
        
        // Agency metadata ekle
        $this->add_agency_metadata($listing_id, $owner_user, $current_user);
        
        // Owner'ın metriklerini de güncelle
        if ($owner_user !== $current_user) {
            $metrics['generated_for'] = $owner_user;
            $this->update_user_metrics($owner_user, $metrics);
        }
    }
    
    // =========================================
    // ADMIN DASHBOARD
    // =========================================
    
    /**
     * Admin menüye stats sayfası ekle
     */
    public function add_stats_submenu(): void {
        add_submenu_page(
            'umrebuldum-poster-settings',
            'Usage İstatistikleri',
            '📊 İstatistikler',
            'manage_options',
            'upg-usage-stats',
            [$this, 'render_stats_page']
        );
    }
    
    /**
     * İstatistik sayfasını render et
     */
    public function render_stats_page(): void {
        $stats = $this->get_aggregated_stats();
        
        ?>
        <div class="wrap">
            <h1>📊 Poster Generator İstatistikleri</h1>
            
            <div class="upg-stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
                
                <!-- Toplam Render -->
                <div class="upg-stat-card" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 36px; font-weight: 700; color: #667eea;">
                        <?php echo number_format($stats['total_renders']); ?>
                    </div>
                    <div style="color: #666; margin-top: 4px;">Toplam Render</div>
                    <div style="font-size: 12px; color: #888; margin-top: 8px;">
                        Son 30 gün
                    </div>
                </div>
                
                <!-- Cache Hit Ratio -->
                <div class="upg-stat-card" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 36px; font-weight: 700; color: #22c55e;">
                        %<?php echo $stats['cache_hit_ratio']; ?>
                    </div>
                    <div style="color: #666; margin-top: 4px;">Cache Hit Oranı</div>
                    <div style="font-size: 12px; color: #888; margin-top: 8px;">
                        <?php echo number_format($stats['cache_hits']); ?> / <?php echo number_format($stats['total_renders']); ?>
                    </div>
                </div>
                
                <!-- CPU Tasarrufu -->
                <div class="upg-stat-card" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 36px; font-weight: 700; color: #f59e0b;">
                        ~<?php echo number_format($stats['cpu_savings_hours'], 1); ?> saat
                    </div>
                    <div style="color: #666; margin-top: 4px;">Tahmini CPU Tasarrufu</div>
                    <div style="font-size: 12px; color: #888; margin-top: 8px;">
                        Cache sayesinde
                    </div>
                </div>
                
                <!-- Free vs Pro -->
                <div class="upg-stat-card" style="background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 24px; font-weight: 700;">
                        <span style="color: #888;"><?php echo number_format($stats['free_renders']); ?></span>
                        <span style="color: #ccc; margin: 0 8px;">/</span>
                        <span style="color: #667eea;"><?php echo number_format($stats['pro_renders']); ?></span>
                    </div>
                    <div style="color: #666; margin-top: 4px;">Free / Pro Render</div>
                    <div style="font-size: 12px; color: #888; margin-top: 8px;">
                        Pro oranı: %<?php echo $stats['pro_ratio']; ?>
                    </div>
                </div>
                
            </div>
            
            <h2 style="margin-top: 30px;">Günlük Trend (Son 7 Gün)</h2>
            
            <table class="wp-list-table widefat fixed striped" style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Tarih</th>
                        <th>Render</th>
                        <th>Cache Hit</th>
                        <th>Ort. Süre</th>
                        <th>Toplam Boyut</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($stats['daily'] as $date => $day): ?>
                    <tr>
                        <td><?php echo esc_html($date); ?></td>
                        <td><?php echo number_format($day['total_renders']); ?></td>
                        <td>
                            <?php 
                            $ratio = $day['total_renders'] > 0 
                                ? round(($day['cache_hits'] / $day['total_renders']) * 100) 
                                : 0;
                            echo "%{$ratio}";
                            ?>
                        </td>
                        <td>
                            <?php
                            $avg = $day['total_renders'] > 0
                                ? round($day['total_cpu_ms'] / $day['total_renders'])
                                : 0;
                            echo "{$avg}ms";
                            ?>
                        </td>
                        <td><?php echo number_format($day['total_size_kb'], 1); ?> KB</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
        </div>
        <?php
    }
    
    /**
     * Aggregated stats al
     */
    public function get_aggregated_stats(): array {
        $daily = get_option(self::OPTION_DAILY_STATS, []);
        
        // Son 7 günü al (ters sıra)
        krsort($daily);
        $last_7_days = array_slice($daily, 0, 7, true);
        
        // Toplamları hesapla
        $total_renders = 0;
        $cache_hits = 0;
        $total_cpu_ms = 0;
        $free_renders = 0;
        $pro_renders = 0;
        
        foreach ($daily as $day) {
            $total_renders += $day['total_renders'] ?? 0;
            $cache_hits += $day['cache_hits'] ?? 0;
            $total_cpu_ms += $day['total_cpu_ms'] ?? 0;
            $free_renders += $day['free_renders'] ?? 0;
            $pro_renders += $day['pro_renders'] ?? 0;
        }
        
        // Cache hit ratio
        $cache_hit_ratio = $total_renders > 0 
            ? round(($cache_hits / $total_renders) * 100) 
            : 0;
        
        // CPU tasarrufu (cache hit × ortalama render süresi)
        $avg_render_ms = 400; // Tahmini ortalama
        $cpu_savings_ms = $cache_hits * $avg_render_ms;
        $cpu_savings_hours = $cpu_savings_ms / 1000 / 60 / 60;
        
        // Pro oranı
        $pro_ratio = $total_renders > 0
            ? round(($pro_renders / $total_renders) * 100)
            : 0;
        
        return [
            'total_renders'     => $total_renders,
            'cache_hits'        => $cache_hits,
            'cache_hit_ratio'   => $cache_hit_ratio,
            'total_cpu_ms'      => $total_cpu_ms,
            'cpu_savings_hours' => $cpu_savings_hours,
            'free_renders'      => $free_renders,
            'pro_renders'       => $pro_renders,
            'pro_ratio'         => $pro_ratio,
            'daily'             => $last_7_days,
        ];
    }
    
    // =========================================
    // JS DATA (Localize için)
    // =========================================
    
    /**
     * JS'e gönderilecek veri
     */
    public function get_js_data(): array {
        return [
            'friction'    => $this->get_friction_data(),
            'is_pro'      => $this->access->is_pro(),
            'tier'        => $this->access->get_tier(),
            'total_renders' => (int) get_user_meta(get_current_user_id(), self::META_TOTAL_RENDERS, true),
        ];
    }
    
    // =========================================
    // PRO VALUE COMPARISON - SAYILARLA GÖSTER
    // =========================================
    
    /**
     * Kullanıcının tüm metriklerini al
     */
    public function get_user_metrics(?int $user_id = null): array {
        $user_id = $user_id ?? get_current_user_id();
        
        if (!$user_id) {
            return $this->get_empty_metrics();
        }
        
        $total_renders = (int) get_user_meta($user_id, self::META_TOTAL_RENDERS, true);
        $cache_hits = (int) get_user_meta($user_id, self::META_CACHE_HITS, true);
        $total_cpu_ms = (int) get_user_meta($user_id, self::META_TOTAL_CPU_MS, true);
        $total_size_kb = (float) get_user_meta($user_id, self::META_TOTAL_SIZE_KB, true);
        
        return [
            'total_renders'    => $total_renders,
            'cache_hits'       => $cache_hits,
            'cache_misses'     => $total_renders - $cache_hits,
            'cache_hit_ratio'  => $total_renders > 0 ? round(($cache_hits / $total_renders) * 100) : 0,
            'total_cpu_ms'     => $total_cpu_ms,
            'total_cpu_sec'    => round($total_cpu_ms / 1000, 2),
            'avg_render_ms'    => $total_renders > 0 ? round($total_cpu_ms / $total_renders) : 0,
            'total_size_kb'    => round($total_size_kb, 2),
            'total_size_mb'    => round($total_size_kb / 1024, 2),
            'avg_size_kb'      => $total_renders > 0 ? round($total_size_kb / $total_renders, 2) : 0,
        ];
    }
    
    /**
     * Boş metrik seti
     */
    private function get_empty_metrics(): array {
        return [
            'total_renders'    => 0,
            'cache_hits'       => 0,
            'cache_misses'     => 0,
            'cache_hit_ratio'  => 0,
            'total_cpu_ms'     => 0,
            'total_cpu_sec'    => 0,
            'avg_render_ms'    => 0,
            'total_size_kb'    => 0,
            'total_size_mb'    => 0,
            'avg_size_kb'      => 0,
        ];
    }
    
    /**
     * Pro vs Free karşılaştırması
     * Free kullanıcıya Pro'nun avantajlarını göster
     */
    public function get_pro_value_comparison(): array {
        $user_metrics = $this->get_user_metrics();
        $is_pro = $this->access->is_pro();
        
        // Tier bazlı değerler
        $free_quality = 60;
        $pro_quality = 85;
        $free_cache_ttl_days = 1;
        $pro_cache_ttl_days = 30;
        
        // Hesaplamalar
        $quality_boost_percent = round((($pro_quality / $free_quality) - 1) * 100);
        $cache_ttl_boost_times = $pro_cache_ttl_days / $free_cache_ttl_days;
        
        // Tahmini tasarruflar
        $estimated_time_saved_ms = $user_metrics['cache_hits'] * 400; // Her cache hit ~400ms tasarruf
        $estimated_time_saved_sec = round($estimated_time_saved_ms / 1000, 1);
        
        // Pro ile potansiyel tasarruf (cache TTL 30x daha uzun)
        $potential_cache_savings = 0;
        if (!$is_pro && $user_metrics['cache_misses'] > 0) {
            // Pro olsaydı cache misses daha az olurdu
            $potential_cache_savings = round($user_metrics['cache_misses'] * 0.8); // %80 daha az miss
        }
        
        return [
            'is_pro'                => $is_pro,
            'user_metrics'          => $user_metrics,
            
            // Kalite karşılaştırması
            'quality' => [
                'free'          => $free_quality,
                'pro'           => $pro_quality,
                'boost_percent' => $quality_boost_percent,
                'label'         => "+%{$quality_boost_percent} daha yüksek kalite",
            ],
            
            // Cache TTL karşılaştırması
            'cache_ttl' => [
                'free_days'     => $free_cache_ttl_days,
                'pro_days'      => $pro_cache_ttl_days,
                'boost_times'   => $cache_ttl_boost_times,
                'label'         => "{$cache_ttl_boost_times}x daha uzun cache süresi",
            ],
            
            // Hız karşılaştırması
            'speed' => [
                'avg_render_ms'        => $user_metrics['avg_render_ms'],
                'cache_hit_ms'         => 50, // Cache hit ortalama
                'time_saved_sec'       => $estimated_time_saved_sec,
                'potential_savings'    => $potential_cache_savings,
                'label'                => "Cache ile ~8x daha hızlı",
            ],
            
            // Özellikler
            'features' => [
                'watermark'     => ['free' => true, 'pro' => false, 'label' => 'Watermark yok'],
                'templates'     => ['free' => 2, 'pro' => 'Sınırsız', 'label' => 'Tüm şablonlar'],
                'rate_limit'    => ['free' => '2/dk', 'pro' => 'Limit yok', 'label' => 'Sınırsız üretim'],
                'priority'      => ['free' => false, 'pro' => true, 'label' => 'Öncelikli işlem'],
            ],
            
            // Value badges (UI için)
            'badges' => $this->get_value_badges($user_metrics, $is_pro),
        ];
    }
    
    /**
     * Value badges oluştur
     */
    private function get_value_badges(array $metrics, bool $is_pro): array {
        $badges = [];
        
        if ($is_pro) {
            // Pro kullanıcı için kazanımlar
            if ($metrics['cache_hit_ratio'] >= 50) {
                $badges[] = [
                    'icon'  => '⚡',
                    'text'  => "%{$metrics['cache_hit_ratio']} cache hit",
                    'color' => '#22c55e',
                    'type'  => 'success',
                ];
            }
            
            if ($metrics['total_cpu_sec'] > 0) {
                $badges[] = [
                    'icon'  => '🚀',
                    'text'  => "{$metrics['total_cpu_sec']}sn CPU tasarrufu",
                    'color' => '#667eea',
                    'type'  => 'info',
                ];
            }
            
            $badges[] = [
                'icon'  => '✨',
                'text'  => "%85 kalite",
                'color' => '#f59e0b',
                'type'  => 'quality',
            ];
        } else {
            // Free kullanıcı için Pro teşvikleri
            $badges[] = [
                'icon'  => '🔓',
                'text'  => "Pro ile watermark yok",
                'color' => '#667eea',
                'type'  => 'upgrade',
            ];
            
            $badges[] = [
                'icon'  => '⚡',
                'text'  => "Pro ile 30x cache",
                'color' => '#22c55e',
                'type'  => 'upgrade',
            ];
            
            $badges[] = [
                'icon'  => '✨',
                'text'  => "Pro ile +42% kalite",
                'color' => '#f59e0b',
                'type'  => 'upgrade',
            ];
        }
        
        return $badges;
    }
    
    /**
     * Son render detayları (metabox için)
     */
    public function get_last_render_details(int $listing_id): array {
        $user_id = get_current_user_id();
        $last = get_user_meta($user_id, self::META_LAST_RENDER, true);
        
        if (!$last || ($last['listing_id'] ?? 0) !== $listing_id) {
            return [];
        }
        
        return [
            'listing_id'     => $last['listing_id'],
            'render_time_ms' => $last['render_time_ms'] ?? 0,
            'from_cache'     => $last['from_cache'] ?? false,
            'tier'           => $last['tier'] ?? 'free',
            'timestamp'      => $last['timestamp'] ?? 0,
            'time_ago'       => human_time_diff($last['timestamp'], time()) . ' önce',
        ];
    }
    
    /**
     * Günlük render özeti
     */
    public function get_daily_summary(): array {
        $today = date('Y-m-d');
        $stats = get_option(self::OPTION_DAILY_STATS, []);
        
        if (!isset($stats[$today])) {
            return [
                'renders'     => 0,
                'cache_hits'  => 0,
                'avg_ms'      => 0,
                'total_kb'    => 0,
            ];
        }
        
        $day = $stats[$today];
        
        return [
            'renders'     => $day['total_renders'] ?? 0,
            'cache_hits'  => $day['cache_hits'] ?? 0,
            'cache_ratio' => $day['total_renders'] > 0 
                ? round(($day['cache_hits'] / $day['total_renders']) * 100) 
                : 0,
            'avg_ms'      => $day['total_renders'] > 0 
                ? round($day['total_cpu_ms'] / $day['total_renders']) 
                : 0,
            'total_kb'    => round($day['total_size_kb'] ?? 0, 1),
        ];
    }
    
    /**
     * Performans karşılaştırması (Free vs Pro simülasyon)
     */
    public function simulate_pro_benefits(): array {
        $metrics = $this->get_user_metrics();
        
        if ($metrics['total_renders'] === 0) {
            return [
                'has_data' => false,
                'message'  => 'Henüz yeterli veri yok',
            ];
        }
        
        // Mevcut durum
        $current_cache_misses = $metrics['cache_misses'];
        $current_avg_ms = $metrics['avg_render_ms'];
        
        // Pro ile tahmini iyileşme
        // Pro cache 30 gün, Free 1 gün → ~96% daha az cache miss
        $pro_estimated_misses = round($current_cache_misses * 0.04);
        $pro_time_saved_ms = ($current_cache_misses - $pro_estimated_misses) * $current_avg_ms;
        $pro_time_saved_sec = round($pro_time_saved_ms / 1000, 1);
        
        return [
            'has_data'           => true,
            'current_misses'     => $current_cache_misses,
            'pro_misses'         => $pro_estimated_misses,
            'miss_reduction'     => $current_cache_misses - $pro_estimated_misses,
            'time_saved_sec'     => $pro_time_saved_sec,
            'time_saved_min'     => round($pro_time_saved_sec / 60, 1),
            'message'            => "Pro ile tahmini {$pro_time_saved_sec} saniye tasarruf",
        ];
    }
}
