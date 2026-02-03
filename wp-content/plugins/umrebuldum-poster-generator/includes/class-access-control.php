<?php
/**
 * Access Control - Free/Pro Üyelik Yönetimi
 * 
 * Merkezi erişim kontrol sistemi.
 * WooCommerce Subscriptions / HivePress Memberships ile uyumlu.
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Access_Control {
    
    /**
     * Üyelik seviyeleri
     */
    const TIER_FREE = 'free';
    const TIER_PRO  = 'pro';
    
    /**
     * Free tier limitleri
     */
    const FREE_POSTER_LIMIT = 2;
    const FREE_QUALITY = 60;
    const FREE_WATERMARK = true;
    const FREE_TEMPLATES = ['default', 'light', 'umre']; // Sadece 3 template
    
    /**
     * Pro tier ayarları
     */
    const PRO_QUALITY = 85;
    const PRO_WATERMARK = false;
    
    /**
     * User meta key'leri
     */
    const META_POSTER_COUNT = '_upg_poster_count';
    const META_TIER_OVERRIDE = '_upg_tier_override'; // Manuel tier ataması için
    
    private $user_id;
    private $tier;
    
    public function __construct(int $user_id = null) {
        $this->user_id = $user_id ?? get_current_user_id();
        $this->tier = $this->determine_tier();
    }
    
    // =========================================
    // ANA KONTROL METODLARİ
    // =========================================
    
    /**
     * Kullanıcı afiş üretebilir mi?
     * 
     * @return array ['allowed' => bool, 'reason' => string|null]
     */
    public function can_generate(): array {
        // Giriş yapmamış
        if (!$this->user_id) {
            return [
                'allowed' => false,
                'reason'  => 'login_required',
                'message' => 'Afiş üretmek için giriş yapmalısınız.',
            ];
        }
        
        // Pro = sınırsız
        if ($this->is_pro()) {
            return ['allowed' => true, 'reason' => null];
        }
        
        // Free = limit kontrolü
        $count = $this->get_poster_count();
        $limit = self::FREE_POSTER_LIMIT;
        
        if ($count >= $limit) {
            return [
                'allowed' => false,
                'reason'  => 'quota_exceeded',
                'message' => "Ücretsiz hesabınızda {$limit} afiş limitine ulaştınız. Pro'ya yükseltin!",
                'count'   => $count,
                'limit'   => $limit,
                // [UPGRADE_POINT] Burada Pro satış sayfasına yönlendirme yapılabilir
                'upgrade_url' => $this->get_upgrade_url(),
            ];
        }
        
        return [
            'allowed'   => true,
            'reason'    => null,
            'remaining' => $limit - $count,
        ];
    }
    
    /**
     * Template kullanılabilir mi?
     */
    public function can_use_template(string $template): bool {
        if ($this->is_pro()) {
            return true;
        }
        
        return in_array($template, self::FREE_TEMPLATES);
    }
    
    /**
     * Kullanılabilir template listesi
     */
    public function get_allowed_templates(): array {
        if ($this->is_pro()) {
            return array_keys(Templates::get_templates());
        }
        
        return self::FREE_TEMPLATES;
    }
    
    /**
     * Resim kalitesi (WebP quality)
     */
    public function get_quality(): int {
        return $this->is_pro() ? self::PRO_QUALITY : self::FREE_QUALITY;
    }
    
    /**
     * Watermark gerekli mi?
     */
    public function requires_watermark(): bool {
        return $this->is_pro() ? self::PRO_WATERMARK : self::FREE_WATERMARK;
    }
    
    /**
     * Kalan afiş hakkı
     */
    public function get_remaining_quota(): int {
        if ($this->is_pro()) {
            return PHP_INT_MAX; // Sınırsız
        }
        
        $count = $this->get_poster_count();
        return max(0, self::FREE_POSTER_LIMIT - $count);
    }
    
    /**
     * Kullanıcının tier'ı
     */
    public function get_tier(): string {
        return $this->tier;
    }
    
    /**
     * Pro mu?
     */
    public function is_pro(): bool {
        return $this->tier === self::TIER_PRO;
    }
    
    /**
     * Free mi?
     */
    public function is_free(): bool {
        return $this->tier === self::TIER_FREE;
    }
    
    // =========================================
    // SAYAÇ İŞLEMLERİ
    // =========================================
    
    /**
     * Oluşturulan afiş sayısı
     */
    public function get_poster_count(): int {
        if (!$this->user_id) return 0;
        return (int) get_user_meta($this->user_id, self::META_POSTER_COUNT, true);
    }
    
    /**
     * Afiş sayacını artır
     */
    public function increment_poster_count(): int {
        if (!$this->user_id) return 0;
        
        $count = $this->get_poster_count() + 1;
        update_user_meta($this->user_id, self::META_POSTER_COUNT, $count);
        
        return $count;
    }
    
    /**
     * Sayacı sıfırla (admin için)
     */
    public function reset_poster_count(): void {
        if (!$this->user_id) return;
        delete_user_meta($this->user_id, self::META_POSTER_COUNT);
    }
    
    // =========================================
    // TIER BELİRLEME
    // =========================================
    
    /**
     * Kullanıcının tier'ını belirle
     * Öncelik sırası:
     * 1. Manuel override (admin tarafından atanmış)
     * 2. WooCommerce Subscriptions
     * 3. HivePress Memberships
     * 4. WordPress capability
     * 5. Default: free
     */
    private function determine_tier(): string {
        if (!$this->user_id) {
            return self::TIER_FREE;
        }
        
        // 1. Manuel override kontrolü
        $override = get_user_meta($this->user_id, self::META_TIER_OVERRIDE, true);
        if ($override === self::TIER_PRO) {
            return self::TIER_PRO;
        }
        
        // 2. WooCommerce Subscriptions kontrolü
        // [INTEGRATION_POINT] wcs_user_has_subscription() ile
        if ($this->check_woocommerce_subscription()) {
            return self::TIER_PRO;
        }
        
        // 3. HivePress Memberships kontrolü
        // [INTEGRATION_POINT] HivePress membership meta ile
        if ($this->check_hivepress_membership()) {
            return self::TIER_PRO;
        }
        
        // 4. WordPress capability kontrolü
        // Admin ve editörler otomatik Pro
        if (current_user_can('manage_options') || current_user_can('edit_others_posts')) {
            return self::TIER_PRO;
        }
        
        // 5. Özel capability
        if (current_user_can('upg_pro_access')) {
            return self::TIER_PRO;
        }
        
        return self::TIER_FREE;
    }
    
    /**
     * WooCommerce Subscriptions kontrolü
     * 
     * [INTEGRATION_POINT]
     * WooCommerce Subscriptions aktifse ve kullanıcının
     * belirli bir ürüne aboneliği varsa Pro döndür.
     */
    private function check_woocommerce_subscription(): bool {
        // WooCommerce Subscriptions yoksa false
        if (!function_exists('wcs_user_has_subscription')) {
            return false;
        }
        
        // Pro abonelik ürün ID'si (WooCommerce'den alınacak)
        $pro_product_id = get_option('upg_pro_product_id', 0);
        
        if (!$pro_product_id) {
            return false;
        }
        
        return wcs_user_has_subscription($this->user_id, $pro_product_id, 'active');
    }
    
    /**
     * HivePress Memberships kontrolü
     * 
     * [INTEGRATION_POINT]
     * HivePress Memberships eklentisi ile entegrasyon.
     */
    private function check_hivepress_membership(): bool {
        // HivePress yoksa false
        if (!class_exists('HivePress\Models\User')) {
            return false;
        }
        
        // HivePress Memberships aktif mi?
        if (!class_exists('HivePress\Components\Memberships')) {
            return false;
        }
        
        // Pro plan ID'si
        $pro_plan_id = get_option('upg_pro_plan_id', 0);
        
        if (!$pro_plan_id) {
            return false;
        }
        
        // Kullanıcının aktif planını kontrol et
        $user = \HivePress\Models\User::query()->get_by_id($this->user_id);
        if (!$user) {
            return false;
        }
        
        $membership_plan = get_user_meta($this->user_id, 'hp_membership_plan', true);
        
        return $membership_plan == $pro_plan_id;
    }
    
    // =========================================
    // YARDIMCI METODLAR
    // =========================================
    
    /**
     * Pro'ya yükseltme URL'i
     * 
     * [UPGRADE_POINT]
     * Bu URL Free kullanıcılara gösterilecek.
     */
    public function get_upgrade_url(): string {
        // WooCommerce ürün sayfası
        $product_id = get_option('upg_pro_product_id', 0);
        if ($product_id) {
            return get_permalink($product_id);
        }
        
        // Özel sayfa
        $page_id = get_option('upg_upgrade_page_id', 0);
        if ($page_id) {
            return get_permalink($page_id);
        }
        
        // Fallback
        return home_url('/pro/');
    }
    
    /**
     * Kullanıcı bilgilerini al (debug/admin için)
     */
    public function get_user_info(): array {
        return [
            'user_id'      => $this->user_id,
            'tier'         => $this->tier,
            'is_pro'       => $this->is_pro(),
            'poster_count' => $this->get_poster_count(),
            'remaining'    => $this->get_remaining_quota(),
            'quality'      => $this->get_quality(),
            'watermark'    => $this->requires_watermark(),
            'templates'    => $this->get_allowed_templates(),
        ];
    }
    
    // =========================================
    // STATIC HELPERS
    // =========================================
    
    /**
     * Hızlı kontrol: Kullanıcı Pro mu?
     */
    public static function is_user_pro(int $user_id = null): bool {
        $access = new self($user_id);
        return $access->is_pro();
    }
    
    /**
     * Hızlı kontrol: Afiş üretilebilir mi?
     */
    public static function check_access(int $user_id = null): array {
        $access = new self($user_id);
        return $access->can_generate();
    }
}
