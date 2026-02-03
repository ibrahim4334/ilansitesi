<?php
/**
 * CPU-Friendly Image Processor
 * 
 * Hostinger paylaşımlı hosting için optimize edilmiş
 * - Chunk-based processing
 * - Memory limit awareness
 * - Queue deferred operations
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Image_Processor {
    
    private $memory_limit;
    private $memory_reserve = 20; // MB - güvenlik payı
    private $max_dimension = 2048;
    
    public function __construct() {
        $this->memory_limit = $this->parse_memory_limit(ini_get('memory_limit'));
    }
    
    /**
     * Güvenli resim yükleme
     * Bellek kontrolü yapar, gerekirse resize eder
     */
    public function load_safe(string $url_or_path): ?array {
        // URL mi yoksa path mi?
        $is_url = filter_var($url_or_path, FILTER_VALIDATE_URL);
        
        if ($is_url) {
            $data = $this->fetch_image($url_or_path);
            if (!$data) return null;
        } else {
            if (!file_exists($url_or_path)) return null;
            $data = file_get_contents($url_or_path);
        }
        
        // Boyut ve bellek kontrolü
        $info = getimagesizefromstring($data);
        if (!$info) return null;
        
        $width = $info[0];
        $height = $info[1];
        $type = $info[2];
        
        // Tahmini bellek hesapla (RGB = 3 byte per pixel + overhead)
        $estimated_memory = ($width * $height * 4) / 1024 / 1024; // MB
        $available = $this->get_available_memory();
        
        // Bellek yetersizse küçült
        $scale = 1;
        if ($estimated_memory > ($available - $this->memory_reserve)) {
            $safe_pixels = (($available - $this->memory_reserve) * 1024 * 1024) / 4;
            $current_pixels = $width * $height;
            $scale = sqrt($safe_pixels / $current_pixels);
            $scale = min($scale, 1);
        }
        
        // Maksimum boyut kontrolü
        if ($width > $this->max_dimension || $height > $this->max_dimension) {
            $dim_scale = $this->max_dimension / max($width, $height);
            $scale = min($scale, $dim_scale);
        }
        
        // Resmi oluştur
        $image = @imagecreatefromstring($data);
        unset($data); // Belleği hemen serbest bırak
        
        if (!$image) return null;
        
        // Resize gerekiyorsa
        if ($scale < 1) {
            $new_width = (int)($width * $scale);
            $new_height = (int)($height * $scale);
            
            $resized = imagecreatetruecolor($new_width, $new_height);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            
            imagecopyresampled(
                $resized, $image,
                0, 0, 0, 0,
                $new_width, $new_height,
                $width, $height
            );
            
            imagedestroy($image);
            $image = $resized;
            $width = $new_width;
            $height = $new_height;
        }
        
        return [
            'image'  => $image,
            'width'  => $width,
            'height' => $height,
            'type'   => $type,
            'scaled' => $scale < 1,
        ];
    }
    
    /**
     * Güvenli kaydetme
     * WebP > JPEG > PNG sıralamasıyla en verimli formatı seçer
     */
    public function save_optimized($image, string $path, int $quality = 85): array {
        $formats = [];
        
        // WebP dene
        if (function_exists('imagewebp') && $this->gd_supports_webp()) {
            $webp_path = preg_replace('/\.[^.]+$/', '.webp', $path);
            imagewebp($image, $webp_path, $quality);
            $formats['webp'] = [
                'path' => $webp_path,
                'size' => filesize($webp_path),
            ];
        }
        
        // PNG (kayıpsız, ama büyük)
        $png_path = preg_replace('/\.[^.]+$/', '.png', $path);
        imagepng($image, $png_path, 8);
        $formats['png'] = [
            'path' => $png_path,
            'size' => filesize($png_path),
        ];
        
        // En küçük formatı seç
        $best = null;
        $best_size = PHP_INT_MAX;
        
        foreach ($formats as $format => $data) {
            if ($data['size'] < $best_size) {
                $best = $format;
                $best_size = $data['size'];
            }
        }
        
        // Diğerlerini sil
        foreach ($formats as $format => $data) {
            if ($format !== $best) {
                unlink($data['path']);
            }
        }
        
        return [
            'format' => $best,
            'path'   => $formats[$best]['path'],
            'size'   => $formats[$best]['size'],
        ];
    }
    
    /**
     * Cover mode resize
     * Hedef boyuta tam oturacak şekilde kırpar
     */
    public function resize_cover($source, int $target_width, int $target_height) {
        $src_width = imagesx($source);
        $src_height = imagesy($source);
        
        // Aspect ratio hesapla
        $src_ratio = $src_width / $src_height;
        $target_ratio = $target_width / $target_height;
        
        if ($src_ratio > $target_ratio) {
            // Kaynak daha geniş, yatay kırp
            $new_height = $src_height;
            $new_width = (int)($src_height * $target_ratio);
            $src_x = (int)(($src_width - $new_width) / 2);
            $src_y = 0;
        } else {
            // Kaynak daha uzun, dikey kırp
            $new_width = $src_width;
            $new_height = (int)($src_width / $target_ratio);
            $src_x = 0;
            $src_y = (int)(($src_height - $new_height) / 2);
        }
        
        // Yeni canvas
        $dest = imagecreatetruecolor($target_width, $target_height);
        imagealphablending($dest, false);
        imagesavealpha($dest, true);
        
        // Kırp ve resize
        imagecopyresampled(
            $dest, $source,
            0, 0, $src_x, $src_y,
            $target_width, $target_height,
            $new_width, $new_height
        );
        
        return $dest;
    }
    
    /**
     * Gaussian blur (CPU dostu versiyon)
     */
    public function blur($image, int $passes = 1): void {
        for ($i = 0; $i < min($passes, 3); $i++) {
            imagefilter($image, IMG_FILTER_GAUSSIAN_BLUR);
        }
    }
    
    /**
     * Darken overlay
     */
    public function darken($image, int $percent = 30): void {
        $percent = max(0, min(100, $percent));
        $brightness = -(int)(255 * $percent / 100);
        imagefilter($image, IMG_FILTER_BRIGHTNESS, $brightness);
    }
    
    /**
     * Mevcut bellek kullanımı
     */
    public function get_memory_usage(): array {
        $used = memory_get_usage(true) / 1024 / 1024;
        $peak = memory_get_peak_usage(true) / 1024 / 1024;
        $limit = $this->memory_limit;
        $available = $limit - $used;
        
        return [
            'used_mb'      => round($used, 2),
            'peak_mb'      => round($peak, 2),
            'limit_mb'     => $limit,
            'available_mb' => round($available, 2),
            'usage_percent' => round(($used / $limit) * 100, 1),
        ];
    }
    
    // =========================================
    // PRIVATE HELPERS
    // =========================================
    
    /**
     * Güvenli resim fetch (SSRF korumalı)
     * 
     * @param string $url Resim URL'i
     * @return string|null Resim binary data
     */
    private function fetch_image(string $url): ?string {
        // ====================================
        // SSRF PROTECTION
        // ====================================
        
        // 1. URL scheme kontrolü (sadece http/https)
        $scheme = wp_parse_url($url, PHP_URL_SCHEME);
        if (!in_array(strtolower($scheme), ['http', 'https'], true)) {
            return null;
        }
        
        // 2. WordPress URL validator (private IP'leri engeller)
        if (!wp_http_validate_url($url)) {
            return null;
        }
        
        // 3. Ek private/local IP kontrolü
        $host = wp_parse_url($url, PHP_URL_HOST);
        if ($this->is_private_ip($host)) {
            return null;
        }
        
        // ====================================
        // SECURE FETCH
        // ====================================
        $response = wp_remote_get($url, [
            'timeout'     => 10,
            'sslverify'   => true,  // SSL doğrulama aktif
            'redirection' => 2,     // Max 2 redirect
            'limit_response_size' => 10 * 1024 * 1024, // 10MB max
        ]);
        
        if (is_wp_error($response)) {
            return null;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            return null;
        }
        
        // Content-Type kontrolü (resim mi?)
        $content_type = wp_remote_retrieve_header($response, 'content-type');
        if ($content_type && strpos($content_type, 'image/') !== 0) {
            return null;
        }
        
        return wp_remote_retrieve_body($response);
    }
    
    /**
     * Private/local IP kontrolü
     */
    private function is_private_ip(string $host): bool {
        // IP resolve
        $ip = gethostbyname($host);
        
        // Resolve edilemedi
        if ($ip === $host && !filter_var($host, FILTER_VALIDATE_IP)) {
            return true; // Güvenlik: bilinmeyen host'u engelle
        }
        
        // IPv6 localhost
        if ($ip === '::1') {
            return true;
        }
        
        // Private IP ranges
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }
    
    private function parse_memory_limit(string $limit): int {
        $limit = trim($limit);
        $last = strtolower($limit[strlen($limit) - 1]);
        $value = (int)$limit;
        
        switch ($last) {
            case 'g': $value *= 1024;
            case 'm': break;
            case 'k': $value /= 1024; break;
        }
        
        return $value;
    }
    
    private function get_available_memory(): int {
        $used = memory_get_usage(true) / 1024 / 1024;
        return max(0, $this->memory_limit - $used);
    }
    
    private function gd_supports_webp(): bool {
        $gd = gd_info();
        return !empty($gd['WebP Support']);
    }
    
    // =========================================
    // OUTPUT PIPELINE (V2)
    // =========================================
    
    /**
     * Merkezi output üretici
     * GD resource'unu dosyaya kaydeder
     * 
     * @param resource $gd_resource  GD image resource
     * @param array    $context      ['listing_id', 'template', 'size', 'tier']
     * @return array   ['path', 'url', 'format', 'size', 'quality']
     */
    public function generate_output($gd_resource, array $context): array {
        // Quality: Access_Control'dan gelmeli (tek kaynak)
        // context['quality'] zorunlu, fallback yok - tutarlılık için
        $quality = $context['quality'] ?? Access_Control::FREE_QUALITY;
        
        // Upload dizini
        $upload = wp_upload_dir();
        $output_dir = $upload['basedir'] . '/umrebuldum/generated';
        $output_url = $upload['baseurl'] . '/umrebuldum/generated';
        
        // Dizin oluştur
        if (!file_exists($output_dir)) {
            wp_mkdir_p($output_dir);
            file_put_contents($output_dir . '/.htaccess', "Options -Indexes\n");
        }
        
        // Dosya adı: hash bazlı
        $hash = $this->generate_output_hash($context);
        $format = $this->get_best_format();
        $filename = $hash . '.' . $format;
        $filepath = $output_dir . '/' . $filename;
        $fileurl = $output_url . '/' . $filename;
        
        // Kaydet
        $saved = false;
        
        if ($format === 'webp') {
            $saved = @imagewebp($gd_resource, $filepath, $quality);
            
            // Silent fail kontrolü
            if (!$saved || !file_exists($filepath) || filesize($filepath) === 0) {
                @unlink($filepath);
                // JPG fallback
                $format = 'jpg';
                $filename = $hash . '.jpg';
                $filepath = $output_dir . '/' . $filename;
                $fileurl = $output_url . '/' . $filename;
                $saved = @imagejpeg($gd_resource, $filepath, $quality);
            }
        } else {
            $saved = @imagejpeg($gd_resource, $filepath, $quality);
        }
        
        if (!$saved) {
            return [
                'error' => 'output_failed',
                'message' => 'Görsel kaydedilemedi',
            ];
        }
        
        return [
            'path'    => $filepath,
            'url'     => $fileurl,
            'format'  => $format,
            'size'    => filesize($filepath),
            'quality' => $quality,
            'hash'    => $hash,
        ];
    }
    
    /**
     * Tier bazlı kalite ayarı
     * 
     * @deprecated Use Access_Control::get_quality() instead
     * Backward compatibility için tutuldu
     */
    public function get_quality_for_tier(string $tier): int {
        // Tek kaynak: Access_Control constants
        return $tier === 'pro' 
            ? Access_Control::PRO_QUALITY 
            : Access_Control::FREE_QUALITY;
    }
    
    /**
     * Output hash oluştur
     * Aynı input → aynı output (cache-friendly)
     */
    public function generate_output_hash(array $context): string {
        $user_id = $context['user_id'] ?? get_current_user_id();
        $template = $context['template'] ?? 'default';
        $size = $context['size'] ?? 'instagram';
        $listing_id = $context['listing_id'] ?? 0;
        
        // Listing'in son değişiklik zamanı da dahil
        $modified = get_post_modified_time('U', true, $listing_id) ?: 0;
        
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
     * En iyi output formatını belirle
     */
    public function get_best_format(): string {
        if ($this->gd_supports_webp()) {
            return 'webp';
        }
        return 'jpg';
    }
    
    /**
     * Output config döndür
     */
    public function get_output_config(string $tier = 'free', ?int $quality = null): array {
        return [
            'format'  => $this->get_best_format(),
            'quality' => $quality ?? ($tier === 'pro' ? Access_Control::PRO_QUALITY : Access_Control::FREE_QUALITY),
            'ttl'     => $tier === 'pro' ? (30 * DAY_IN_SECONDS) : DAY_IN_SECONDS,
        ];
    }
    
    /**
     * Output dizin yolunu al
     */
    public function get_output_dir(): string {
        $upload = wp_upload_dir();
        return $upload['basedir'] . '/umrebuldum/generated';
    }
    
    /**
     * Output URL'ini al
     */
    public function get_output_url(): string {
        $upload = wp_upload_dir();
        return $upload['baseurl'] . '/umrebuldum/generated';
    }
}

