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
     */
    public function create_poster_metadata(int $listing_id, string $template, bool $from_cache = false): array {
        return [
            'user_id'     => get_current_user_id(),
            'listing_id'  => $listing_id,
            'plan'        => $this->tier,
            'template_id' => $template,
            'created_at'  => time(),
            'from_cache'  => $from_cache,
            'ttl'         => $this->ttl,
            'format'      => $this->supports_webp() ? 'webp' : 'jpg',
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
}

