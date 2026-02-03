<?php
/**
 * Insights Engine
 * 
 * Generates actionable insights based on existing data.
 * Pure aggregation logic - no side effects.
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Insights_Engine {
    
    private $cache;
    private $tracker;
    
    public function __construct() {
        $this->cache = new Cache();
        $this->tracker = new Usage_Tracker();
    }
    
    /**
     * Generate all insights
     * 
     * @return array List of insight objects: {type, title, message, action}
     */
    public function generate(): array {
        $insights = [];
        
        // 1. Health Insights
        $this->check_health_status($insights);
        
        // 2. Performance Insights
        $this->check_performance($insights);
        
        // 3. Error Insights
        $this->check_errors($insights);
        
        // 4. Growth & Monetization Insights
        $this->check_opportunities($insights);
        
        // Sort: Critical > Warning > Opportunity
        usort($insights, function($a, $b) {
            $scores = ['critical' => 3, 'warning' => 2, 'opportunity' => 1];
            return ($scores[$b['type']] ?? 0) - ($scores[$a['type']] ?? 0);
        });
        
        return array_slice($insights, 0, 5); // Max 5 insights
    }
    
    /**
     * Check core system health
     */
    private function check_health_status(array &$insights): void {
        $health = $this->cache->health_stats();
        
        if (!$health['cache_writable']) {
            $insights[] = [
                'type'    => 'critical',
                'title'   => 'Cache Yazılamıyor',
                'message' => 'Cache dizini yazılabilir değil. Afiş üretimi durmuş olabilir.',
                'action'  => 'Uploads dizini izinlerini (755) kontrol edin.'
            ];
        }
        
        $gd = extension_loaded('gd');
        if (!$gd) {
            $insights[] = [
                'type'    => 'critical',
                'title'   => 'GD Kütüphanesi Eksik',
                'message' => 'PHP GD eklentisi yüklü değil. Resim işlenemez.',
                'action'  => 'Hosting sağlayıcınızdan PHP GD extension açmalarını isteyin.'
            ];
        }
    }
    
    /**
     * Check performance metrics (cache ratio etc)
     */
    private function check_performance(array &$insights): void {
        $today = date('Y-m-d');
        $stats = get_option(Usage_Tracker::OPTION_DAILY_STATS, []);
        $today_stats = $stats[$today] ?? null;
        
        if (!$today_stats || $today_stats['total_renders'] < 10) {
            return; // Yetersiz veri
        }
        
        $ratio = ($today_stats['cache_hits'] / $today_stats['total_renders']) * 100;
        
        if ($ratio < 30) {
            $insights[] = [
                'type'    => 'warning',
                'title'   => 'Düşük Cache Oranı (' . round($ratio) . '%)',
                'message' => 'Cache hit oranı çok düşük. Sunucu yükü artabilir.',
                'action'  => 'TTL ayarlarını veya cache temizleme sıklığını kontrol edin.'
            ];
        }
        
        // Yüksek render süresi
        $avg_time = $today_stats['total_cpu_ms'] / $today_stats['total_renders'];
        if ($avg_time > 2000) {
            $insights[] = [
                'type'    => 'warning',
                'title'   => 'Yavaş Render Süresi',
                'message' => 'Ortalama render süresi ' . round($avg_time/1000, 1) . ' saniye. Bu normalden yüksek.',
                'action'  => 'Hosting kaynaklarını veya görsel boyutlarını kontrol edin.'
            ];
        }
    }
    
    /**
     * Check error aggregates
     */
    private function check_errors(array &$insights): void {
        $errors = $this->tracker->get_today_errors();
        $total = $errors['total'];
        
        if ($total > 20) {
            $insights[] = [
                'type'    => 'warning',
                'title'   => 'Yüksek Hata Sayısı',
                'message' => "Bugün $total adet hata kaydedildi.",
                'action'  => 'Sistem Durumu > Hatalar sekmesini inceleyin.'
            ];
        }
        
        $fetch_fails = $errors['by_type'][Usage_Tracker::ERROR_FETCH_FAILED] ?? 0;
        if ($fetch_fails > 5) {
            $insights[] = [
                'type'    => 'warning',
                'title'   => 'Görsel Çekilemiyor',
                'message' => "$fetch_fails adet görsel indirme hatası var.",
                'action'  => 'SSRF koruması, private IP engelleri veya karşı sunucu timeout olabilir.'
            ];
        }
    }
    
    /**
     * Check business opportunities
     */
    private function check_opportunities(array &$insights): void {
        $stats = get_option(Usage_Tracker::OPTION_DAILY_STATS, []);
        $today = date('Y-m-d');
        $today_stats = $stats[$today] ?? null;
        
        if (!$today_stats || $today_stats['total_renders'] < 10) return;
        
        // Free ratio high
        $free_ratio = ($today_stats['free_renders'] / $today_stats['total_renders']) * 100;
        if ($free_ratio > 80) {
            $insights[] = [
                'type'    => 'opportunity',
                'title'   => 'Yüksek Free Kullanımı',
                'message' => 'Kullanıcıların %' . round($free_ratio) . ' kadarı Free planda.',
                'action'  => 'Limitleri sıkılaştırarak veya Pro özellikleri öne çıkararak dönüşüm artırılabilir.'
            ];
        }
        
        // Peak day logic
        // Basit bir yaklasim: bugun son 7 gunun ortalamasindan %50 yuksekse
        $last_7_sum = 0;
        $count = 0;
        for ($i=1; $i<=7; $i++) {
            $date = date('Y-m-d', strtotime("-$i days"));
            if (isset($stats[$date])) {
                $last_7_sum += $stats[$date]['total_renders'];
                $count++;
            }
        }
        
        if ($count > 0) {
            $avg = $last_7_sum / $count;
            if ($avg > 10 && $today_stats['total_renders'] > ($avg * 1.5)) {
                $insights[] = [
                    'type'    => 'opportunity',
                    'title'   => 'Trafik Artışı',
                    'message' => 'Bugün render sayısı ortalamanın %50 üzerinde.',
                    'action'  => 'Sunucu kaynaklarını izleyin, bu viral bir etki olabilir.'
                ];
            }
        }
    }
}
