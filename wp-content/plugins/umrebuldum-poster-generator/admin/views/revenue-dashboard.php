<?php
/**
 * Content & Revenue Dashboard View
 * 
 * Shows content velocity, revenue indicators, and technical savings.
 * Read-only statistics based on 'upg_daily_stats'.
 * 
 * @package Umrebuldum\Poster
 */

defined('ABSPATH') || exit;

// ==========================================
// 1. DATA PROCESSING
// ==========================================

$stats = get_option('upg_daily_stats', []);
$today_date = date('Y-m-d');

// Son 30 gün için filtrele ve sırala
$last_30_days = [];
for ($i = 29; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    if (isset($stats[$date])) {
        $last_30_days[$date] = $stats[$date];
    } else {
        // Boş günler için placeholder
        $last_30_days[$date] = [
            'total_renders' => 0,
            'cache_hits' => 0,
            'total_cpu_ms' => 0,
            'free_renders' => 0,
            'pro_renders' => 0
        ];
    }
}

// Agregasyon Değişkenleri
$total_30_renders = 0;
$total_30_free = 0;
$total_30_pro = 0;
$total_30_hits = 0;
$total_30_cpu = 0; // ms

// Peak analizi
$peak_day = ['date' => '-', 'count' => 0];

// Haftalık büyüme analizi
$this_week_sum = 0;
$last_week_sum = 0;
$day_index = 0;

foreach ($last_30_days as $date => $day_stats) {
    // Basic Sums
    $renders = $day_stats['total_renders'] ?? 0;
    $total_30_renders += $renders;
    $total_30_free += $day_stats['free_renders'] ?? 0;
    $total_30_pro += $day_stats['pro_renders'] ?? 0;
    $total_30_hits += $day_stats['cache_hits'] ?? 0;
    $total_30_cpu += $day_stats['total_cpu_ms'] ?? 0;

    // Peak Check
    if ($renders > $peak_day['count']) {
        $peak_day = ['date' => $date, 'count' => $renders];
    }

    // Weekly Growth Logic (Son 7 gün vs Önceki 7 gün)
    // Array 30 günlüktür. Son 7 gün: index 23-29. Önceki 7 gün: 16-22.
    if ($day_index >= 23) {
        $this_week_sum += $renders;
    } elseif ($day_index >= 16) {
        $last_week_sum += $renders;
    }
    $day_index++;
}

// Bugünün verisi
$today_stats = $last_30_days[$today_date] ?? ['total_renders' => 0];
$today_renders = $today_stats['total_renders'];

// Metrics Calculations
$pro_ratio = $total_30_renders > 0 ? ($total_30_pro / $total_30_renders) * 100 : 0;
$cache_hit_ratio = $total_30_renders > 0 ? ($total_30_hits / $total_30_renders) * 100 : 0;

// Growth calc
$growth_rate = 0;
if ($last_week_sum > 0) {
    $growth_rate = (($this_week_sum - $last_week_sum) / $last_week_sum) * 100;
} else if ($this_week_sum > 0) {
    $growth_rate = 100; // İlk hafta
}

// Cost Estimations (Placeholder: 0.05 TL per CPU-intensive render)
// Cache hit olmayan render'lar maliyet oluşturur
$cost_per_render = 0.05; 
$estimated_free_cost = ($total_30_free - ($total_30_hits * (1 - ($pro_ratio/100)))) * $cost_per_render; 
// Basit hesap: Free render sayısı üzerinden gidelim, cache hit oranını genel varsayalım
$estimated_free_cost = $total_30_free * (1 - ($cache_hit_ratio/100)) * $cost_per_render;

// Technical Savings
// Ortalama render süresi (cache olmayan)
$actual_generations = $total_30_renders - $total_30_hits;
$avg_render_ms = $actual_generations > 0 ? ($total_30_cpu / $actual_generations) : 500; // default 500ms
$saved_seconds = ($total_30_hits * $avg_render_ms) / 1000;

?>

<div class="wrap">
    <h1>📈 İçerik ve Gelir Raporu</h1>
    <p class="description">Son 30 günlük veriler temel alınarak oluşturulmuştur.</p>

    <!-- Dashboard Grid -->
    <div class="upg-dashboard-grid">
        
        <!-- 1. REVENUE INDICATORS -->
        <div class="upg-dash-section">
            <h2 class="upg-section-title">💰 Gelir Göstergeleri</h2>
            
            <div class="upg-stat-box">
                <div class="upg-stat-label">Toplam Render (30 Gün)</div>
                <div class="upg-stat-value"><?php echo number_format($total_30_renders); ?></div>
            </div>

            <div class="upg-stat-box">
                <div class="upg-stat-label">Pro / Free Dağılımı</div>
                <div class="upg-stat-value">
                    <span style="color: #46b450;"><?php echo number_format($pro_ratio, 1); ?>% Pro</span>
                    <small style="color: #666; font-size: 14px;">(<?php echo number_format($total_30_pro); ?> adet)</small>
                </div>
                <div class="upg-progress-bar">
                    <div class="upg-progress-fill" style="width: <?php echo $pro_ratio; ?>%"></div>
                </div>
            </div>

            <div class="upg-stat-box">
                <div class="upg-stat-label">Tahmini Free Tier Maliyeti</div>
                <div class="upg-stat-value" style="color: #dc3232;">
                    <?php echo number_format($estimated_free_cost, 2); ?> TL
                </div>
                <small class="description">İşlemci yükü bazlı tahmini maliyet</small>
            </div>
        </div>

        <!-- 2. CONTENT VELOCITY -->
        <div class="upg-dash-section">
            <h2 class="upg-section-title">🚀 İçerik Hızı</h2>

            <div class="upg-stat-box">
                <div class="upg-stat-label">Bugün Üretilen</div>
                <div class="upg-stat-value"><?php echo number_format($today_renders); ?></div>
            </div>

            <div class="upg-stat-box">
                <div class="upg-stat-label">Haftalık Büyüme</div>
                <div class="upg-stat-value <?php echo $growth_rate >= 0 ? 'upg-positive' : 'upg-negative'; ?>">
                    <?php echo $growth_rate > 0 ? '+' : ''; ?><?php echo number_format($growth_rate, 1); ?>%
                </div>
                <small class="description">Geçen haftaya göre</small>
            </div>

            <div class="upg-stat-box">
                <div class="upg-stat-label">En Yoğun Gün</div>
                <div class="upg-stat-value" style="font-size: 20px;">
                    <?php echo $peak_day['date']; ?>
                </div>
                <small class="description"><?php echo number_format($peak_day['count']); ?> render</small>
            </div>
        </div>

        <!-- 3. TECHNICAL SAVINGS -->
        <div class="upg-dash-section">
            <h2 class="upg-section-title">⚡ Teknik Tasarruf</h2>

            <div class="upg-stat-box">
                <div class="upg-stat-label">Cache Hit Oranı</div>
                <div class="upg-stat-value"><?php echo number_format($cache_hit_ratio, 1); ?>%</div>
                <div class="upg-progress-bar">
                    <div class="upg-progress-fill" style="width: <?php echo $cache_hit_ratio; ?>%; background: #2271b1;"></div>
                </div>
            </div>

            <div class="upg-stat-box">
                <div class="upg-stat-label">Kazanılan CPU Süresi</div>
                <div class="upg-stat-value" style="color: #2271b1;">
                    ~<?php echo number_format($saved_seconds, 1); ?> sn
                </div>
                <small class="description">Cache sayesinde işlemci meşgul edilmedi</small>
            </div>

            <div class="upg-stat-box">
                <div class="upg-stat-label">Ort. Render Süresi</div>
                <div class="upg-stat-value"><?php echo number_format($avg_render_ms); ?> ms</div>
            </div>
        </div>

    </div>
</div>

<style>
.upg-dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.upg-dash-section {
    background: #fff;
    border: 1px solid #c3c4c7;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 1px 1px rgba(0,0,0,.04);
}

.upg-section-title {
    margin-top: 0;
    padding-bottom: 15px;
    border-bottom: 1px solid #f0f0f1;
    font-size: 1.2em;
}

.upg-stat-box {
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px dashed #f0f0f1;
}

.upg-stat-box:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.upg-stat-label {
    color: #646970;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 5px;
}

.upg-stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #1d2327;
}

.upg-progress-bar {
    height: 6px;
    background: #f0f0f1;
    border-radius: 3px;
    margin-top: 8px;
    overflow: hidden;
}

.upg-progress-fill {
    height: 100%;
    background: #46b450;
}

.upg-positive { color: #46b450; }
.upg-negative { color: #dc3232; }
</style>
