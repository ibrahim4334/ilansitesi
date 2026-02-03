<?php
/**
 * ============================================
 * UMREBULDUM.COM - EKLENTİ TEMİZLEME SCRIPTİ
 * Tarih: 2026-02-02
 * ============================================
 * 
 * KULLANIM:
 * 1. Bu dosyayı WordPress ana dizinine yükleyin
 * 2. wp-admin'e giriş yapın (admin olarak)
 * 3. Tarayıcıda: yoursite.com/cleanup-plugins.php
 * 4. İşlem tamamlandıktan sonra bu dosyayı SİLİN!
 * 
 * GÜVENLİK: Bu script sadece admin kullanıcılar tarafından çalıştırılabilir
 */

// WordPress'i yükle
require_once('wp-load.php');

// Yalnızca admin kullanıcılar çalıştırabilir
if (!is_user_logged_in() || !current_user_can('manage_options')) {
    wp_die('Bu sayfaya erişim yetkiniz yok. Lütfen admin olarak giriş yapın.');
}

// Nonce kontrolü için form işleme
$nonce_action = 'umrebuldum_cleanup_action';

?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Umrebuldum - Eklenti Temizleme</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #f1f1f1; }
        .container { max-width: 900px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #23282d; border-bottom: 2px solid #ffc107; padding-bottom: 15px; }
        h2 { color: #0073aa; margin-top: 30px; }
        .plugin-list { background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 15px 0; }
        .plugin-item { padding: 10px; margin: 5px 0; background: #fff; border-left: 4px solid #dc3545; border-radius: 3px; }
        .plugin-item.success { border-left-color: #28a745; }
        .plugin-item.warning { border-left-color: #ffc107; }
        .btn { display: inline-block; padding: 12px 24px; background: #dc3545; color: #fff; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin: 10px 5px; text-decoration: none; }
        .btn:hover { background: #c82333; }
        .btn-warning { background: #ffc107; color: #000; }
        .btn-warning:hover { background: #e0a800; }
        .btn-success { background: #28a745; }
        .btn-success:hover { background: #218838; }
        .result { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .result.success { background: #d4edda; color: #155724; }
        .result.error { background: #f8d7da; color: #721c24; }
        .result.info { background: #cce5ff; color: #004085; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f4f4f4; }
        .warning-box { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 Umrebuldum.com - Eklenti Temizleme Paneli</h1>
        
        <div class="warning-box">
            <strong>⚠️ UYARI:</strong> Bu işlemler geri alınamaz! İşlemden önce mutlaka veritabanı yedeği alın.
            <br>İşlem tamamlandıktan sonra bu dosyayı (<code>cleanup-plugins.php</code>) sunucudan silin!
        </div>

<?php

// Kaldırılacak eklentiler listesi
$plugins_to_remove = array(
    'jetpack' => array(
        'name' => 'Jetpack',
        'folder' => 'jetpack',
        'reason' => 'Memory tüketen, sync sorunları, DDoS geçmişiyle uyumsuz',
        'db_options' => array('jetpack_%', 'jpsq_%', 'jp_%'),
    ),
    'google-listings-and-ads' => array(
        'name' => 'Google Listings and Ads',
        'folder' => 'google-listings-and-ads',
        'reason' => 'E-ticaret odaklı, ilan sitesi için gereksiz, 4554 dosya',
        'db_options' => array('woocommerce_gla_%', 'gla_%'),
    ),
    'tiktok-for-business' => array(
        'name' => 'TikTok for Business',
        'folder' => 'tiktok-for-business',
        'reason' => 'Kullanılmıyor',
        'db_options' => array('tiktok_%'),
    ),
    'kliken-ads-pixel-for-meta' => array(
        'name' => 'Kliken Ads Pixel for Meta',
        'folder' => 'kliken-ads-pixel-for-meta',
        'reason' => 'Fatal error veriyor, bozuk',
        'db_options' => array('kliken_%', 'kwcfb_%'),
    ),
    'woocommerce-payments' => array(
        'name' => 'WooCommerce Payments',
        'folder' => 'woocommerce-payments',
        'reason' => 'Shopier varken gereksiz',
        'db_options' => array('wcpay_%', 'woocommerce_wcpay_%'),
    ),
    'woocommerce-services' => array(
        'name' => 'WooCommerce Services',
        'folder' => 'woocommerce-services',
        'reason' => 'Eksik dosya hatası, kırık',
        'db_options' => array('wc_connect_%'),
    ),
    'woo-update-manager' => array(
        'name' => 'Woo Update Manager',
        'folder' => 'woo-update-manager',
        'reason' => 'Gereksiz',
        'db_options' => array(),
    ),
    'hello' => array(
        'name' => 'Hello Dolly',
        'folder' => 'hello.php', // Bu tek dosya
        'reason' => 'Tamamen gereksiz demo eklentisi',
        'db_options' => array(),
    ),
);

// Eklenti durumlarını kontrol et
$plugin_status = array();
$plugins_dir = WP_CONTENT_DIR . '/plugins/';

foreach ($plugins_to_remove as $slug => $info) {
    $path = $plugins_dir . $info['folder'];
    $plugin_status[$slug] = array(
        'exists' => file_exists($path) || is_file($plugins_dir . $info['folder']),
        'info' => $info
    );
}

// Form işleme
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    
    if (!wp_verify_nonce($_POST['_wpnonce'], $nonce_action)) {
        echo '<div class="result error">Güvenlik doğrulaması başarısız!</div>';
    } else {
        
        $action = sanitize_text_field($_POST['action']);
        
        // Eklenti Deaktivasyonu
        if ($action === 'deactivate_plugins') {
            echo '<h2>🔌 Eklenti Deaktivasyon Sonuçları</h2>';
            
            require_once(ABSPATH . 'wp-admin/includes/plugin.php');
            
            foreach ($plugins_to_remove as $slug => $info) {
                // Eklenti dosya yolunu bul
                $plugin_file = '';
                
                if ($info['folder'] === 'hello.php') {
                    $plugin_file = 'hello.php';
                } else {
                    // Ana eklenti dosyasını bul
                    $plugin_dir = $plugins_dir . $info['folder'];
                    if (is_dir($plugin_dir)) {
                        $files = glob($plugin_dir . '/*.php');
                        foreach ($files as $file) {
                            $plugin_data = get_plugin_data($file, false, false);
                            if (!empty($plugin_data['Name'])) {
                                $plugin_file = $info['folder'] . '/' . basename($file);
                                break;
                            }
                        }
                    }
                }
                
                if ($plugin_file && is_plugin_active($plugin_file)) {
                    deactivate_plugins($plugin_file);
                    echo '<div class="result success">✅ <strong>' . esc_html($info['name']) . '</strong> deaktive edildi.</div>';
                } elseif ($plugin_file) {
                    echo '<div class="result info">ℹ️ <strong>' . esc_html($info['name']) . '</strong> zaten deaktif.</div>';
                } else {
                    echo '<div class="result info">ℹ️ <strong>' . esc_html($info['name']) . '</strong> bulunamadı.</div>';
                }
            }
        }
        
        // Eklenti Dosyalarını Sil
        if ($action === 'delete_files') {
            echo '<h2>📁 Dosya Silme Sonuçları</h2>';
            
            foreach ($plugins_to_remove as $slug => $info) {
                $path = $plugins_dir . $info['folder'];
                
                if (is_file($path)) {
                    // Tek dosya (hello.php gibi)
                    if (unlink($path)) {
                        echo '<div class="result success">✅ <strong>' . esc_html($info['name']) . '</strong> dosyası silindi.</div>';
                    } else {
                        echo '<div class="result error">❌ <strong>' . esc_html($info['name']) . '</strong> silinemedi!</div>';
                    }
                } elseif (is_dir($path)) {
                    // Klasör
                    if (deleteDirectory($path)) {
                        echo '<div class="result success">✅ <strong>' . esc_html($info['name']) . '</strong> klasörü silindi.</div>';
                    } else {
                        echo '<div class="result error">❌ <strong>' . esc_html($info['name']) . '</strong> silinemedi!</div>';
                    }
                } else {
                    echo '<div class="result info">ℹ️ <strong>' . esc_html($info['name']) . '</strong> zaten silinmiş.</div>';
                }
            }
        }
        
        // Veritabanı Temizliği
        if ($action === 'cleanup_database') {
            echo '<h2>🗄️ Veritabanı Temizlik Sonuçları</h2>';
            
            global $wpdb;
            $total_deleted = 0;
            
            foreach ($plugins_to_remove as $slug => $info) {
                if (!empty($info['db_options'])) {
                    foreach ($info['db_options'] as $pattern) {
                        // Options tablosundan temizle
                        $deleted = $wpdb->query(
                            $wpdb->prepare(
                                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                                $pattern
                            )
                        );
                        $total_deleted += $deleted;
                        
                        if ($deleted > 0) {
                            echo '<div class="result success">✅ <strong>' . esc_html($info['name']) . '</strong>: ' . $deleted . ' kayıt silindi (pattern: ' . esc_html($pattern) . ').</div>';
                        }
                    }
                }
            }
            
            // Genel temizlik
            echo '<h3>Genel Veritabanı Optimizasyonu</h3>';
            
            // Transient'leri temizle
            $transients = $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_%' OR option_name LIKE '_site_transient_%'");
            echo '<div class="result success">✅ ' . $transients . ' transient temizlendi.</div>';
            
            // Orphan postmeta temizle
            $orphan_meta = $wpdb->query("DELETE pm FROM {$wpdb->postmeta} pm LEFT JOIN {$wpdb->posts} p ON pm.post_id = p.ID WHERE p.ID IS NULL");
            echo '<div class="result success">✅ ' . $orphan_meta . ' orphan postmeta temizlendi.</div>';
            
            // Orphan usermeta temizle
            $orphan_usermeta = $wpdb->query("DELETE um FROM {$wpdb->usermeta} um LEFT JOIN {$wpdb->users} u ON um.user_id = u.ID WHERE u.ID IS NULL");
            echo '<div class="result success">✅ ' . $orphan_usermeta . ' orphan usermeta temizlendi.</div>';
            
            // Spam/trash yorumları temizle
            $spam_comments = $wpdb->query("DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam' OR comment_approved = 'trash'");
            echo '<div class="result success">✅ ' . $spam_comments . ' spam/trash yorum temizlendi.</div>';
            
            // Revision'ları sınırla (son 5 tane kalsın)
            // Bu işlem dikkatli yapılmalı
            
            // Tabloları optimize et
            $tables = $wpdb->get_results("SHOW TABLES");
            $optimized = 0;
            foreach ($tables as $table) {
                $table_name = array_values(get_object_vars($table))[0];
                if (strpos($table_name, $wpdb->prefix) === 0) {
                    $wpdb->query("OPTIMIZE TABLE `{$table_name}`");
                    $optimized++;
                }
            }
            echo '<div class="result success">✅ ' . $optimized . ' tablo optimize edildi.</div>';
        }
        
        // Error Log Temizle
        if ($action === 'clear_error_log') {
            echo '<h2>📋 Error Log Temizlik Sonuçları</h2>';
            
            $error_log_path = ABSPATH . 'error_log';
            
            if (file_exists($error_log_path)) {
                // Önce yedekle
                $backup_path = ABSPATH . 'error_log.backup_' . date('Y-m-d_H-i-s');
                copy($error_log_path, $backup_path);
                echo '<div class="result info">ℹ️ Error log yedeklendi: ' . basename($backup_path) . '</div>';
                
                // Temizle
                file_put_contents($error_log_path, '');
                echo '<div class="result success">✅ Error log temizlendi.</div>';
            } else {
                echo '<div class="result info">ℹ️ Error log dosyası bulunamadı.</div>';
            }
        }
    }
}

// Recursive directory delete function
function deleteDirectory($dir) {
    if (!file_exists($dir)) return true;
    if (!is_dir($dir)) return unlink($dir);
    
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') continue;
        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
    }
    
    return rmdir($dir);
}

?>

        <h2>📋 Kaldırılacak Eklentiler</h2>
        <table>
            <tr>
                <th>Eklenti</th>
                <th>Durum</th>
                <th>Sebep</th>
            </tr>
            <?php foreach ($plugin_status as $slug => $data): ?>
            <tr>
                <td><strong><?php echo esc_html($data['info']['name']); ?></strong></td>
                <td>
                    <?php if ($data['exists']): ?>
                        <span style="color: #dc3545;">● Mevcut</span>
                    <?php else: ?>
                        <span style="color: #28a745;">● Kaldırılmış</span>
                    <?php endif; ?>
                </td>
                <td><?php echo esc_html($data['info']['reason']); ?></td>
            </tr>
            <?php endforeach; ?>
        </table>

        <h2>🚀 İşlemler</h2>
        <p>Lütfen işlemleri sırasıyla yapın:</p>
        
        <form method="post" style="display: inline-block;">
            <?php wp_nonce_field($nonce_action); ?>
            <input type="hidden" name="action" value="deactivate_plugins">
            <button type="submit" class="btn btn-warning">1. Eklentileri Deaktive Et</button>
        </form>
        
        <form method="post" style="display: inline-block;">
            <?php wp_nonce_field($nonce_action); ?>
            <input type="hidden" name="action" value="delete_files">
            <button type="submit" class="btn">2. Eklenti Dosyalarını Sil</button>
        </form>
        
        <form method="post" style="display: inline-block;">
            <?php wp_nonce_field($nonce_action); ?>
            <input type="hidden" name="action" value="cleanup_database">
            <button type="submit" class="btn">3. Veritabanını Temizle</button>
        </form>
        
        <form method="post" style="display: inline-block;">
            <?php wp_nonce_field($nonce_action); ?>
            <input type="hidden" name="action" value="clear_error_log">
            <button type="submit" class="btn btn-success">4. Error Log Temizle</button>
        </form>

        <h2>📊 Sistem Bilgisi</h2>
        <table>
            <tr><th>Özellik</th><th>Değer</th></tr>
            <tr><td>PHP Sürümü</td><td><?php echo PHP_VERSION; ?></td></tr>
            <tr><td>PHP Bellek Limiti</td><td><?php echo ini_get('memory_limit'); ?></td></tr>
            <tr><td>WordPress Bellek Limiti</td><td><?php echo WP_MEMORY_LIMIT; ?></td></tr>
            <tr><td>Max Execution Time</td><td><?php echo ini_get('max_execution_time'); ?>s</td></tr>
            <tr><td>Upload Max Filesize</td><td><?php echo ini_get('upload_max_filesize'); ?></td></tr>
            <tr><td>WordPress Sürümü</td><td><?php echo get_bloginfo('version'); ?></td></tr>
            <tr><td>Aktif Tema</td><td><?php echo wp_get_theme()->get('Name'); ?></td></tr>
            <tr><td>Aktif Eklenti Sayısı</td><td><?php echo count(get_option('active_plugins')); ?></td></tr>
        </table>

        <div class="warning-box" style="margin-top: 30px;">
            <strong>⚠️ ÖNEMLİ:</strong> Tüm işlemler tamamlandıktan sonra:
            <ol>
                <li>Bu dosyayı (<code>cleanup-plugins.php</code>) sunucudan silin</li>
                <li>WordPress admin panelinden cache'i temizleyin</li>
                <li>Siteyi test edin</li>
            </ol>
        </div>
    </div>
</body>
</html>
