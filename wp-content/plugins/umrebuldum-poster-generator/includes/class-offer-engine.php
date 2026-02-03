<?php
/**
 * Offer Engine - Dynamic Pricing & Smart Offers
 * 
 * Birden fazla paket yönetimi ve akıllı teklif mantığı.
 * Mevcut Upgrade Funnel'ı extend eder.
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Offer_Engine {
    
    /**
     * Options key
     */
    const OPTION_KEY = 'upg_pricing_plans';
    
    /**
     * User meta: Modal görüntüleme sayısı
     */
    const META_VIEW_COUNT = '_upg_modal_views';
    const META_LAST_VIEW = '_upg_modal_last_view';
    
    /**
     * Plan tipleri
     */
    const PLAN_MONTHLY = 'pro_monthly';
    const PLAN_YEARLY  = 'pro_yearly';
    const PLAN_AGENCY  = 'agency';
    
    private $user_id;
    
    public function __construct() {
        $this->user_id = get_current_user_id();
        
        // Varsayılan planları yükle
        $this->maybe_init_default_plans();
        
        // View count tracking
        add_action('wp_ajax_upg_track_modal_view', [$this, 'track_modal_view']);
        add_action('wp_ajax_nopriv_upg_track_modal_view', [$this, 'track_modal_view']);
    }
    
    // =========================================
    // PLAN YÖNETİMİ
    // =========================================
    
    /**
     * Tüm planları getir
     */
    public function get_plans(): array {
        $plans = get_option(self::OPTION_KEY, []);
        
        if (empty($plans)) {
            return $this->get_default_plans();
        }
        
        return $plans;
    }
    
    /**
     * Kullanıcıya gösterilecek planları getir
     */
    public function get_visible_plans(): array {
        $plans = $this->get_plans();
        $visible = [];
        
        foreach ($plans as $key => $plan) {
            // Aktif değilse atla
            if (empty($plan['active'])) continue;
            
            // Rol kontrolü
            if (!empty($plan['required_role'])) {
                if (!current_user_can($plan['required_role'])) {
                    continue;
                }
            }
            
            $visible[$key] = $plan;
        }
        
        return $visible;
    }
    
    /**
     * Tek plan getir
     */
    public function get_plan(string $plan_key): ?array {
        $plans = $this->get_plans();
        return $plans[$plan_key] ?? null;
    }
    
    /**
     * Önerilen planı getir (smart logic)
     */
    public function get_recommended_plan(): string {
        $view_count = $this->get_modal_view_count();
        
        // 1. görüntüleme: Yıllık plan (en iyi değer)
        if ($view_count <= 1) {
            return self::PLAN_YEARLY;
        }
        
        // 2-3. görüntüleme: Aylık plan (düşük bariyer)
        if ($view_count <= 3) {
            return self::PLAN_MONTHLY;
        }
        
        // 4+: Yine yıllık ama "son teklif" ile
        return self::PLAN_YEARLY;
    }
    
    /**
     * Plan için badge getir (smart logic)
     */
    public function get_plan_badge(string $plan_key): ?string {
        $plan = $this->get_plan($plan_key);
        $view_count = $this->get_modal_view_count();
        
        // Varsayılan badge
        $badge = $plan['badge'] ?? null;
        
        // Smart badge override
        if ($view_count >= 4 && $plan_key === self::PLAN_YEARLY) {
            return '🔥 Son Teklif!';
        }
        
        if ($plan_key === $this->get_recommended_plan()) {
            $badge = $badge ?: '⭐ Önerilen';
        }
        
        return $badge;
    }
    
    // =========================================
    // CHECKOUT URL
    // =========================================
    
    /**
     * Plan için checkout URL oluştur
     */
    public function get_checkout_url(string $plan_key): string {
        $plan = $this->get_plan($plan_key);
        
        if (!$plan || empty($plan['product_id'])) {
            // Fallback: Upgrade Funnel URL
            $funnel = new Upgrade_Funnel();
            return $funnel->get_checkout_url();
        }
        
        $product_id = $plan['product_id'];
        
        // WooCommerce checkout
        if (function_exists('wc_get_checkout_url')) {
            $checkout_url = wc_get_checkout_url();
        } else {
            $checkout_url = home_url('/checkout/');
        }
        
        return add_query_arg([
            'add-to-cart' => $product_id,
            'plan'        => $plan_key,
        ], $checkout_url);
    }
    
    /**
     * Login sonrası checkout URL
     */
    public function get_login_then_checkout_url(string $plan_key): string {
        return wp_login_url($this->get_checkout_url($plan_key));
    }
    
    // =========================================
    // MODAL VIEW TRACKING
    // =========================================
    
    /**
     * Modal görüntüleme sayısını getir
     */
    public function get_modal_view_count(): int {
        if (!$this->user_id) {
            // Anonim: Session/cookie bazlı (basit çözüm)
            return isset($_COOKIE['upg_modal_views']) ? (int) $_COOKIE['upg_modal_views'] : 0;
        }
        
        return (int) get_user_meta($this->user_id, self::META_VIEW_COUNT, true);
    }
    
    /**
     * Modal görüntüleme kaydet (AJAX handler)
     */
    public function track_modal_view(): void {
        // Nonce kontrolü
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'upg_funnel_nonce')) {
            wp_send_json_error('Invalid nonce');
        }
        
        $new_count = $this->increment_view_count();
        
        wp_send_json_success([
            'view_count' => $new_count,
            'recommended' => $this->get_recommended_plan(),
        ]);
    }
    
    /**
     * View count artır
     */
    public function increment_view_count(): int {
        if ($this->user_id) {
            $count = $this->get_modal_view_count() + 1;
            update_user_meta($this->user_id, self::META_VIEW_COUNT, $count);
            update_user_meta($this->user_id, self::META_LAST_VIEW, time());
            return $count;
        }
        
        // Anonim kullanıcı: Cookie
        $count = $this->get_modal_view_count() + 1;
        setcookie('upg_modal_views', $count, time() + (30 * DAY_IN_SECONDS), '/');
        
        return $count;
    }
    
    // =========================================
    // VARSAYILAN PLANLAR
    // =========================================
    
    /**
     * Varsayılan plan yapısı
     */
    public function get_default_plans(): array {
        return [
            self::PLAN_MONTHLY => [
                'active'      => true,
                'product_id'  => get_option('upg_pro_product_id', 0),
                'title'       => 'Pro Aylık',
                'subtitle'    => 'Hemen başla',
                'price'       => 99,
                'price_text'  => '99 ₺/ay',
                'period'      => 'monthly',
                'badge'       => null,
                'highlight'   => false,
                'features'    => [
                    '✓ Sınırsız afiş üretimi',
                    '✓ Tüm premium şablonlar',
                    '✓ Watermark\'sız',
                    '✓ Yüksek kalite (HD)',
                ],
                'order'       => 1,
            ],
            
            self::PLAN_YEARLY => [
                'active'      => true,
                'product_id'  => get_option('upg_pro_yearly_product_id', 0),
                'title'       => 'Pro Yıllık',
                'subtitle'    => '%25 tasarruf et',
                'price'       => 890,
                'price_text'  => '890 ₺/yıl',
                'price_monthly' => '~74 ₺/ay',
                'period'      => 'yearly',
                'badge'       => '💰 En Popüler',
                'highlight'   => true,
                'savings'     => '298 ₺ tasarruf',
                'features'    => [
                    '✓ Sınırsız afiş üretimi',
                    '✓ Tüm premium şablonlar',
                    '✓ Watermark\'sız',
                    '✓ Yüksek kalite (HD)',
                    '✓ Öncelikli destek',
                    '✓ Erken erişim özellikleri',
                ],
                'order'       => 2,
            ],
            
            self::PLAN_AGENCY => [
                'active'        => true,
                'product_id'    => get_option('upg_agency_product_id', 0),
                'title'         => 'Agency',
                'subtitle'      => 'Takım için',
                'price'         => 2490,
                'price_text'    => '2.490 ₺/yıl',
                'price_monthly' => '~207 ₺/ay',
                'period'        => 'yearly',
                'badge'         => '🏢 Kurumsal',
                'highlight'     => false,
                'required_role' => 'manage_options', // Sadece admin görür
                'features'      => [
                    '✓ 5 kullanıcı dahil',
                    '✓ Sınırsız afiş (toplam)',
                    '✓ Tüm Pro özellikleri',
                    '✓ Beyaz etiket (logo)',
                    '✓ API erişimi',
                    '✓ Öncelikli destek',
                ],
                'order'         => 3,
            ],
        ];
    }
    
    /**
     * Varsayılan planları oluştur (ilk kurulum)
     */
    private function maybe_init_default_plans(): void {
        $existing = get_option(self::OPTION_KEY);
        
        if ($existing === false) {
            update_option(self::OPTION_KEY, $this->get_default_plans());
        }
    }
    
    // =========================================
    // ADMIN HELPERS
    // =========================================
    
    /**
     * Planları güncelle (admin için)
     */
    public function update_plans(array $plans): bool {
        return update_option(self::OPTION_KEY, $plans);
    }
    
    /**
     * Tek planı güncelle
     */
    public function update_plan(string $plan_key, array $data): bool {
        $plans = $this->get_plans();
        $plans[$plan_key] = array_merge($plans[$plan_key] ?? [], $data);
        return $this->update_plans($plans);
    }
    
    /**
     * Plan sil
     */
    public function delete_plan(string $plan_key): bool {
        $plans = $this->get_plans();
        unset($plans[$plan_key]);
        return $this->update_plans($plans);
    }
    
    // =========================================
    // JS DATA
    // =========================================
    
    /**
     * Frontend için plan datası
     */
    public function get_js_data(): array {
        $plans = $this->get_visible_plans();
        $js_plans = [];
        
        foreach ($plans as $key => $plan) {
            $js_plans[$key] = [
                'key'           => $key,
                'title'         => $plan['title'],
                'subtitle'      => $plan['subtitle'] ?? '',
                'price_text'    => $plan['price_text'],
                'price_monthly' => $plan['price_monthly'] ?? null,
                'badge'         => $this->get_plan_badge($key),
                'highlight'     => $plan['highlight'] ?? false,
                'savings'       => $plan['savings'] ?? null,
                'features'      => $plan['features'] ?? [],
                'checkout_url'  => $this->get_checkout_url($key),
                'order'         => $plan['order'] ?? 99,
            ];
        }
        
        // Sıralama
        uasort($js_plans, function($a, $b) {
            return ($a['order'] ?? 99) - ($b['order'] ?? 99);
        });
        
        return [
            'plans'       => $js_plans,
            'recommended' => $this->get_recommended_plan(),
            'view_count'  => $this->get_modal_view_count(),
            'nonce'       => wp_create_nonce('upg_funnel_nonce'),
        ];
    }
    
    // =========================================
    // STATIC HELPERS
    // =========================================
    
    /**
     * Plan sayısını getir
     */
    public static function count_active_plans(): int {
        $engine = new self();
        return count($engine->get_visible_plans());
    }
    
    /**
     * Çoklu plan modu aktif mi?
     */
    public static function has_multiple_plans(): bool {
        return self::count_active_plans() > 1;
    }
}
