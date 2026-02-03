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
?>

<div class="wrap upg-admin">
    <h1>🖼️ Umrebuldum Afiş Üretici</h1>
    
    <?php echo $message; ?>
    
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
                    $font_path = UPG_PATH . 'fonts/Inter-Bold.ttf';
                    echo file_exists($font_path) 
                        ? '✅ Inter-Bold.ttf' 
                        : '⚠️ Yok - <a href="https://fonts.google.com/specimen/Inter" target="_blank">İndir</a>';
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
