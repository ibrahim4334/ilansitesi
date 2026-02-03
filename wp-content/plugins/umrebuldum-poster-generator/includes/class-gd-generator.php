<?php
/**
 * GD Generator - PHP/GD ile afiş üretimi
 * 
 * MVP için ana generator. Hostinger paylaşımlı hosting'de çalışır.
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class GD_Generator implements Generator_Interface {
    
    private $upload_dir;
    private $posters_dir;
    private $posters_url;
    private $cache;
    private $processor;
    private $rate_limiter;
    private $usage_tracker;
    
    public function __construct() {
        $upload = wp_upload_dir();
        $this->upload_dir = $upload['basedir'];
        $this->posters_dir = $upload['basedir'] . '/umrebuldum/generated';
        $this->posters_url = $upload['baseurl'] . '/umrebuldum/generated';
        
        // Tier'ı al
        $access = new Access_Control();
        $tier = $access->get_tier();
        
        // Cache (tier bazlı TTL), Image Processor, Rate Limiter, Usage Tracker
        $this->cache = new Cache($tier);
        $this->processor = new Image_Processor();
        $this->rate_limiter = new Rate_Limiter();
        $this->usage_tracker = new Usage_Tracker();
        
        // Output dizini oluştur
        if (!file_exists($this->posters_dir)) {
            wp_mkdir_p($this->posters_dir);
            file_put_contents($this->posters_dir . '/.htaccess', "Options -Indexes\n");
        }
    }
    
    /**
     * @inheritDoc
     * 
     * Access Control entegrasyonu:
     * - Free: 2 afiş limiti, düşük kalite, watermark zorunlu
     * - Pro: Sınırsız, yüksek kalite, watermark yok
     * 
     * Rate Limiter entegrasyonu:
     * - Free: Dakikada max 2 render
     * - Pro: Limit yok
     */
    public function generate(int $listing_id, string $template = 'default', string $size = 'instagram', bool $force = false) {
        // Render süresini ölç
        $render_start = microtime(true);
        
        // ====================================
        // ACCESS CONTROL CHECKPOINT
        // ====================================
        $access = new Access_Control();
        
        // ====================================
        // RATE LIMIT CHECKPOINT (Free: 2/dk)
        // ====================================
        if (!$access->is_pro()) {
            $rate_check = $this->rate_limiter->check('generate');
            if (!$rate_check['allowed']) {
                $this->usage_tracker->track_error(Usage_Tracker::ERROR_RATE_LIMITED, [
                    'listing_id' => $listing_id,
                    'reset'      => $rate_check['reset'],
                ]);
                return new \WP_Error(
                    'rate_limited',
                    'Çok sık istek gönderiyorsunuz. Lütfen bekleyin.',
                    ['remaining' => $rate_check['remaining'], 'reset' => $rate_check['reset']]
                );
            }
        }
        
        $can_generate = $access->can_generate();
        if (!$can_generate['allowed']) {
            $this->usage_tracker->track_error($can_generate['reason'], [
                'listing_id' => $listing_id,
            ]);
            return new \WP_Error(
                $can_generate['reason'],
                $can_generate['message'],
                ['upgrade_url' => $can_generate['upgrade_url'] ?? null]
            );
        }
        
        if (!$access->can_use_template($template)) {
            $this->usage_tracker->track_error(Usage_Tracker::ERROR_TEMPLATE_RESTRICTED, [
                'listing_id' => $listing_id,
                'template'   => $template,
            ]);
            return new \WP_Error(
                'template_restricted',
                "Bu template Pro üyelik gerektirir.",
                [
                    'allowed_templates' => $access->get_allowed_templates(),
                    'upgrade_url' => $access->get_upgrade_url(),
                ]
            );
        }
        
        // Cache kontrolü (force değilse)
        if (!$force) {
            $cache_key = $this->cache->get_key($listing_id, $template, $size);
            $cached = $this->cache->get($cache_key);
            
            if ($cached) {
                // Render süresini hesapla
                $render_time_ms = (int) ((microtime(true) - $render_start) * 1000);
                
                // Cache'den döndür, metadata güncelle
                update_post_meta($listing_id, '_poster_url', $cached['url']);
                update_post_meta($listing_id, '_poster_path', $cached['path']);
                update_post_meta($listing_id, '_poster_from_cache', true);
                update_post_meta($listing_id, '_poster_user_id', get_current_user_id());
                
                // Agency metadata kaydet (görünmez ama kritik)
                Agency_Helper::save_poster_agency_meta($listing_id);
                
                // Cache metadata kaydet
                $metadata = $this->cache->create_poster_metadata($listing_id, $template, true);
                $this->cache->save_metadata($cache_key, $metadata);
                
                // ====================================
                // USAGE TRACKING
                // ====================================
                $metrics = [
                    'listing_id'     => $listing_id,
                    'render_time_ms' => $render_time_ms,
                    'from_cache'     => true,
                    'output_size_kb' => round($cached['size'] / 1024, 2),
                    'tier'           => $access->get_tier(),
                    'template'       => $template,
                    'size'           => $size,
                ];
                $this->usage_tracker->track_render($metrics);
                
                // Pro value signals
                $value_signals = $this->usage_tracker->get_value_signal($metrics);
                
                return [
                    'success'       => true,
                    'url'           => $cached['url'],
                    'path'          => $cached['path'],
                    'cached'        => true,
                    'from_cache'    => true,
                    'format'        => $cached['type'],
                    'tier'          => $access->get_tier(),
                    'render_time_ms'=> $render_time_ms,
                    'cache_info'    => $this->cache->get_cache_info($cache_key),
                    'value_signals' => $value_signals,
                    'friction'      => $this->usage_tracker->get_friction_data(),
                ];
            }
        }
        
        $data = $this->get_listing_data($listing_id);
        
        if (!$data) {
            $this->usage_tracker->track_error(Usage_Tracker::ERROR_NO_LISTING, [
                'listing_id' => $listing_id,
            ]);
            return new \WP_Error('no_listing', 'İlan bulunamadı');
        }
        
        $memory = $this->processor->get_memory_usage();
        if ($memory['available_mb'] < 30) {
            $this->usage_tracker->track_error(Usage_Tracker::ERROR_LOW_MEMORY, [
                'listing_id'   => $listing_id,
                'available_mb' => $memory['available_mb'],
            ]);
            return new \WP_Error('low_memory', 'Yetersiz bellek: ' . $memory['available_mb'] . 'MB');
        }
        
        // Template ve size al
        $tpl = Templates::get_template($template);
        $dim = Templates::get_size($size);
        
        $width = $dim['width'];
        $height = $dim['height'];
        
        // Canvas oluştur
        $canvas = imagecreatetruecolor($width, $height);
        imageantialias($canvas, true);
        
        // Arka plan
        $bg_color = imagecolorallocate($canvas, $tpl['bg'][0], $tpl['bg'][1], $tpl['bg'][2]);
        imagefill($canvas, 0, 0, $bg_color);
        
        // Arka plan görseli (CPU-friendly processor ile)
        if ($data['image']) {
            $this->render_background_safe($canvas, $data['image'], $width, $height);
        }
        
        // Accent bars
        $accent_color = imagecolorallocate($canvas, $tpl['accent'][0], $tpl['accent'][1], $tpl['accent'][2]);
        imagefilledrectangle($canvas, 0, 0, $width, 8, $accent_color);
        imagefilledrectangle($canvas, 0, $height - 8, $width, $height, $accent_color);
        
        // Text color
        $text_color = imagecolorallocate($canvas, $tpl['text'][0], $tpl['text'][1], $tpl['text'][2]);
        
        // Font
        $font = $this->get_font_path();
        
        // Başlık
        $this->render_title($canvas, $data['title'], $font, $text_color, $width, $height);
        
        // Fiyat
        if ($data['price']) {
            $this->render_price($canvas, $data['price'], $font, $accent_color, $width, $height);
        }
        
        // Konum
        if ($data['location']) {
            $this->render_location($canvas, $data['location'], $font, $text_color, $width);
        }
        
        // ====================================
        // WATERMARK - TIER BAZLI
        // Free: Zorunlu watermark
        // Pro: Watermark yok
        // ====================================
        if ($access->requires_watermark()) {
            $this->render_watermark($canvas, $font, $width, $height);
        }
        
        // Geçici dosyaya kaydet
        $temp_path = $this->posters_dir . '/temp_' . uniqid() . '.png';
        imagepng($canvas, $temp_path, 9);
        imagedestroy($canvas);
        
        // ====================================
        // CACHE - TIER BAZLI KALİTE
        // Free: quality 60
        // Pro: quality 85
        // ====================================
        $cache_key = $this->cache->get_key($listing_id, $template, $size);
        $quality = $access->get_quality();
        $result = $this->cache->set($cache_key, $temp_path, $quality);
        
        if (!$result) {
            $this->usage_tracker->track_error(Usage_Tracker::ERROR_SAVE_FAILED, [
                'listing_id' => $listing_id,
                'cache_key'  => $cache_key,
            ]);
            return new \WP_Error('cache_error', 'Afiş kaydedilemedi');
        }
        
        // ====================================
        // QUOTA GÜNCELLE (sadece Free için önemli)
        // ====================================
        $access->increment_poster_count();
        
        // Metadata güncelle
        update_post_meta($listing_id, '_poster_url', $result['url']);
        update_post_meta($listing_id, '_poster_path', $result['path']);
        update_post_meta($listing_id, '_poster_template', $template);
        update_post_meta($listing_id, '_poster_size', $size);
        update_post_meta($listing_id, '_poster_generated', time());
        update_post_meta($listing_id, '_poster_format', $result['type']);
        update_post_meta($listing_id, '_poster_tier', $access->get_tier());
        update_post_meta($listing_id, '_poster_from_cache', false);
        update_post_meta($listing_id, '_poster_user_id', get_current_user_id());
        update_post_meta($listing_id, '_poster_quality', $quality);
        
        // Agency metadata kaydet (görünmez ama kritik)
        Agency_Helper::save_poster_agency_meta($listing_id);
        
        // Cache metadata kaydet
        $metadata = $this->cache->create_poster_metadata($listing_id, $template, false);
        $this->cache->save_metadata($cache_key, $metadata);
        
        // Render süresini hesapla
        $render_time_ms = (int) ((microtime(true) - $render_start) * 1000);
        
        // ====================================
        // USAGE TRACKING
        // ====================================
        $metrics = [
            'listing_id'     => $listing_id,
            'render_time_ms' => $render_time_ms,
            'from_cache'     => false,
            'output_size_kb' => round($result['size'] / 1024, 2),
            'tier'           => $access->get_tier(),
            'template'       => $template,
            'size'           => $size,
        ];
        $this->usage_tracker->track_render($metrics);
        
        // Agency tracking (eğer sub-user ise)
        $this->usage_tracker->track_agency_render($listing_id, $metrics);
        
        // Pro value signals
        $value_signals = $this->usage_tracker->get_value_signal($metrics);
        
        return [
            'success'        => true,
            'url'            => $result['url'],
            'path'           => $result['path'],
            'format'         => $result['type'],
            'size_kb'        => round($result['size'] / 1024, 1),
            'cached'         => false,
            'from_cache'     => false,
            'tier'           => $access->get_tier(),
            'quality'        => $quality,
            'render_time_ms' => $render_time_ms,
            'remaining'      => $access->get_remaining_quota(),
            'cache_info'     => $this->cache->get_cache_info($cache_key),
            'value_signals'  => $value_signals,
            'friction'       => $this->usage_tracker->get_friction_data(),
        ];
    }
    
    /**
     * @inheritDoc
     */
    public function get(int $listing_id): ?array {
        $url = get_post_meta($listing_id, '_poster_url', true);
        
        if (!$url) {
            return null;
        }
        
        return [
            'url'       => $url,
            'path'      => get_post_meta($listing_id, '_poster_path', true),
            'template'  => get_post_meta($listing_id, '_poster_template', true),
            'size'      => get_post_meta($listing_id, '_poster_size', true),
            'generated' => get_post_meta($listing_id, '_poster_generated', true),
        ];
    }
    
    /**
     * @inheritDoc
     */
    public function delete(int $listing_id): bool {
        $path = get_post_meta($listing_id, '_poster_path', true);
        
        if ($path && file_exists($path)) {
            unlink($path);
        }
        
        delete_post_meta($listing_id, '_poster_url');
        delete_post_meta($listing_id, '_poster_path');
        delete_post_meta($listing_id, '_poster_template');
        delete_post_meta($listing_id, '_poster_size');
        delete_post_meta($listing_id, '_poster_generated');
        
        return true;
    }
    
    /**
     * @inheritDoc
     */
    public function get_type(): string {
        return 'gd';
    }
    
    /**
     * @inheritDoc
     */
    public function is_ready(): bool {
        return extension_loaded('gd');
    }
    
    // =========================================
    // PRIVATE HELPERS
    // =========================================
    
    /**
     * Listing verilerini al
     */
    private function get_listing_data(int $listing_id): ?array {
        $post = get_post($listing_id);
        
        if (!$post) {
            return null;
        }
        
        // HivePress varsa özel metodlar kullan
        if (class_exists('HivePress\Models\Listing')) {
            return $this->get_hivepress_data($listing_id);
        }
        
        // Vanilla WordPress
        return [
            'title'    => $post->post_title,
            'price'    => get_post_meta($listing_id, '_price', true),
            'location' => get_post_meta($listing_id, '_location', true),
            'image'    => get_the_post_thumbnail_url($listing_id, 'large'),
        ];
    }
    
    /**
     * HivePress verilerini al
     */
    private function get_hivepress_data(int $listing_id): array {
        $listing = \HivePress\Models\Listing::query()->get_by_id($listing_id);
        
        $image_url = null;
        $images = $listing->get_images();
        if ($images && count($images) > 0) {
            $image = reset($images);
            $image_url = wp_get_attachment_url($image->get_id());
        }
        
        $price = get_post_meta($listing_id, 'hp_price', true);
        $price_formatted = $price ? number_format((float)$price, 0, ',', '.') . ' TL' : null;
        
        $location = get_post_meta($listing_id, 'hp_location', true);
        if (is_array($location) && isset($location['address'])) {
            $location = $location['address'];
        }
        
        return [
            'title'    => $listing->get_title(),
            'price'    => $price_formatted,
            'location' => $location,
            'image'    => $image_url,
        ];
    }
    
    /**
     * Font yolu
     * Mevcut Inter fontlarına uyumlu
     */
    private function get_font_path(): string {
        // Inter font öncelikleri (büyükten küçüğe - poster için ideal)
        $inter_fonts = [
            UPG_PATH . 'fonts/Inter_28pt-Bold.ttf',  // En büyük, posterler için ideal
            UPG_PATH . 'fonts/Inter_24pt-Bold.ttf',  // Alternatif
            UPG_PATH . 'fonts/Inter_18pt-Bold.ttf',  // Küçük poster için
            UPG_PATH . 'fonts/Inter-Bold.ttf',       // Eski format (backward compat)
        ];
        
        foreach ($inter_fonts as $font) {
            if (file_exists($font)) {
                return $font;
            }
        }
        
        // Sistem fontları (fallback)
        $system_fonts = [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
            'C:/Windows/Fonts/arialbd.ttf',  // Arial Bold
            'C:/Windows/Fonts/arial.ttf',
        ];
        
        foreach ($system_fonts as $font) {
            if (file_exists($font)) {
                return $font;
            }
        }
        
        return '';
    }
    
    /**
     * Arka plan görseli render (eski versiyon, fallback)
     */
    private function render_background(&$canvas, string $image_url, int $width, int $height): void {
        $image_data = @file_get_contents($image_url);
        if (!$image_data) return;
        
        $bg = @imagecreatefromstring($image_data);
        if (!$bg) return;
        
        $bg_w = imagesx($bg);
        $bg_h = imagesy($bg);
        
        // Cover mode
        $scale = max($width / $bg_w, $height / $bg_h);
        $new_w = (int)($bg_w * $scale);
        $new_h = (int)($bg_h * $scale);
        
        $src_x = (int)(($new_w - $width) / 2 / $scale);
        $src_y = (int)(($new_h - $height) / 2 / $scale);
        
        imagecopyresampled(
            $canvas, $bg, 0, 0, $src_x, $src_y,
            $width, $height, (int)($width / $scale), (int)($height / $scale)
        );
        
        imagedestroy($bg);
        
        // Gradient overlay
        for ($y = 0; $y < $height; $y++) {
            $alpha = (int)(100 * ($y / $height));
            $overlay = imagecolorallocatealpha($canvas, 0, 0, 0, 127 - (int)($alpha * 0.7));
            imageline($canvas, 0, $y, $width, $y, $overlay);
        }
    }
    
    /**
     * Arka plan görseli render (CPU-friendly, bellek optimizasyonlu)
     */
    private function render_background_safe(&$canvas, string $image_url, int $width, int $height): void {
        // Image Processor ile güvenli yükleme
        $loaded = $this->processor->load_safe($image_url);
        
        if (!$loaded) {
            // Error track (görsel yüklenemedi)
            $this->usage_tracker->track_error(Usage_Tracker::ERROR_FETCH_FAILED, [
                'image_url' => substr($image_url, 0, 100), // Truncate for privacy
            ]);
            // Fallback: eski yöntem
            $this->render_background($canvas, $image_url, $width, $height);
            return;
        }
        
        $bg = $loaded['image'];
        
        // Cover mode resize (processor ile)
        $resized = $this->processor->resize_cover($bg, $width, $height);
        imagedestroy($bg);
        
        // Canvas'a kopyala
        imagecopy($canvas, $resized, 0, 0, 0, 0, $width, $height);
        
        // Darken efekti (CPU-friendly)
        $this->processor->darken($canvas, 25);
        
        // Hafif blur (opsiyonel, CPU yükü için 1 pass)
        // $this->processor->blur($canvas, 1);
        
        imagedestroy($resized);
        
        // Gradient overlay (optimize edilmiş - sadece alt yarı)
        $start_y = (int)($height * 0.4);
        for ($y = $start_y; $y < $height; $y++) {
            $progress = ($y - $start_y) / ($height - $start_y);
            $alpha = (int)(127 - ($progress * 100));
            $overlay = imagecolorallocatealpha($canvas, 0, 0, 0, $alpha);
            imageline($canvas, 0, $y, $width, $y, $overlay);
        }
    }
    
    /**
     * Başlık render
     */
    private function render_title(&$canvas, string $title, string $font, $color, int $width, int $height): void {
        $size = min($width / 12, 72);
        $lines = $this->wrap_text($title, $font, $size, $width - 80);
        
        $y = $height - 200 - (count($lines) * ($size + 10));
        
        foreach ($lines as $line) {
            $bbox = imagettfbbox($size, 0, $font, $line);
            $x = ($width - ($bbox[2] - $bbox[0])) / 2;
            imagettftext($canvas, $size, 0, (int)$x, (int)$y, $color, $font, $line);
            $y += $size + 10;
        }
    }
    
    /**
     * Fiyat render
     */
    private function render_price(&$canvas, string $price, string $font, $color, int $width, int $height): void {
        $size = min($width / 10, 56);
        $bbox = imagettfbbox($size, 0, $font, $price);
        $x = ($width - ($bbox[2] - $bbox[0])) / 2;
        $y = $height - 80;
        
        imagettftext($canvas, $size, 0, (int)$x, (int)$y, $color, $font, $price);
    }
    
    /**
     * Konum render
     */
    private function render_location(&$canvas, string $location, string $font, $color, int $width): void {
        $text = "📍 " . $location;
        $size = min($width / 20, 28);
        $bbox = imagettfbbox($size, 0, $font, $text);
        $x = ($width - ($bbox[2] - $bbox[0])) / 2;
        
        imagettftext($canvas, $size, 0, (int)$x, 50, $color, $font, $text);
    }
    
    /**
     * Watermark render
     */
    private function render_watermark(&$canvas, string $font, int $width, int $height): void {
        $text = "umrebuldum.com";
        $size = 18;
        $color = imagecolorallocatealpha($canvas, 255, 255, 255, 80);
        
        $bbox = imagettfbbox($size, 0, $font, $text);
        $x = $width - ($bbox[2] - $bbox[0]) - 20;
        $y = $height - 25;
        
        imagettftext($canvas, $size, 0, (int)$x, (int)$y, $color, $font, $text);
    }
    
    /**
     * Text wrap
     */
    /**
     * Text wrap
     */
    private function wrap_text(string $text, string $font, int $size, int $max_width): array {
        $words = explode(' ', $text);
        $lines = [];
        $current = '';
        
        foreach ($words as $word) {
            $test = $current ? "$current $word" : $word;
            $bbox = imagettfbbox($size, 0, $font, $test);
            
            if (($bbox[2] - $bbox[0]) < $max_width) {
                $current = $test;
            } else {
                if ($current) $lines[] = $current;
                $current = $word;
            }
        }
        
        if ($current) $lines[] = $current;
        
        return $lines;
    }
    
    // =========================================
    // INTERFACE V2 METHODS
    // =========================================
    
    /**
     * @inheritDoc
     */
    public function get_metadata(int $listing_id): ?array {
        $generated = get_post_meta($listing_id, '_poster_generated', true);
        
        if (!$generated) {
            return null;
        }
        
        return [
            'user_id'     => get_post_meta($listing_id, '_poster_user_id', true) ?: 0,
            'plan'        => get_post_meta($listing_id, '_poster_tier', true) ?: 'free',
            'template_id' => get_post_meta($listing_id, '_poster_template', true) ?: 'default',
            'size'        => get_post_meta($listing_id, '_poster_size', true) ?: 'instagram',
            'created_at'  => (int) $generated,
            'from_cache'  => (bool) get_post_meta($listing_id, '_poster_from_cache', true),
            'format'      => get_post_meta($listing_id, '_poster_format', true) ?: 'webp',
        ];
    }
    
    /**
     * @inheritDoc
     */
    public function get_cache_info(int $listing_id, string $template, string $size): ?array {
        $access = new Access_Control();
        $tier = $access->get_tier();
        
        // Tier bazlı cache oluştur
        $cache = new Cache($tier);
        $key = $cache->get_key($listing_id, $template, $size);
        
        return $cache->get_cache_info($key);
    }
    
    /**
     * @inheritDoc
     */
    public function get_output_config(): array {
        $access = new Access_Control();
        $tier = $access->get_tier();
        
        return [
            'format'  => $this->processor->get_best_format(),
            'quality' => $this->processor->get_quality_for_tier($tier),
            'ttl'     => $tier === 'pro' ? (30 * DAY_IN_SECONDS) : DAY_IN_SECONDS,
            'tier'    => $tier,
        ];
    }
}

