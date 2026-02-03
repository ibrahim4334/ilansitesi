<?php
/**
 * Plugin Name: Umrebuldum Performance & Security Optimizer
 * Description: Performans ve güvenlik optimizasyonları için must-use eklenti
 * Version: 1.0.0
 * Author: Umrebuldum Team
 * 
 * ============================================
 * UMREBULDUM.COM - PERFORMANS OPTİMİZASYONU
 * Tarih: 2026-02-02
 * ============================================
 */

// Doğrudan erişimi engelle
defined( 'ABSPATH' ) || exit;

/**
 * ============================================
 * 1. XML-RPC KORUMASI
 * ============================================
 */

// XML-RPC'yi tamamen devre dışı bırak
add_filter( 'xmlrpc_enabled', '__return_false' );

// XML-RPC metodlarını boş döndür
add_filter( 'xmlrpc_methods', function( $methods ) {
    return array();
});

// XML-RPC pingback'i devre dışı bırak
add_filter( 'wp_headers', function( $headers ) {
    unset( $headers['X-Pingback'] );
    return $headers;
});

// RSD link'i kaldır (Really Simple Discovery)
remove_action( 'wp_head', 'rsd_link' );

// wlwmanifest link'i kaldır (Windows Live Writer)
remove_action( 'wp_head', 'wlwmanifest_link' );

/**
 * ============================================
 * 2. HEARTBEAT API OPTİMİZASYONU
 * ============================================
 */

add_action( 'init', function() {
    // Admin paneli dışında heartbeat'i devre dışı bırak
    if ( ! is_admin() ) {
        wp_deregister_script( 'heartbeat' );
    }
});

// Heartbeat aralığını artır (15 saniyeden 60 saniyeye)
add_filter( 'heartbeat_settings', function( $settings ) {
    $settings['interval'] = 60;
    return $settings;
});

/**
 * ============================================
 * 3. GEREKSIZ SCRIPT/STYLE TEMİZLİĞİ
 * ============================================
 */

add_action( 'wp_enqueue_scripts', function() {
    // Emoji scriptlerini kaldır
    remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
    remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
    remove_action( 'wp_print_styles', 'print_emoji_styles' );
    remove_action( 'admin_print_styles', 'print_emoji_styles' );
    remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
    remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
    remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );
    
    // TinyMCE emoji eklentisini kaldır
    add_filter( 'tiny_mce_plugins', function( $plugins ) {
        return is_array( $plugins ) ? array_diff( $plugins, array( 'wpemoji' ) ) : array();
    });
    
    // DNS prefetch'i kaldır
    add_filter( 'emoji_svg_url', '__return_false' );
}, 1 );

// jQuery migrate'i kaldır (gerekli değilse)
add_action( 'wp_default_scripts', function( $scripts ) {
    if ( ! is_admin() && isset( $scripts->registered['jquery'] ) ) {
        $script = $scripts->registered['jquery'];
        if ( $script->deps ) {
            $script->deps = array_diff( $script->deps, array( 'jquery-migrate' ) );
        }
    }
});

// WordPress sürüm bilgisini gizle
remove_action( 'wp_head', 'wp_generator' );

// Shortlink'i kaldır
remove_action( 'wp_head', 'wp_shortlink_wp_head' );

// REST API link'i kaldır
remove_action( 'wp_head', 'rest_output_link_wp_head', 10 );

// oEmbed keşif linkini kaldır
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );

/**
 * ============================================
 * 4. ADMIN PANEL OPTİMİZASYONU
 * ============================================
 */

// Dashboard widget'larını kaldır
add_action( 'wp_dashboard_setup', function() {
    remove_meta_box( 'dashboard_primary', 'dashboard', 'side' ); // WordPress Events and News
    remove_meta_box( 'dashboard_secondary', 'dashboard', 'side' );
    remove_meta_box( 'dashboard_quick_press', 'dashboard', 'side' ); // Quick Draft
    remove_meta_box( 'dashboard_site_health', 'dashboard', 'normal' ); // Site Health (kaynak tüketir)
}, 999 );

// Admin footer'daki WordPress bilgisini özelleştir
add_filter( 'admin_footer_text', function() {
    return '<span id="footer-thankyou">Umrebuldum.com - İlan Platformu</span>';
});

/**
 * ============================================
 * 5. VERİTABANI OPTİMİZASYONU
 * ============================================
 */

// Revision sayısını sınırla (wp-config.php'de de ayarlı)
if ( ! defined( 'WP_POST_REVISIONS' ) ) {
    define( 'WP_POST_REVISIONS', 5 );
}

// Autosave aralığını artır (1 dakikadan 5 dakikaya)
if ( ! defined( 'AUTOSAVE_INTERVAL' ) ) {
    define( 'AUTOSAVE_INTERVAL', 300 );
}

/**
 * ============================================
 * 6. GÜVENLİK İYİLEŞTİRMELERİ
 * ============================================
 */

// Login hata mesajlarını gizle (brute-force saldırılarını zorlaştır)
add_filter( 'login_errors', function() {
    return 'Giriş bilgileri hatalı. Lütfen tekrar deneyin.';
});

// REST API'yi yetkisiz kullanıcılar için kısıtla
add_filter( 'rest_authentication_errors', function( $result ) {
    // Eğer hata varsa veya kullanıcı giriş yapmışsa devam et
    if ( ! empty( $result ) ) {
        return $result;
    }
    
    if ( ! is_user_logged_in() ) {
        // Bazı public endpoint'lere izin ver
        $request_uri = $_SERVER['REQUEST_URI'];
        $allowed_routes = array(
            '/wp-json/hivepress/', // HivePress ilanları için
            '/wp-json/wp/v2/posts', // Blog yazıları için
            '/wp-json/wp/v2/pages', // Sayfalar için
        );
        
        foreach ( $allowed_routes as $route ) {
            if ( strpos( $request_uri, $route ) !== false ) {
                return $result;
            }
        }
        
        // Diğer tüm API çağrıları için 401
        return new WP_Error(
            'rest_not_logged_in',
            __( 'Bu kaynağa erişmek için giriş yapmalısınız.' ),
            array( 'status' => 401 )
        );
    }
    
    return $result;
});

// User enumeration'ı engelle
add_action( 'init', function() {
    if ( ! is_admin() ) {
        if ( isset( $_REQUEST['author'] ) && is_numeric( $_REQUEST['author'] ) ) {
            wp_redirect( home_url() );
            exit;
        }
    }
});

/**
 * ============================================
 * 7. CRON OPTİMİZASYONU
 * ============================================
 */

// Gereksiz cron job'ları temizle
add_action( 'init', function() {
    // Jetpack cron'larını kaldır (eklenti kaldırıldıktan sonra bile kalabilir)
    $jetpack_crons = array(
        'jetpack_sync_cron',
        'jetpack_sync_full_cron',
        'jetpack_v2_heartbeat',
        'jp_cron_daily_check',
    );
    
    foreach ( $jetpack_crons as $cron ) {
        wp_clear_scheduled_hook( $cron );
    }
    
    // Google Listings cron'larını kaldır
    wp_clear_scheduled_hook( 'woocommerce_gla_ads_send_sync' );
    wp_clear_scheduled_hook( 'woocommerce_gla_sync' );
});

/**
 * ============================================
 * 8. QUERY OPTİMİZASYONU
 * ============================================
 */

// Frontend'de gereksiz meta_key sorgulamalarını önle
add_filter( 'pre_get_posts', function( $query ) {
    if ( ! is_admin() && $query->is_main_query() ) {
        // Sticky posts için ayrı sorgu yapılmasını önle
        $query->set( 'ignore_sticky_posts', true );
    }
    return $query;
});

/**
 * ============================================
 * 9. CACHE HEADERS
 * ============================================
 */

// Statik dosyalar için cache header ekle
add_action( 'send_headers', function() {
    if ( ! is_admin() ) {
        // ETags'i kaldır (CDN uyumluluğu)
        header_remove( 'ETag' );
        
        // HTML sayfalar için kısa cache
        if ( ! defined( 'DOING_AJAX' ) ) {
            header( 'Cache-Control: public, max-age=300' ); // 5 dakika
        }
    }
});

/**
 * ============================================
 * 10. HİVEPRESS SPESİFİK OPTİMİZASYONLAR
 * ============================================
 */

// HivePress cache'i için özel filter
add_filter( 'hivepress/v1/cache/ttl', function( $ttl ) {
    return 3600; // 1 saat cache
});

/**
 * ============================================
 * ADMIN BİLDİRİMİ
 * ============================================
 */

add_action( 'admin_notices', function() {
    // Sadece bir kez göster
    if ( get_option( 'umrebuldum_optimizer_notice_dismissed' ) ) {
        return;
    }
    
    ?>
    <div class="notice notice-success is-dismissible" id="umrebuldum-optimizer-notice">
        <p>
            <strong>✅ Umrebuldum Optimizer aktif!</strong> 
            Performans ve güvenlik optimizasyonları uygulandı.
            <a href="<?php echo admin_url( 'options-general.php' ); ?>">Ayarları kontrol edin</a>.
        </p>
    </div>
    <script>
    jQuery(document).on('click', '#umrebuldum-optimizer-notice .notice-dismiss', function() {
        jQuery.post(ajaxurl, {action: 'umrebuldum_dismiss_notice'});
    });
    </script>
    <?php
});

add_action( 'wp_ajax_umrebuldum_dismiss_notice', function() {
    update_option( 'umrebuldum_optimizer_notice_dismissed', true );
    wp_die();
});

/**
 * ============================================
 * PERFORMANS LOGLAMA (Opsiyonel Debug)
 * ============================================
 */

// Sadece WP_DEBUG açıkken çalışır
if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
    add_action( 'shutdown', function() {
        if ( ! is_admin() ) {
            $time = timer_stop( 0, 6 );
            $memory = size_format( memory_get_peak_usage() );
            $queries = get_num_queries();
            
            if ( current_user_can( 'manage_options' ) ) {
                echo "<!-- Page generated in {$time}s | {$queries} queries | {$memory} memory -->";
            }
        }
    });
}
