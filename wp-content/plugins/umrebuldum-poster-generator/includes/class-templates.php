<?php
/**
 * Template Definitions
 * 
 * Şablon ve boyut tanımları
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Templates {
    
    /**
     * Poster boyutları
     */
    public static function get_sizes(): array {
        return [
            'instagram' => [
                'width'  => 1080,
                'height' => 1080,
                'label'  => 'Instagram (1080x1080)',
            ],
            'story' => [
                'width'  => 1080,
                'height' => 1920,
                'label'  => 'Story (1080x1920)',
            ],
            'facebook' => [
                'width'  => 1200,
                'height' => 630,
                'label'  => 'Facebook (1200x630)',
            ],
            'whatsapp' => [
                'width'  => 800,
                'height' => 800,
                'label'  => 'WhatsApp (800x800)',
            ],
            'twitter' => [
                'width'  => 1200,
                'height' => 675,
                'label'  => 'Twitter (1200x675)',
            ],
        ];
    }
    
    /**
     * Şablon renk paletleri
     */
    public static function get_templates(): array {
        return [
            'default' => [
                'label'  => 'Varsayılan (Koyu)',
                'bg'     => [26, 26, 46],      // #1a1a2e
                'accent' => [255, 193, 7],     // #ffc107
                'text'   => [255, 255, 255],   // #ffffff
            ],
            'modern' => [
                'label'  => 'Modern (Mavi)',
                'bg'     => [15, 15, 15],      // #0f0f0f
                'accent' => [0, 212, 255],     // #00d4ff
                'text'   => [255, 255, 255],
            ],
            'umre' => [
                'label'  => 'Umre Özel (Altın)',
                'bg'     => [30, 58, 95],      // #1e3a5f
                'accent' => [201, 162, 39],    // #c9a227
                'text'   => [255, 255, 255],
            ],
            'light' => [
                'label'  => 'Açık Tema',
                'bg'     => [245, 245, 245],   // #f5f5f5
                'accent' => [255, 87, 34],     // #ff5722
                'text'   => [33, 33, 33],      // #212121
            ],
            'green' => [
                'label'  => 'Yeşil (Doğa)',
                'bg'     => [27, 94, 32],      // #1b5e20
                'accent' => [255, 235, 59],    // #ffeb3b
                'text'   => [255, 255, 255],
            ],
        ];
    }
    
    /**
     * Tek şablon al
     */
    public static function get_template(string $name): array {
        $templates = self::get_templates();
        return $templates[$name] ?? $templates['default'];
    }
    
    /**
     * Tek boyut al
     */
    public static function get_size(string $name): array {
        $sizes = self::get_sizes();
        return $sizes[$name] ?? $sizes['instagram'];
    }
    
    /**
     * Dropdown için şablon listesi
     */
    public static function get_template_options(): array {
        $options = [];
        foreach (self::get_templates() as $key => $template) {
            $options[$key] = $template['label'];
        }
        return $options;
    }
    
    /**
     * Dropdown için boyut listesi
     */
    public static function get_size_options(): array {
        $options = [];
        foreach (self::get_sizes() as $key => $size) {
            $options[$key] = $size['label'];
        }
        return $options;
    }
}
