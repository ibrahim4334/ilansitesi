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
     * Agency meta keys
     */
    const META_OWNER_USER_ID    = '_upg_owner_user_id';
    const META_SUB_USER_COUNT   = '_upg_sub_user_count';
    
    /**
     * Daily aggregate option key
     */
    const OPTION_DAILY_STATS    = 'upg_daily_stats';
    
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
}
