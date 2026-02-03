<?php
/**
 * API Generator - Python Servis Entegrasyonu (Phase 3)
 * 
 * VPS'e geçildiğinde bu sınıf aktifleştirilecek.
 * Şu an stub olarak tutuluyor.
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class API_Generator implements Generator_Interface {
    
    private $api_url;
    private $api_key;
    
    public function __construct() {
        $this->api_url = get_option('upg_api_url', 'http://localhost:8001');
        $this->api_key = defined('POSTER_SERVICE_KEY') ? POSTER_SERVICE_KEY : '';
    }
    
    /**
     * @inheritDoc
     */
    public function generate(int $listing_id, string $template = 'default', string $size = 'instagram') {
        // API'ye istek gönder
        $response = wp_remote_post($this->api_url . '/api/v1/generate', [
            'headers' => [
                'Content-Type'  => 'application/json',
                'Authorization' => 'Bearer ' . $this->api_key,
            ],
            'body' => json_encode([
                'listing' => $this->get_listing_data($listing_id),
                'template' => $template,
                'size' => $size,
            ]),
            'timeout' => 30,
        ]);
        
        if (is_wp_error($response)) {
            return $response;
        }
        
        $body = json_decode(wp_remote_retrieve_body($response), true);
        
        if (empty($body['success'])) {
            return new \WP_Error('api_error', $body['error'] ?? 'API hatası');
        }
        
        // Metadata kaydet
        update_post_meta($listing_id, '_poster_url', $body['poster_url']);
        update_post_meta($listing_id, '_poster_job_id', $body['job_id']);
        update_post_meta($listing_id, '_poster_generated', time());
        
        return [
            'success' => true,
            'url'     => $body['poster_url'],
            'job_id'  => $body['job_id'],
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
            'job_id'    => get_post_meta($listing_id, '_poster_job_id', true),
            'generated' => get_post_meta($listing_id, '_poster_generated', true),
        ];
    }
    
    /**
     * @inheritDoc
     */
    public function delete(int $listing_id): bool {
        // API'ye silme isteği gönder (opsiyonel)
        delete_post_meta($listing_id, '_poster_url');
        delete_post_meta($listing_id, '_poster_job_id');
        delete_post_meta($listing_id, '_poster_generated');
        
        return true;
    }
    
    /**
     * @inheritDoc
     */
    public function get_type(): string {
        return 'api';
    }
    
    /**
     * @inheritDoc
     */
    public function is_ready(): bool {
        // API'ye ping at
        $response = wp_remote_get($this->api_url . '/health', ['timeout' => 5]);
        
        if (is_wp_error($response)) {
            return false;
        }
        
        return wp_remote_retrieve_response_code($response) === 200;
    }
    
    /**
     * Listing verilerini al (API formatında)
     */
    private function get_listing_data(int $listing_id): array {
        $post = get_post($listing_id);
        
        return [
            'listing_id'  => $listing_id,
            'title'       => $post->post_title,
            'description' => wp_strip_all_tags($post->post_content),
            'price'       => get_post_meta($listing_id, 'hp_price', true),
            'location'    => get_post_meta($listing_id, 'hp_location', true),
            'image_url'   => get_the_post_thumbnail_url($listing_id, 'large'),
        ];
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
            'created_at'  => (int) $generated,
            'from_cache'  => false, // API generator her zaman yeni üretir
            'format'      => 'webp',
        ];
    }
    
    /**
     * @inheritDoc
     */
    public function get_cache_info(int $listing_id, string $template, string $size): ?array {
        // API generator cache kullanmıyor, her zaman yeni üretir
        return [
            'cached'  => false,
            'key'     => null,
            'message' => 'API generator does not use local cache',
        ];
    }
    
    /**
     * @inheritDoc
     */
    public function get_output_config(): array {
        return [
            'format'  => 'webp',
            'quality' => 88 + rand(0, 7), // 88-95 arası
            'ttl'     => 0, // API generator TTL kullanmıyor
            'tier'    => 'api',
        ];
    }
}

