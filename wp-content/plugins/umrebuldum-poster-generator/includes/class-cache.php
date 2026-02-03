<?php
/**
 * Poster Cache Manager
 * 
 * Disk-based cache + WebP optimization
 * Redis olmadan çalışır, Hostinger uyumlu
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Cache {
    
    private $cache_dir;
    private $cache_url;
    private $ttl;
    private $tier = 'free';
    
    /**
     * Tier bazlı TTL değerleri
     */
    const TTL_FREE = DAY_IN_SECONDS;        // 24 saat
    const TTL_PRO  = DAY_IN_SECONDS * 30;   // 30 gün
    
    public function __construct(string $tier = 'free') {
        $this->tier = $tier;
        
        $upload = wp_upload_dir();
        // CDN-uyumlu dizin yapısı
        $this->cache_dir = $upload['basedir'] . '/umrebuldum/generated';
        $this->cache_url = $upload['baseurl'] . '/umrebuldum/generated';
        $this->ttl = $this->get_ttl_for_tier($tier);
        
        // Klasör oluştur
        if (!file_exists($this->cache_dir)) {
            wp_mkdir_p($this->cache_dir);
            file_put_contents($this->cache_dir . '/.htaccess', "Options -Indexes\n");
        }
    }
    
    /**
     * Tier'a göre TTL
     */
    public function get_ttl_for_tier(string $tier): int {
        return $tier === 'pro' ? self::TTL_PRO : self::TTL_FREE;
    }
    
    /**
     * Tier'ı değiştir
     */
    public function set_tier(string $tier): void {
        $this->tier = $tier;
        $this->ttl = $this->get_ttl_for_tier($tier);
    }
    
    /**
     * Cache key oluştur - SMART VERSION
     * user_id + listing_id + template + size + payload hash
     */
    public function get_key(int $listing_id, string $template, string $size, ?int $user_id = null): string {
        $user_id = $user_id ?? get_current_user_id();
        $modified = get_post_modified_time('U', true, $listing_id) ?: 0;
        
        // Smart cache key
        $payload = implode('_', [
            $user_id,
            $listing_id,
            $template,
            $size,
            $modified,
        ]);
        
        return md5($payload);
    }
    
    /**
     * Cache'de var mı?
     */
    public function has(string $key): bool {
        $path = $this->get_path($key);
        
        if (!file_exists($path)) {
            return false;
        }
        
        // TTL kontrolü
        if ((time() - filemtime($path)) > $this->ttl) {
            unlink($path);
            return false;
        }
        
        return true;
    }
    
    /**
     * Cache'den al
     */
    public function get(string $key): ?array {
        if (!$this->has($key)) {
            return null;
        }
        
        $path = $this->get_path($key);
        $url = $this->get_url($key);
        
        return [
            'path' => $path,
            'url'  => $url,
            'size' => filesize($path),
            'type' => $this->get_image_type($path),
        ];
    }
    
    /**
     * Cache'e kaydet
     * WebP silent fail koruması ile
     * 
     * @param string $key        Cache key
     * @param string $source_path Kaynak dosya yolu
     * @param int    $quality    WebP quality (Free: 60, Pro: 85)
     */
    public function set(string $key, string $source_path, int $quality = 82): ?array {
        // Kaynak resmi yükle
        $source = $this->load_image($source_path);
        if (!$source) {
            return null;
        }
        
        $saved = false;
        $cache_path = null;
        $ext = null;
        
        // WebP dene (Hostinger silent fail koruması)
        if ($this->supports_webp()) {
            $webp_path = $this->cache_dir . '/' . $key . '.webp';
            $result = @imagewebp($source, $webp_path, $quality);
            
            // Dosya gerçekten oluştu mu? (silent fail kontrolü)
            if ($result && file_exists($webp_path) && filesize($webp_path) > 0) {
                $cache_path = $webp_path;
                $ext = 'webp';
                $saved = true;
            } else {
                // WebP başarısız, temizle
                @unlink($webp_path);
            }
        }
        
        // WebP başarısız veya desteklenmiyor → PNG fallback
        if (!$saved) {
            $png_path = $this->cache_dir . '/' . $key . '.png';
            $result = @imagepng($source, $png_path, 6);
            
            if ($result && file_exists($png_path)) {
                $cache_path = $png_path;
                $ext = 'png';
                $saved = true;
            }
        }
        
        imagedestroy($source);
        
        // Hiçbiri başarısız olduysa
        if (!$saved || !$cache_path) {
            return null;
        }
        
        // Orijinal temp dosyayı sil
        if ($source_path !== $cache_path && file_exists($source_path)) {
            @unlink($source_path);
        }
        
        return [
            'path' => $cache_path,
            'url'  => $this->cache_url . '/' . $key . '.' . $ext,
            'size' => filesize($cache_path),
            'type' => $ext,
        ];
    }
    
    /**
     * Tek poster sil
     */
    public function delete(string $key): bool {
        $patterns = [
            $this->cache_dir . '/' . $key . '.webp',
            $this->cache_dir . '/' . $key . '.png',
        ];
        
        foreach ($patterns as $path) {
            if (file_exists($path)) {
                unlink($path);
            }
        }
        
        return true;
    }
    
    /**
     * Listing'e ait tüm cache'leri sil
     */
    public function delete_for_listing(int $listing_id): int {
        $pattern = $this->cache_dir . '/*';
        $files = glob($pattern);
        $deleted = 0;
        
        foreach ($files as $file) {
            $filename = basename($file);
            // Eski format poster dosyaları
            if (strpos($filename, "poster_{$listing_id}_") === 0) {
                unlink($file);
                $deleted++;
            }
        }
        
        return $deleted;
    }
    
    /**
     * Eski cache'leri temizle
     */
    public function cleanup(int $max_age = null): array {
        $max_age = $max_age ?? $this->ttl;
        $now = time();
        $deleted = 0;
        $freed = 0;
        
        $files = glob($this->cache_dir . '/*');
        
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > $max_age) {
                $freed += filesize($file);
                unlink($file);
                $deleted++;
            }
        }
        
        return [
            'deleted' => $deleted,
            'freed'   => $freed,
            'freed_mb' => round($freed / 1024 / 1024, 2),
        ];
    }
    
    /**
     * Cache istatistikleri
     */
    public function stats(): array {
        $files = glob($this->cache_dir . '/*');
        $total_size = 0;
        $count = 0;
        $types = ['webp' => 0, 'png' => 0];
        
        foreach ($files as $file) {
            if (!is_file($file)) continue;
            
            $total_size += filesize($file);
            $count++;
            
            $ext = pathinfo($file, PATHINFO_EXTENSION);
            if (isset($types[$ext])) {
                $types[$ext]++;
            }
        }
        
        return [
            'count'      => $count,
            'total_size' => $total_size,
            'total_mb'   => round($total_size / 1024 / 1024, 2),
            'types'      => $types,
            'webp_support' => $this->supports_webp(),
            'cache_dir'  => $this->cache_dir,
        ];
    }
    
    /**
     * WebP desteği var mı?
     */
    public function supports_webp(): bool {
        if (!function_exists('imagewebp')) {
            return false;
        }
        
        // GD WebP desteğini kontrol et
        $gd_info = gd_info();
        return !empty($gd_info['WebP Support']);
    }
    
    /**
     * Health check için cache durumu
     */
    public function health_stats(): array {
        $dir_exists = file_exists($this->cache_dir);
        $writable = $dir_exists && is_writable($this->cache_dir);
        
        $total_files = 0;
        $total_size = 0;
        $oldest_age_hours = 0;
        
        if ($dir_exists) {
            $files = glob($this->cache_dir . '/*');
            $now = time();
            
            foreach ($files as $file) {
                if (!is_file($file)) continue;
                
                $total_files++;
                $total_size += filesize($file);
                
                $age_hours = ($now - filemtime($file)) / 3600;
                if ($age_hours > $oldest_age_hours) {
                    $oldest_age_hours = $age_hours;
                }
            }
        }
        
        return [
            'cache_dir_exists'          => $dir_exists,
            'cache_writable'            => $writable,
            'cache_total_files'         => $total_files,
            'cache_total_size_mb'       => round($total_size / 1024 / 1024, 2),
            'oldest_cache_file_age_hours' => round($oldest_age_hours, 1),
        ];
    }
    
    // =========================================
    // METADATA MANAGEMENT
    // =========================================
    
    /**
     * Cache metadata kaydet
     */
    public function save_metadata(string $key, array $metadata): bool {
        $meta_path = $this->cache_dir . '/' . $key . '.meta.json';
        return file_put_contents($meta_path, json_encode($metadata)) !== false;
    }
    
    /**
     * Cache metadata oku
     */
    public function get_metadata(string $key): ?array {
        $meta_path = $this->cache_dir . '/' . $key . '.meta.json';
        
        if (!file_exists($meta_path)) {
            return null;
        }
        
        $data = file_get_contents($meta_path);
        return json_decode($data, true);
    }
    
    /**
     * Cache bilgisi
     */
    public function get_cache_info(string $key): ?array {
        $path = $this->get_path($key);
        
        if (!file_exists($path)) {
            return [
                'cached' => false,
                'key'    => $key,
            ];
        }
        
        $mtime = filemtime($path);
        $expires = $mtime + $this->ttl;
        
        return [
            'cached'     => true,
            'key'        => $key,
            'path'       => $path,
            'url'        => $this->get_url($key),
            'size'       => filesize($path),
            'format'     => $this->get_image_type($path),
            'created_at' => $mtime,
            'expires_at' => $expires,
            'ttl'        => $this->ttl,
            'remaining'  => max(0, $expires - time()),
            'tier'       => $this->tier,
        ];
    }
    
    /**
     * Poster metadata oluştur
     * Agency altyapısı ile genişletildi
     */
    public function create_poster_metadata(int $listing_id, string $template, bool $from_cache = false): array {
        $user_id = get_current_user_id();
        
        // Agency metadata al
        $agency_meta = Agency_Helper::get_poster_agency_metadata($user_id);
        
        return [
            // Temel bilgiler
            'user_id'             => $user_id,
            'listing_id'          => $listing_id,
            'plan'                => $this->tier,
            'template_id'         => $template,
            'created_at'          => time(),
            'from_cache'          => $from_cache,
            'ttl'                 => $this->ttl,
            'format'              => $this->supports_webp() ? 'webp' : 'jpg',
            
            // Agency altyapısı (görünmez ama kritik)
            'owner_user_id'       => $agency_meta['owner_user_id'],
            'generated_by_user_id'=> $agency_meta['generated_by_user_id'],
            'agency_id'           => $agency_meta['agency_id'],
            'is_agency_render'    => $agency_meta['is_agency_render'],
        ];
    }
    
    // =========================================
    // PRIVATE HELPERS
    // =========================================
    
    private function get_path(string $key): string {
        // Önce WebP ara
        $webp = $this->cache_dir . '/' . $key . '.webp';
        if (file_exists($webp)) {
            return $webp;
        }
        
        // JPG fallback
        $jpg = $this->cache_dir . '/' . $key . '.jpg';
        if (file_exists($jpg)) {
            return $jpg;
        }
        
        // PNG fallback (eski dosyalar için)
        return $this->cache_dir . '/' . $key . '.png';
    }
    
    private function get_url(string $key): string {
        $webp = $this->cache_dir . '/' . $key . '.webp';
        if (file_exists($webp)) {
            return $this->cache_url . '/' . $key . '.webp';
        }
        
        $jpg = $this->cache_dir . '/' . $key . '.jpg';
        if (file_exists($jpg)) {
            return $this->cache_url . '/' . $key . '.jpg';
        }
        
        return $this->cache_url . '/' . $key . '.png';
    }
    
    private function load_image(string $path) {
        if (!file_exists($path)) {
            return null;
        }
        
        $info = getimagesize($path);
        if (!$info) {
            return null;
        }
        
        switch ($info[2]) {
            case IMAGETYPE_PNG:
                return imagecreatefrompng($path);
            case IMAGETYPE_JPEG:
                return imagecreatefromjpeg($path);
            case IMAGETYPE_WEBP:
                return imagecreatefromwebp($path);
            default:
                return null;
        }
    }
    
    private function get_image_type(string $path): string {
        return pathinfo($path, PATHINFO_EXTENSION);
    }
    
    /**
     * Cache dizin yolunu döndür
     */
    public function get_cache_dir(): string {
        return $this->cache_dir;
    }
    
    /**
     * Cache URL'ini döndür
     */
    public function get_cache_url(): string {
        return $this->cache_url;
    }
    
    // =========================================
    // PERFORMANCE METRICS - PRO VALUE
    // =========================================
    
    /**
     * Cache performans metrikleri
     * Pro değer hesaplaması için kullanılır
     */
    public function get_performance_metrics(): array {
        $stats = $this->stats();
        
        // Tahmini render süresi tasarrufu
        // Her cache hit ortalama 400ms tasarruf sağlar
        $avg_render_time_ms = 400;
        $estimated_time_saved_ms = $stats['count'] * $avg_render_time_ms;
        
        // Disk alanı tasarrufu
        // PNG yerine WebP kullanarak ~60% tasarruf
        $webp_savings_percent = 60;
        $estimated_disk_saved = $stats['total_size'] * ($webp_savings_percent / 40);
        
        return [
            // Temel stats
            'total_files'      => $stats['count'],
            'total_size_bytes' => $stats['total_size'],
            'total_size_mb'    => $stats['total_mb'],
            'webp_count'       => $stats['types']['webp'] ?? 0,
            'png_count'        => $stats['types']['png'] ?? 0,
            
            // Performans
            'webp_support'     => $stats['webp_support'],
            'webp_ratio'       => $stats['count'] > 0 
                ? round((($stats['types']['webp'] ?? 0) / $stats['count']) * 100) 
                : 0,
            
            // Tasarruflar
            'time_saved_ms'    => $estimated_time_saved_ms,
            'time_saved_sec'   => round($estimated_time_saved_ms / 1000, 1),
            'time_saved_min'   => round($estimated_time_saved_ms / 1000 / 60, 2),
            'disk_saved_mb'    => round($estimated_disk_saved / 1024 / 1024, 2),
            
            // Tier bilgisi
            'tier'             => $this->tier,
            'ttl_seconds'      => $this->ttl,
            'ttl_days'         => round($this->ttl / DAY_IN_SECONDS, 1),
        ];
    }
    
    /**
     * Cache hit/miss simülasyonu
     * Free vs Pro karşılaştırması için
     */
    public function simulate_tier_comparison(int $render_count): array {
        // Free: 1 gün TTL → günde 1 cache miss per listing
        // Pro: 30 gün TTL → ayda 1 cache miss per listing
        
        $avg_render_ms = 400;
        
        // Free senaryosu
        $free_ttl_days = 1;
        $free_cache_misses = $render_count * (30 / $free_ttl_days) / 30; // Aylık miss oranı
        $free_total_render_time = $free_cache_misses * $avg_render_ms;
        
        // Pro senaryosu
        $pro_ttl_days = 30;
        $pro_cache_misses = $render_count * (30 / $pro_ttl_days) / 30;
        $pro_total_render_time = $pro_cache_misses * $avg_render_ms;
        
        // Fark
        $time_saved_ms = $free_total_render_time - $pro_total_render_time;
        
        return [
            'render_count'         => $render_count,
            
            'free' => [
                'ttl_days'         => $free_ttl_days,
                'cache_misses'     => round($free_cache_misses),
                'total_render_ms'  => round($free_total_render_time),
                'total_render_sec' => round($free_total_render_time / 1000, 1),
            ],
            
            'pro' => [
                'ttl_days'         => $pro_ttl_days,
                'cache_misses'     => round($pro_cache_misses),
                'total_render_ms'  => round($pro_total_render_time),
                'total_render_sec' => round($pro_total_render_time / 1000, 1),
            ],
            
            'savings' => [
                'cache_misses_avoided' => round($free_cache_misses - $pro_cache_misses),
                'time_saved_ms'        => round($time_saved_ms),
                'time_saved_sec'       => round($time_saved_ms / 1000, 1),
                'efficiency_boost'     => $free_cache_misses > 0 
                    ? round((1 - ($pro_cache_misses / $free_cache_misses)) * 100) 
                    : 0,
            ],
        ];
    }
    
    /**
     * Tier bazlı kalite karşılaştırması
     */
    public function get_quality_comparison(): array {
        return [
            'free' => [
                'quality'      => 60,
                'format'       => 'webp',
                'ttl_days'     => 1,
                'watermark'    => true,
                'description'  => 'Standart kalite, günlük cache',
            ],
            'pro' => [
                'quality'      => 85,
                'format'       => 'webp',
                'ttl_days'     => 30,
                'watermark'    => false,
                'description'  => 'Yüksek kalite, aylık cache',
            ],
            'difference' => [
                'quality_boost'     => '+42%',
                'cache_ttl_boost'   => '30x',
                'watermark_removed' => true,
            ],
        ];
    }
    
    /**
     * Belirli bir listing için cache durumu
     */
    public function get_listing_cache_status(int $listing_id, string $template = 'default', string $size = 'instagram'): array {
        $key = $this->get_key($listing_id, $template, $size);
        $info = $this->get_cache_info($key);
        
        if (!$info['cached']) {
            return [
                'status'    => 'miss',
                'cached'    => false,
                'needs_render' => true,
                'estimated_time_ms' => 400,
            ];
        }
        
        return [
            'status'      => 'hit',
            'cached'      => true,
            'needs_render' => false,
            'estimated_time_ms' => 50,
            'size_kb'     => round($info['size'] / 1024, 2),
            'format'      => $info['format'],
            'expires_in'  => $info['remaining'],
            'expires_in_hours' => round($info['remaining'] / 3600, 1),
            'tier'        => $info['tier'],
        ];
    }
}

