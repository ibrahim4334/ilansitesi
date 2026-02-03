<?php
/**
 * Generator Interface - Abstraction Katmanı
 * 
 * Bu interface sayesinde Phase 3'te Python API'ye geçiş
 * tek bir sınıf değişikliğiyle yapılabilir.
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

interface Generator_Interface {
    
    /**
     * Afiş üret
     * 
     * @param int    $listing_id Listing ID
     * @param string $template   Template adı (default, modern, umre, light)
     * @param string $size       Boyut (instagram, story, facebook, whatsapp)
     * @return array|WP_Error    ['success' => bool, 'url' => string, 'path' => string]
     */
    public function generate(int $listing_id, string $template = 'default', string $size = 'instagram');
    
    /**
     * Mevcut afişi al
     * 
     * @param int $listing_id
     * @return array|null ['url' => string, 'path' => string, 'generated' => int]
     */
    public function get(int $listing_id): ?array;
    
    /**
     * Afişi sil
     * 
     * @param int $listing_id
     * @return bool
     */
    public function delete(int $listing_id): bool;
    
    /**
     * Generator tipi
     * 
     * @return string 'gd' veya 'api'
     */
    public function get_type(): string;
    
    /**
     * Generator hazır mı?
     * 
     * @return bool
     */
    public function is_ready(): bool;
    
    // =========================================
    // V2 METHODS - Output Pipeline
    // =========================================
    
    /**
     * Afiş metadata'sını al
     * 
     * @param int $listing_id
     * @return array|null ['user_id', 'plan', 'template_id', 'created_at', 'from_cache']
     */
    public function get_metadata(int $listing_id): ?array;
    
    /**
     * Cache bilgisini al
     * 
     * @param int    $listing_id
     * @param string $template
     * @param string $size
     * @return array|null ['cached' => bool, 'key' => string, 'expires' => int]
     */
    public function get_cache_info(int $listing_id, string $template, string $size): ?array;
    
    /**
     * Output config
     * Tier'a göre kalite, format vb. ayarları döndürür
     * 
     * @return array ['format' => 'webp', 'quality' => 85, 'ttl' => seconds]
     */
    public function get_output_config(): array;
}

