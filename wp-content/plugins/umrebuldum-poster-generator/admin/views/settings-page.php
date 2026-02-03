<?php
/**
 * Admin Settings Page View
 * 
 * @var string $message
 * @var array|null $generated
 */

defined('ABSPATH') || exit;

$templates = \Umrebuldum\Poster\Templates::get_template_options();
$sizes = \Umrebuldum\Poster\Templates::get_size_options();
$recent_posters = $this->get_recent_posters();
$dashboard_stats = $this->get_dashboard_stats();
?>

<div class="wrap upg-admin">
    <h1>🖼️ Umrebuldum Afiş Üretici</h1>
    
    <?php echo $message; ?>
    
    <!-- ============================================ -->
    <!-- MINI DASHBOARD (SADECE OKUNUR) -->
    <!-- ============================================ -->
    <div class="upg-dashboard">
        <h2>📊 Dashboard</h2>
        
        <div class="upg-stats-grid">
            <!-- Toplam Render -->
            <div class="upg-stat-card upg-stat-primary">
                <div class="upg-stat-icon">🎨</div>
                <div class="upg-stat-content">
                    <span class="upg-stat-value"><?php echo number_format($dashboard_stats['total_renders']); ?></span>
                    <span class="upg-stat-label">Toplam Render</span>
                </div>
            </div>
            
            <!-- Cache Hit Oranı -->
            <div class="upg-stat-card upg-stat-success">
                <div class="upg-stat-icon">⚡</div>
                <div class="upg-stat-content">
                    <span class="upg-stat-value"><?php echo $dashboard_stats['cache_hit_ratio']; ?>%</span>
                    <span class="upg-stat-label">Cache Hit Oranı</span>
                    <span class="upg-stat-detail"><?php echo number_format($dashboard_stats['cache_hits']); ?> / <?php echo number_format($dashboard_stats['total_renders']); ?></span>
                </div>
            </div>
            
            <!-- CPU Tasarrufu -->
            <div class="upg-stat-card upg-stat-info">
                <div class="upg-stat-icon">💾</div>
                <div class="upg-stat-content">
                    <span class="upg-stat-value"><?php echo esc_html($dashboard_stats['cpu_savings']['human_readable']); ?></span>
                    <span class="upg-stat-label">CPU Tasarrufu</span>
                    <span class="upg-stat-detail">~<?php echo number_format($dashboard_stats['cpu_savings']['total_saved_ms']); ?> ms</span>
                </div>
            </div>
            
            <!-- Tier Dağılımı -->
            <div class="upg-stat-card upg-stat-warning">
                <div class="upg-stat-icon">👥</div>
                <div class="upg-stat-content">
                    <span class="upg-stat-value">
                        <?php echo $dashboard_stats['tier_stats']['free_users']; ?> / <?php echo $dashboard_stats['tier_stats']['pro_users']; ?>
                    </span>
                    <span class="upg-stat-label">Free / Pro</span>
                    <?php if ($dashboard_stats['tier_stats']['agency_users'] > 0): ?>
                    <span class="upg-stat-detail">+<?php echo $dashboard_stats['tier_stats']['agency_users']; ?> Agency</span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <!-- Günlük Trend (Son 7 Gün) -->
        <div class="upg-trend-section">
            <h3>📈 Son 7 Gün</h3>
            <div class="upg-trend-chart">
                <?php 
                $max_renders = max(array_column($dashboard_stats['daily_trend'], 'renders'));
                $max_renders = $max_renders > 0 ? $max_renders : 1;
                
                foreach ($dashboard_stats['daily_trend'] as $day): 
                    $height = ($day['renders'] / $max_renders) * 100;
                    $cache_height = $day['renders'] > 0 ? ($day['cache_hits'] / $day['renders']) * $height : 0;
                ?>
                <div class="upg-trend-bar-wrapper">
                    <div class="upg-trend-bar" style="height: <?php echo $height; ?>%;">
                        <div class="upg-trend-cache" style="height: <?php echo $cache_height; ?>%;"></div>
                    </div>
                    <span class="upg-trend-label"><?php echo esc_html($day['day_tr']); ?></span>
                    <span class="upg-trend-value"><?php echo $day['renders']; ?></span>
                </div>
                <?php endforeach; ?>
            </div>
            <div class="upg-trend-legend">
                <span><span class="upg-legend-box upg-legend-total"></span> Toplam Render</span>
                <span><span class="upg-legend-box upg-legend-cache"></span> Cache Hit</span>
            </div>
        </div>
        
        <!-- Free vs Pro CPU Karşılaştırması -->
        <div class="upg-comparison-section">
            <h3>⚡ Pro Avantajı</h3>
            <div class="upg-comparison-bars">
                <div class="upg-compare-item">
                    <span class="upg-compare-label">Free Renderlar</span>
                    <div class="upg-compare-bar">
                        <div class="upg-compare-fill upg-compare-free" style="width: <?php 
                            $total = $dashboard_stats['tier_stats']['free_renders'] + $dashboard_stats['tier_stats']['pro_renders'];
                            echo $total > 0 ? round(($dashboard_stats['tier_stats']['free_renders'] / $total) * 100) : 50;
                        ?>%;"></div>
                    </div>
                    <span class="upg-compare-value"><?php echo number_format($dashboard_stats['tier_stats']['free_renders']); ?></span>
                </div>
                <div class="upg-compare-item">
                    <span class="upg-compare-label">Pro Renderlar</span>
                    <div class="upg-compare-bar">
                        <div class="upg-compare-fill upg-compare-pro" style="width: <?php 
                            echo $total > 0 ? round(($dashboard_stats['tier_stats']['pro_renders'] / $total) * 100) : 50;
                        ?>%;"></div>
                    </div>
                    <span class="upg-compare-value"><?php echo number_format($dashboard_stats['tier_stats']['pro_renders']); ?></span>
                </div>
            </div>
            <?php if ($dashboard_stats['cpu_savings']['pro_bonus_ms'] > 0): ?>
            <p class="upg-pro-bonus">
                ✨ Pro kullanıcılar sayesinde <strong>~<?php echo number_format($dashboard_stats['cpu_savings']['pro_bonus_ms']); ?> ms</strong> ekstra CPU tasarrufu
            </p>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="upg-grid">
        <!-- Ayarlar -->
        <div class="upg-card">
            <h2>⚙️ Ayarlar</h2>
            <form method="post" action="options.php">
                <?php settings_fields('upg_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th>Otomatik Üretim</th>
                        <td>
                            <label>
                                <input type="checkbox" name="upg_auto_generate" value="1" 
                                    <?php checked(get_option('upg_auto_generate', true)); ?>>
                                İlan yayınlandığında otomatik afiş üret
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th>Varsayılan Şablon</th>
                        <td>
                            <select name="upg_default_template">
                                <?php foreach ($templates as $key => $label): ?>
                                <option value="<?php echo esc_attr($key); ?>" 
                                    <?php selected(get_option('upg_default_template', 'default'), $key); ?>>
                                    <?php echo esc_html($label); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Varsayılan Boyut</th>
                        <td>
                            <select name="upg_default_size">
                                <?php foreach ($sizes as $key => $label): ?>
                                <option value="<?php echo esc_attr($key); ?>" 
                                    <?php selected(get_option('upg_default_size', 'instagram'), $key); ?>>
                                    <?php echo esc_html($label); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Generator Tipi</th>
                        <td>
                            <select name="upg_generator_type">
                                <option value="gd" <?php selected(get_option('upg_generator_type', 'gd'), 'gd'); ?>>
                                    PHP/GD (Varsayılan)
                                </option>
                                <option value="api" <?php selected(get_option('upg_generator_type'), 'api'); ?> disabled>
                                    Python API (Phase 3)
                                </option>
                            </select>
                            <p class="description">Phase 3'te Python servisine geçiş yapılabilir.</p>
                        </td>
                    </tr>
                    <tr>
                        <th>Pro Product ID</th>
                        <td>
                            <input type="number" 
                                   name="upg_pro_product_id" 
                                   value="<?php echo esc_attr(get_option('upg_pro_product_id', '')); ?>"
                                   class="regular-text"
                                   min="1"
                                   placeholder="Örn: 123">
                            <p class="description">
                                WooCommerce Subscriptions ürün ID'si. 
                                <?php if (function_exists('wcs_user_has_subscription')): ?>
                                    <span style="color: #46b450;">✓ WooCommerce Subscriptions aktif</span>
                                <?php else: ?>
                                    <span style="color: #dc3232;">✗ WooCommerce Subscriptions yüklü değil</span>
                                <?php endif; ?>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button('Kaydet'); ?>
            </form>
        </div>
        
        <!-- Test Üretimi -->
        <div class="upg-card">
            <h2>🧪 Test Üretimi</h2>
            <form method="post">
                <?php wp_nonce_field('upg_test'); ?>
                
                <table class="form-table">
                    <tr>
                        <th>İlan ID</th>
                        <td>
                            <input type="number" name="listing_id" required class="regular-text" 
                                placeholder="Örn: 123">
                        </td>
                    </tr>
                    <tr>
                        <th>Şablon</th>
                        <td>
                            <select name="template">
                                <?php foreach ($templates as $key => $label): ?>
                                <option value="<?php echo esc_attr($key); ?>">
                                    <?php echo esc_html($label); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>Boyut</th>
                        <td>
                            <select name="size">
                                <?php foreach ($sizes as $key => $label): ?>
                                <option value="<?php echo esc_attr($key); ?>">
                                    <?php echo esc_html($label); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <button type="submit" name="upg_test_generate" class="button button-primary">
                    🎨 Afiş Üret
                </button>
            </form>
            
            <?php if ($generated): ?>
            <div class="upg-preview">
                <h3>✅ Üretilen Afiş</h3>
                <img src="<?php echo esc_url($generated['url']); ?>" alt="Afiş">
                <p>
                    <a href="<?php echo esc_url($generated['url']); ?>" 
                       target="_blank" class="button">İndir</a>
                </p>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Son Afişler -->
    <div class="upg-card upg-full">
        <h2>📋 Son Üretilen Afişler</h2>
        
        <?php if ($recent_posters): ?>
        <div class="upg-poster-grid">
            <?php foreach ($recent_posters as $poster): ?>
            <div class="upg-poster-item">
                <img src="<?php echo esc_url($poster['url']); ?>" alt="">
                <div class="upg-poster-info">
                    <small><?php echo esc_html(substr($poster['filename'], 0, 20)); ?>...</small>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
        <p>Henüz afiş üretilmedi.</p>
        <?php endif; ?>
    </div>
    
    <!-- Sistem Bilgisi -->
    <div class="upg-card upg-full">
        <h2>ℹ️ Sistem Bilgisi</h2>
        <table class="widefat striped">
            <tr>
                <td><strong>Generator Tipi</strong></td>
                <td><?php echo esc_html($this->generator->get_type()); ?></td>
            </tr>
            <tr>
                <td><strong>Generator Durumu</strong></td>
                <td><?php echo $this->generator->is_ready() ? '✅ Hazır' : '❌ Hazır Değil'; ?></td>
            </tr>
            <tr>
                <td><strong>GD Library</strong></td>
                <td><?php echo extension_loaded('gd') ? '✅ Aktif' : '❌ Yok'; ?></td>
            </tr>
            <tr>
                <td><strong>Imagick</strong></td>
                <td><?php echo extension_loaded('imagick') ? '✅ Aktif' : '⚠️ Yok (GD kullanılıyor)'; ?></td>
            </tr>
            <tr>
                <td><strong>PHP Bellek</strong></td>
                <td><?php echo ini_get('memory_limit'); ?></td>
            </tr>
            <tr>
                <td><strong>Font Dosyası</strong></td>
                <td>
                    <?php 
                    // Inter font variants kontrol
                    $fonts_dir = UPG_PATH . 'fonts/';
                    $inter_fonts = [
                        'Inter_28pt-Bold.ttf',
                        'Inter_24pt-Bold.ttf', 
                        'Inter_18pt-Bold.ttf',
                        'Inter-Bold.ttf',
                    ];
                    
                    $found_font = null;
                    foreach ($inter_fonts as $font) {
                        if (file_exists($fonts_dir . $font)) {
                            $found_font = $font;
                            break;
                        }
                    }
                    
                    if ($found_font) {
                        echo '✅ ' . esc_html($found_font);
                    } else {
                        echo '⚠️ Yok - <a href="https://fonts.google.com/specimen/Inter" target="_blank">İndir</a>';
                    }
                    ?>
                </td>
            </tr>
            <tr>
                <td><strong>Plugin Versiyonu</strong></td>
                <td><?php echo UPG_VERSION; ?></td>
            </tr>
        </table>
    </div>
</div>
