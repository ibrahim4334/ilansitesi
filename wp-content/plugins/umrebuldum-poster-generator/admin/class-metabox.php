<?php
/**
 * Metabox
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Metabox {
    
    private $generator;
    
    public function __construct(Generator_Interface $generator) {
        $this->generator = $generator;
        
        add_action('add_meta_boxes', [$this, 'add_metabox']);
    }
    
    /**
     * Metabox ekle
     */
    public function add_metabox(): void {
        add_meta_box(
            'upg_poster',
            '🖼️ İlan Afişi',
            [$this, 'render'],
            'hp_listing',
            'side',
            'default'
        );
    }
    
    /**
     * Metabox render
     */
    public function render(\WP_Post $post): void {
        include UPG_PATH . 'admin/views/metabox-view.php';
    }
}
