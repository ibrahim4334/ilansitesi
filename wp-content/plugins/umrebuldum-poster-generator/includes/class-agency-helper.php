<?php
/**
 * Agency Helper - Alt Kullanıcı Yönetimi Altyapısı
 * 
 * Agency plan için temel altyapı.
 * Şu an UI yok, sadece veri yapısı ve metodlar.
 * 
 * Amaç: Yarın pahalı Agency planı satabilmek
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Agency_Helper {
    
    /**
     * User meta keys
     */
    const META_OWNER_ID = '_upg_owner_user_id';           // Hesap sahibi (agency admin)
    const META_AGENCY_ID = '_upg_agency_id';               // Agency ID (group identifier)
    const META_SUB_USER_COUNT = '_upg_sub_user_count';     // Alt kullanıcı sayısı
    const META_SUB_USER_LIMIT = '_upg_sub_user_limit';     // Alt kullanıcı limiti
    const META_AGENCY_ROLE = '_upg_agency_role';           // agency_admin, agency_member
    const META_AGENCY_CREATED = '_upg_agency_created_at';  // Agency oluşturma tarihi
    
    /**
     * Post meta keys (poster metadata)
     */
    const POST_META_OWNER = '_poster_owner_user_id';        // Hesap sahibi
    const POST_META_GENERATED_BY = '_poster_generated_by';  // Oluşturan kullanıcı
    const POST_META_AGENCY = '_poster_agency_id';           // Agency ID
    
    /**
     * Agency plan tipleri ve limitleri
     */
    const AGENCY_PLANS = [
        'agency_starter' => [
            'name'           => 'Agency Starter',
            'sub_user_limit' => 3,
            'poster_limit'   => 500,  // Aylık
            'price_monthly'  => 499,  // TL
        ],
        'agency_pro' => [
            'name'           => 'Agency Pro',
            'sub_user_limit' => 10,
            'poster_limit'   => 2000, // Aylık
            'price_monthly'  => 999,  // TL
        ],
        'agency_enterprise' => [
            'name'           => 'Agency Enterprise',
            'sub_user_limit' => -1,   // Sınırsız
            'poster_limit'   => -1,   // Sınırsız
            'price_monthly'  => 2499, // TL
        ],
    ];
    
    // =========================================
    // AGENCY OLUŞTURMA
    // =========================================
    
    /**
     * Yeni bir agency oluştur
     * 
     * @param int $owner_id Agency sahibi user ID
     * @param string $plan_key Agency plan tipi
     * @return array|WP_Error
     */
    public static function create_agency(int $owner_id, string $plan_key = 'agency_starter') {
        if (!isset(self::AGENCY_PLANS[$plan_key])) {
            return new \WP_Error('invalid_plan', 'Geçersiz agency planı');
        }
        
        // Zaten agency admin mi?
        if (self::is_agency_admin($owner_id)) {
            return new \WP_Error('already_agency', 'Bu kullanıcı zaten bir agency sahibi');
        }
        
        $plan = self::AGENCY_PLANS[$plan_key];
        $agency_id = 'agency_' . $owner_id . '_' . time();
        
        // Owner meta güncelle
        update_user_meta($owner_id, self::META_OWNER_ID, $owner_id);
        update_user_meta($owner_id, self::META_AGENCY_ID, $agency_id);
        update_user_meta($owner_id, self::META_SUB_USER_COUNT, 0);
        update_user_meta($owner_id, self::META_SUB_USER_LIMIT, $plan['sub_user_limit']);
        update_user_meta($owner_id, self::META_AGENCY_ROLE, 'agency_admin');
        update_user_meta($owner_id, self::META_AGENCY_CREATED, time());
        
        // Pro tier'a yükselt
        update_user_meta($owner_id, '_upg_tier', 'agency');
        
        do_action('upg_agency_created', $agency_id, $owner_id, $plan_key);
        
        return [
            'success'    => true,
            'agency_id'  => $agency_id,
            'owner_id'   => $owner_id,
            'plan'       => $plan_key,
            'sub_user_limit' => $plan['sub_user_limit'],
        ];
    }
    
    // =========================================
    // ALT KULLANICI YÖNETİMİ
    // =========================================
    
    /**
     * Alt kullanıcı ekle
     * 
     * @param int $agency_owner_id Agency sahibi
     * @param int $sub_user_id Eklenecek kullanıcı
     * @return array|WP_Error
     */
    public static function add_sub_user(int $agency_owner_id, int $sub_user_id) {
        // Yetki kontrolü
        if (!self::is_agency_admin($agency_owner_id)) {
            return new \WP_Error('not_agency_admin', 'Agency yetkiniz yok');
        }
        
        // Limit kontrolü
        $current_count = (int) get_user_meta($agency_owner_id, self::META_SUB_USER_COUNT, true);
        $limit = (int) get_user_meta($agency_owner_id, self::META_SUB_USER_LIMIT, true);
        
        if ($limit !== -1 && $current_count >= $limit) {
            return new \WP_Error(
                'sub_user_limit',
                "Alt kullanıcı limitine ulaştınız ({$limit})",
                ['current' => $current_count, 'limit' => $limit]
            );
        }
        
        // Kullanıcı zaten başka bir agency'de mi?
        $existing_agency = get_user_meta($sub_user_id, self::META_AGENCY_ID, true);
        if ($existing_agency) {
            return new \WP_Error('already_in_agency', 'Bu kullanıcı zaten başka bir agency\'de');
        }
        
        $agency_id = get_user_meta($agency_owner_id, self::META_AGENCY_ID, true);
        
        // Alt kullanıcı meta güncelle
        update_user_meta($sub_user_id, self::META_OWNER_ID, $agency_owner_id);
        update_user_meta($sub_user_id, self::META_AGENCY_ID, $agency_id);
        update_user_meta($sub_user_id, self::META_AGENCY_ROLE, 'agency_member');
        
        // Alt kullanıcıya da pro tier ver
        update_user_meta($sub_user_id, '_upg_tier', 'agency_member');
        
        // Owner'ın sayacını artır
        update_user_meta($agency_owner_id, self::META_SUB_USER_COUNT, $current_count + 1);
        
        do_action('upg_sub_user_added', $agency_id, $agency_owner_id, $sub_user_id);
        
        return [
            'success'      => true,
            'agency_id'    => $agency_id,
            'sub_user_id'  => $sub_user_id,
            'current_count' => $current_count + 1,
            'remaining'    => $limit === -1 ? 'unlimited' : ($limit - $current_count - 1),
        ];
    }
    
    /**
     * Alt kullanıcı kaldır
     */
    public static function remove_sub_user(int $agency_owner_id, int $sub_user_id): bool {
        // Yetki kontrolü
        if (!self::is_agency_admin($agency_owner_id)) {
            return false;
        }
        
        $agency_id = get_user_meta($agency_owner_id, self::META_AGENCY_ID, true);
        $sub_agency = get_user_meta($sub_user_id, self::META_AGENCY_ID, true);
        
        // Aynı agency'de mi?
        if ($agency_id !== $sub_agency) {
            return false;
        }
        
        // Alt kullanıcı meta temizle
        delete_user_meta($sub_user_id, self::META_OWNER_ID);
        delete_user_meta($sub_user_id, self::META_AGENCY_ID);
        delete_user_meta($sub_user_id, self::META_AGENCY_ROLE);
        delete_user_meta($sub_user_id, '_upg_tier');
        
        // Sayacı azalt
        $current_count = (int) get_user_meta($agency_owner_id, self::META_SUB_USER_COUNT, true);
        update_user_meta($agency_owner_id, self::META_SUB_USER_COUNT, max(0, $current_count - 1));
        
        do_action('upg_sub_user_removed', $agency_id, $agency_owner_id, $sub_user_id);
        
        return true;
    }
    
    /**
     * Agency'nin tüm alt kullanıcılarını al
     */
    public static function get_sub_users(int $agency_owner_id): array {
        if (!self::is_agency_admin($agency_owner_id)) {
            return [];
        }
        
        $agency_id = get_user_meta($agency_owner_id, self::META_AGENCY_ID, true);
        
        global $wpdb;
        
        $user_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT user_id FROM {$wpdb->usermeta} 
             WHERE meta_key = %s AND meta_value = %s",
            self::META_AGENCY_ID,
            $agency_id
        ));
        
        $sub_users = [];
        
        foreach ($user_ids as $user_id) {
            $user_id = (int) $user_id;
            // Owner'ı dahil etme
            if ($user_id === $agency_owner_id) {
                continue;
            }
            
            $user = get_userdata($user_id);
            if ($user) {
                $sub_users[] = [
                    'id'           => $user_id,
                    'display_name' => $user->display_name,
                    'email'        => $user->user_email,
                    'role'         => get_user_meta($user_id, self::META_AGENCY_ROLE, true),
                    'joined_at'    => get_user_meta($user_id, '_upg_joined_at', true),
                ];
            }
        }
        
        return $sub_users;
    }
    
    // =========================================
    // POSTER METADATA HELPERS
    // =========================================
    
    /**
     * Poster için agency metadata oluştur
     * Bu, her poster üretiminde çağrılır
     */
    public static function get_poster_agency_metadata(?int $user_id = null): array {
        $user_id = $user_id ?? get_current_user_id();
        
        if (!$user_id) {
            return [
                'owner_user_id'     => 0,
                'generated_by_user_id' => 0,
                'agency_id'         => null,
                'is_agency_render'  => false,
            ];
        }
        
        // Agency'de mi?
        $agency_id = get_user_meta($user_id, self::META_AGENCY_ID, true);
        $owner_id = get_user_meta($user_id, self::META_OWNER_ID, true);
        
        if (!$agency_id) {
            // Normal kullanıcı (agency dışı)
            return [
                'owner_user_id'     => $user_id,
                'generated_by_user_id' => $user_id,
                'agency_id'         => null,
                'is_agency_render'  => false,
            ];
        }
        
        // Agency kullanıcısı
        return [
            'owner_user_id'     => $owner_id ?: $user_id,
            'generated_by_user_id' => $user_id,
            'agency_id'         => $agency_id,
            'is_agency_render'  => true,
        ];
    }
    
    /**
     * Post meta'ya agency bilgilerini kaydet
     */
    public static function save_poster_agency_meta(int $post_id, ?int $user_id = null): void {
        $meta = self::get_poster_agency_metadata($user_id);
        
        update_post_meta($post_id, self::POST_META_OWNER, $meta['owner_user_id']);
        update_post_meta($post_id, self::POST_META_GENERATED_BY, $meta['generated_by_user_id']);
        
        if ($meta['agency_id']) {
            update_post_meta($post_id, self::POST_META_AGENCY, $meta['agency_id']);
        }
    }
    
    // =========================================
    // SORGULAR & KONTROLLER
    // =========================================
    
    /**
     * Kullanıcı agency admin mi?
     */
    public static function is_agency_admin(int $user_id): bool {
        $role = get_user_meta($user_id, self::META_AGENCY_ROLE, true);
        return $role === 'agency_admin';
    }
    
    /**
     * Kullanıcı agency üyesi mi?
     */
    public static function is_agency_member(int $user_id): bool {
        $role = get_user_meta($user_id, self::META_AGENCY_ROLE, true);
        return $role === 'agency_member';
    }
    
    /**
     * Kullanıcı herhangi bir agency'de mi?
     */
    public static function is_in_agency(int $user_id): bool {
        $agency_id = get_user_meta($user_id, self::META_AGENCY_ID, true);
        return !empty($agency_id);
    }
    
    /**
     * Kullanıcının agency bilgilerini al
     */
    public static function get_user_agency_info(int $user_id): array {
        $agency_id = get_user_meta($user_id, self::META_AGENCY_ID, true);
        
        if (!$agency_id) {
            return [
                'in_agency'   => false,
                'agency_id'   => null,
                'role'        => null,
                'owner_id'    => null,
            ];
        }
        
        return [
            'in_agency'       => true,
            'agency_id'       => $agency_id,
            'role'            => get_user_meta($user_id, self::META_AGENCY_ROLE, true),
            'owner_id'        => (int) get_user_meta($user_id, self::META_OWNER_ID, true),
            'is_admin'        => self::is_agency_admin($user_id),
            'sub_user_count'  => self::is_agency_admin($user_id) 
                ? (int) get_user_meta($user_id, self::META_SUB_USER_COUNT, true) 
                : null,
            'sub_user_limit'  => self::is_agency_admin($user_id) 
                ? (int) get_user_meta($user_id, self::META_SUB_USER_LIMIT, true) 
                : null,
        ];
    }
    
    /**
     * Owner için alt kullanıcı istatistikleri
     */
    public static function get_agency_stats(int $owner_id): array {
        if (!self::is_agency_admin($owner_id)) {
            return [];
        }
        
        $agency_id = get_user_meta($owner_id, self::META_AGENCY_ID, true);
        $sub_users = self::get_sub_users($owner_id);
        
        global $wpdb;
        
        // Toplam render sayısı (tüm agency üyeleri için)
        $total_renders = 0;
        $all_user_ids = array_merge([$owner_id], array_column($sub_users, 'id'));
        
        foreach ($all_user_ids as $uid) {
            $total_renders += (int) get_user_meta($uid, '_upg_total_renders', true);
        }
        
        // Son 30 günlük poster sayısı
        $month_ago = date('Y-m-d', strtotime('-30 days'));
        $placeholders = implode(',', array_fill(0, count($all_user_ids), '%d'));
        
        $monthly_count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->postmeta} pm
             INNER JOIN {$wpdb->posts} p ON p.ID = pm.post_id
             WHERE pm.meta_key = %s 
             AND pm.meta_value IN ({$placeholders})
             AND p.post_date >= %s",
            array_merge(
                [self::POST_META_GENERATED_BY],
                $all_user_ids,
                [$month_ago]
            )
        ));
        
        return [
            'agency_id'         => $agency_id,
            'sub_user_count'    => count($sub_users),
            'sub_user_limit'    => (int) get_user_meta($owner_id, self::META_SUB_USER_LIMIT, true),
            'total_renders'     => $total_renders,
            'monthly_renders'   => (int) $monthly_count,
            'created_at'        => get_user_meta($owner_id, self::META_AGENCY_CREATED, true),
            'users'             => array_merge([
                [
                    'id'           => $owner_id,
                    'display_name' => get_userdata($owner_id)->display_name,
                    'role'         => 'agency_admin',
                    'renders'      => (int) get_user_meta($owner_id, '_upg_total_renders', true),
                ]
            ], array_map(function($u) {
                $u['renders'] = (int) get_user_meta($u['id'], '_upg_total_renders', true);
                return $u;
            }, $sub_users)),
        ];
    }
    
    // =========================================
    // UPGRADE PATH HELPERS
    // =========================================
    
    /**
     * Mevcut planları getir (Offer Engine entegrasyonu için)
     */
    public static function get_agency_plans(): array {
        return array_map(function($plan, $key) {
            return array_merge($plan, ['key' => $key]);
        }, self::AGENCY_PLANS, array_keys(self::AGENCY_PLANS));
    }
    
    /**
     * Kullanıcı agency'e upgrade edebilir mi?
     */
    public static function can_upgrade_to_agency(int $user_id): array {
        // Zaten agency'de mi?
        if (self::is_in_agency($user_id)) {
            return [
                'can_upgrade' => false,
                'reason'      => 'already_in_agency',
                'message'     => 'Zaten bir agency hesabınız var.',
            ];
        }
        
        // Pro mu?
        $tier = get_user_meta($user_id, '_upg_tier', true);
        
        return [
            'can_upgrade'    => true,
            'current_tier'   => $tier ?: 'free',
            'available_plans' => self::get_agency_plans(),
            'recommended'    => 'agency_starter',
        ];
    }
}
