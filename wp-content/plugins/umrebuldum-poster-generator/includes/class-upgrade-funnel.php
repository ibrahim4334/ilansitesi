<?php
/**
 * Upgrade Funnel - Free → Pro Conversion
 * 
 * Access Control'dan gelen hata kodlarını yakalayarak
 * doğru noktada upgrade modal'ını tetikler.
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Upgrade_Funnel {
    
    /**
     * Tetikleyici hata kodları
     */
    const TRIGGER_CODES = [
        'quota_exceeded',       // 2 afiş limiti aşıldı
        'template_restricted',  // Kilitli template
        'watermark_request',    // Watermark kaldırma isteği
        'login_required',       // Giriş gerekli
    ];
    
    /**
     * Modal gösterilecek sayfalar
     */
    const SHOW_ON_PAGES = [
        'admin',    // WP Admin
        'frontend', // Site frontend (ileride)
    ];
    
    private $access;
    
    public function __construct() {
        $this->access = new Access_Control();
        
        // Admin hooks
        if (is_admin()) {
            add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
            add_action('admin_footer', [$this, 'render_modal']);
        }
        
        // Frontend hooks (ileride PWA için)
        // add_action('wp_enqueue_scripts', [$this, 'enqueue_frontend_assets']);
        // add_action('wp_footer', [$this, 'render_modal']);
        
        // REST API filter - upgrade_required ekleme
        add_filter('upg_api_response', [$this, 'add_upgrade_flag'], 10, 2);
    }
    
    // =========================================
    // ASSET YÜKLEME
    // =========================================
    
    /**
     * Admin JS/CSS yükle
     */
    public function enqueue_admin_assets($hook): void {
        // Sadece ilgili sayfalarda
        if (strpos($hook, 'umrebuldum') === false && strpos($hook, 'hp_listing') === false) {
            return;
        }
        
        // Pro kullanıcılara gösterme
        if ($this->access->is_pro()) {
            return;
        }
        
        // CSS
        wp_enqueue_style(
            'upg-upgrade-modal',
            UPG_URL . 'assets/css/upgrade-modal.css',
            [],
            UPG_VERSION
        );
        
        // JavaScript
        wp_enqueue_script(
            'upg-upgrade-modal',
            UPG_URL . 'assets/js/upgrade-modal.js',
            [],
            UPG_VERSION,
            true
        );
        
        // JS'e veri gönder
        wp_localize_script('upg-upgrade-modal', 'upgFunnel', [
            'tier'        => $this->access->get_tier(),
            'remaining'   => $this->access->get_remaining_quota(),
            'checkoutUrl' => $this->get_checkout_url(),
            'loginUrl'    => wp_login_url($this->get_checkout_url()),
            'isLoggedIn'  => is_user_logged_in(),
            'triggers'    => self::TRIGGER_CODES,
            'i18n'        => $this->get_translations(),
        ]);
        
        // Offer Engine datası (çoklu plan için)
        if (class_exists(__NAMESPACE__ . '\\Offer_Engine')) {
            $offer_engine = new Offer_Engine();
            wp_localize_script('upg-upgrade-modal', 'upgOfferEngine', $offer_engine->get_js_data());
        }
        
        // Usage Tracker datası (friction & value signals için)
        if (class_exists(__NAMESPACE__ . '\\Usage_Tracker')) {
            $usage_tracker = new Usage_Tracker();
            wp_localize_script('upg-upgrade-modal', 'upgUsage', $usage_tracker->get_js_data());
        }
    }
    
    // =========================================
    // MODAL RENDER
    // =========================================
    
    /**
     * Modal HTML'ini footer'a ekle
     */
    public function render_modal(): void {
        // Pro kullanıcılara gösterme
        if ($this->access->is_pro()) {
            return;
        }
        
        include UPG_PATH . 'admin/views/upgrade-modal.php';
    }
    
    // =========================================
    // CHECKOUT URL
    // =========================================
    
    /**
     * WooCommerce checkout URL oluştur
     */
    public function get_checkout_url(): string {
        $product_id = get_option('upg_pro_product_id', 0);
        
        if (!$product_id) {
            // Fallback: Özel upgrade sayfası
            return $this->access->get_upgrade_url();
        }
        
        // WooCommerce checkout URL
        $checkout_url = wc_get_checkout_url();
        
        if (!$checkout_url) {
            return home_url('/checkout/');
        }
        
        // add-to-cart parametresi ile
        return add_query_arg([
            'add-to-cart' => $product_id,
        ], $checkout_url);
    }
    
    /**
     * Login sonrası checkout'a yönlendir
     */
    public function get_login_then_checkout_url(): string {
        return wp_login_url($this->get_checkout_url());
    }
    
    // =========================================
    // API RESPONSE GÜNCELLEME
    // =========================================
    
    /**
     * REST API response'a upgrade_required ekle
     */
    public function add_upgrade_flag(array $response, string $error_code = ''): array {
        // Trigger kodlarından biri mi?
        if (in_array($error_code, self::TRIGGER_CODES)) {
            $response['upgrade_required'] = true;
            $response['upgrade_data'] = [
                'checkout_url' => $this->get_checkout_url(),
                'login_url'    => $this->get_login_then_checkout_url(),
                'tier'         => $this->access->get_tier(),
                'remaining'    => $this->access->get_remaining_quota(),
            ];
        }
        
        return $response;
    }
    
    // =========================================
    // TETİKLEYİCİ KONTROLLER
    // =========================================
    
    /**
     * Quota aşıldı mı?
     */
    public function should_trigger_quota(): bool {
        if ($this->access->is_pro()) {
            return false;
        }
        
        return $this->access->get_remaining_quota() <= 0;
    }
    
    /**
     * Template kilitli mi?
     */
    public function should_trigger_template(string $template): bool {
        if ($this->access->is_pro()) {
            return false;
        }
        
        return !$this->access->can_use_template($template);
    }
    
    /**
     * Watermark kaldırma isteği
     */
    public function should_trigger_watermark(): bool {
        return !$this->access->is_pro();
    }
    
    // =========================================
    // YARDIMCILAR
    // =========================================
    
    /**
     * Çeviri metinleri
     */
    private function get_translations(): array {
        return [
            'title_quota'     => 'Afiş Limitinize Ulaştınız! 🎨',
            'title_template'  => 'Pro Template! ✨',
            'title_watermark' => 'Watermark\'ı Kaldırın! 🚀',
            'title_login'     => 'Giriş Yapın',
            
            'desc_quota'      => 'Ücretsiz hesabınızda 2 afiş hakkınızı kullandınız. Pro\'ya yükselterek sınırsız afiş üretin!',
            'desc_template'   => 'Bu şablon Pro üyelere özel. Tüm şablonlara erişim için Pro\'ya yükseltin!',
            'desc_watermark'  => 'Pro üyeler watermark\'sız, yüksek kaliteli afişler üretebilir.',
            'desc_login'      => 'Afiş üretmek için lütfen giriş yapın.',
            
            'btn_upgrade'     => 'Pro\'ya Yükselt',
            'btn_login'       => 'Giriş Yap',
            'btn_close'       => 'Daha sonra',
            
            'features' => [
                '✓ Sınırsız afiş üretimi',
                '✓ Tüm premium şablonlar',
                '✓ Watermark\'sız afişler',
                '✓ Yüksek kaliteli dışa aktarım',
                '✓ Öncelikli destek',
            ],
            
            'badge_free'      => 'FREE',
            'badge_pro'       => 'PRO',
        ];
    }
    
    /**
     * Pro özellikleri (modal için)
     */
    public function get_pro_features(): array {
        return [
            [
                'icon'  => '♾️',
                'title' => 'Sınırsız Afiş',
                'desc'  => 'İstediğiniz kadar afiş üretin',
            ],
            [
                'icon'  => '🎨',
                'title' => 'Premium Şablonlar',
                'desc'  => 'Tüm şablonlara erişim',
            ],
            [
                'icon'  => '✨',
                'title' => 'Watermark Yok',
                'desc'  => 'Profesyonel görünüm',
            ],
            [
                'icon'  => '📱',
                'title' => 'Yüksek Kalite',
                'desc'  => 'HD çözünürlük',
            ],
        ];
    }
    
    // =========================================
    // STATIC HELPERS
    // =========================================
    
    /**
     * Error code'dan modal tipini belirle
     */
    public static function get_modal_type(string $error_code): string {
        $map = [
            'quota_exceeded'      => 'quota',
            'template_restricted' => 'template',
            'watermark_request'   => 'watermark',
            'login_required'      => 'login',
        ];
        
        return $map[$error_code] ?? 'generic';
    }
}
