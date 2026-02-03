<?php
/**
 * Metabox View - Pro Value Görüntüleme
 * 
 * @var WP_Post $post
 */

defined('ABSPATH') || exit;

$poster = $this->generator->get($post->ID);
$templates = \Umrebuldum\Poster\Templates::get_template_options();
$sizes = \Umrebuldum\Poster\Templates::get_size_options();

// Pro value metrics
$usage_tracker = new \Umrebuldum\Poster\Usage_Tracker();
$access = new \Umrebuldum\Poster\Access_Control();
$pro_comparison = $usage_tracker->get_pro_value_comparison();
$last_render = $usage_tracker->get_last_render_details($post->ID);
$is_pro = $access->is_pro();
$tier = $access->get_tier();
?>

<div class="upg-metabox">
    
    <?php if ($poster && file_exists($poster['path'])): ?>
        <!-- Poster Preview -->
        <div class="upg-poster-preview">
            <img src="<?php echo esc_url($poster['url']); ?>" 
                 alt="Afiş" 
                 style="max-width:100%;margin-bottom:10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
            
            <p style="font-size:11px;color:#666;margin:0;">
                <?php echo esc_html($poster['template'] ?? 'default'); ?> / 
                <?php echo esc_html($poster['size'] ?? 'instagram'); ?><br>
                <?php echo date('d.m.Y H:i', $poster['generated']); ?>
            </p>
            
            <p style="margin-top:10px;">
                <a href="<?php echo esc_url($poster['url']); ?>" 
                   target="_blank" class="button button-small">📥 İndir</a>
                <button type="button" class="button button-small" 
                        onclick="upgRegenerate(<?php echo $post->ID; ?>)">
                    🔄 Yeniden Üret
                </button>
            </p>
        </div>
        
        <!-- Son Render Metrikleri -->
        <?php if (!empty($last_render)): ?>
        <div class="upg-metrics-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0;">
            <div style="font-size:11px;font-weight:600;color:#475569;margin-bottom:8px;">
                📊 Son Render Metrikleri
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
                <div>
                    <span style="color:#94a3b8;">Süre:</span>
                    <strong style="color:<?php echo $last_render['render_time_ms'] < 100 ? '#22c55e' : '#f59e0b'; ?>">
                        <?php echo $last_render['render_time_ms']; ?>ms
                    </strong>
                </div>
                <div>
                    <span style="color:#94a3b8;">Cache:</span>
                    <?php if ($last_render['from_cache']): ?>
                        <strong style="color:#22c55e;">✓ Hit</strong>
                    <?php else: ?>
                        <strong style="color:#f59e0b;">Miss</strong>
                    <?php endif; ?>
                </div>
                <div>
                    <span style="color:#94a3b8;">Tier:</span>
                    <strong style="color:<?php echo $last_render['tier'] === 'pro' ? '#667eea' : '#94a3b8'; ?>">
                        <?php echo strtoupper($last_render['tier']); ?>
                    </strong>
                </div>
                <div>
                    <span style="color:#94a3b8;">Zaman:</span>
                    <strong><?php echo esc_html($last_render['time_ago']); ?></strong>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
    <?php else: ?>
        <p style="color:#666;">Afiş henüz üretilmedi.</p>
        <button type="button" class="button button-primary" 
                onclick="upgRegenerate(<?php echo $post->ID; ?>)">
            🎨 Afiş Üret
        </button>
    <?php endif; ?>
    
    <!-- Pro Value Badges -->
    <?php if (!empty($pro_comparison['badges'])): ?>
    <div class="upg-value-badges" style="display:flex;flex-wrap:wrap;gap:6px;margin:12px 0;">
        <?php foreach ($pro_comparison['badges'] as $badge): ?>
        <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:12px;font-size:10px;font-weight:500;background:<?php echo $badge['type'] === 'upgrade' ? '#f0f4ff' : '#f0fdf4'; ?>;color:<?php echo esc_attr($badge['color']); ?>;">
            <?php echo $badge['icon']; ?> <?php echo esc_html($badge['text']); ?>
        </span>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>
    
    <hr style="margin:15px 0;border:none;border-top:1px solid #e2e8f0;">
    
    <!-- Özel Üretim -->
    <p style="font-weight:600;color:#334155;margin-bottom:8px;">🎨 Özel Üretim:</p>
    
    <select id="upg-template" style="width:100%;margin-bottom:5px;border-radius:4px;">
        <?php foreach ($templates as $key => $label): ?>
        <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
        <?php endforeach; ?>
    </select>
    
    <select id="upg-size" style="width:100%;margin-bottom:10px;border-radius:4px;">
        <?php foreach ($sizes as $key => $label): ?>
        <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
        <?php endforeach; ?>
    </select>
    
    <button type="button" class="button" style="width:100%;border-radius:4px;" 
            onclick="upgGenerate(<?php echo $post->ID; ?>)">
        ✨ Özel Afiş Üret
    </button>
    
    <!-- Free Kullanıcı için Pro Upgrade Teşviki -->
    <?php if (!$is_pro): ?>
    <div class="upg-upgrade-prompt" style="margin-top:15px;padding:12px;background:linear-gradient(135deg,#f0f4ff 0%,#e8f4ff 100%);border-radius:8px;border:1px solid #c7d2fe;">
        <div style="font-size:12px;font-weight:600;color:#4338ca;margin-bottom:8px;">
            ⭐ Pro'ya Yükseltin
        </div>
        
        <ul style="margin:0;padding-left:16px;font-size:11px;color:#475569;line-height:1.6;">
            <li><strong>+42%</strong> daha yüksek kalite</li>
            <li><strong>30x</strong> daha uzun cache süresi</li>
            <li><strong>Watermark</strong> yok</li>
            <li><strong>Tüm şablonlar</strong> açık</li>
        </ul>
        
        <?php 
        $user_metrics = $pro_comparison['user_metrics'] ?? [];
        if ($user_metrics['cache_misses'] > 0):
            $potential_savings = round($user_metrics['cache_misses'] * 0.4, 1);
        ?>
        <div style="margin-top:8px;padding:8px;background:#fff;border-radius:4px;font-size:10px;">
            <strong style="color:#22c55e;">💡 Potansiyel Tasarruf:</strong><br>
            Pro ile <strong><?php echo $potential_savings; ?>sn</strong> daha az bekleme
        </div>
        <?php endif; ?>
        
        <a href="<?php echo esc_url($access->get_upgrade_url()); ?>" 
           class="button button-primary" 
           style="width:100%;margin-top:10px;text-align:center;background:#4f46e5;border-color:#4f46e5;">
            🚀 Pro'ya Geç
        </a>
    </div>
    <?php else: ?>
    <!-- Pro Kullanıcı Metrikleri -->
    <div class="upg-pro-stats" style="margin-top:15px;padding:12px;background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);border-radius:8px;border:1px solid #86efac;">
        <div style="font-size:12px;font-weight:600;color:#16a34a;margin-bottom:8px;">
            ✨ Pro Avantajlarınız
        </div>
        
        <?php $user_metrics = $pro_comparison['user_metrics'] ?? []; ?>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;">
            <div style="text-align:center;padding:8px;background:#fff;border-radius:4px;">
                <div style="font-size:18px;font-weight:700;color:#22c55e;">
                    <?php echo $user_metrics['total_renders'] ?? 0; ?>
                </div>
                <div style="color:#64748b;font-size:9px;">Toplam Render</div>
            </div>
            <div style="text-align:center;padding:8px;background:#fff;border-radius:4px;">
                <div style="font-size:18px;font-weight:700;color:#22c55e;">
                    %<?php echo $user_metrics['cache_hit_ratio'] ?? 0; ?>
                </div>
                <div style="color:#64748b;font-size:9px;">Cache Hit</div>
            </div>
            <div style="text-align:center;padding:8px;background:#fff;border-radius:4px;">
                <div style="font-size:18px;font-weight:700;color:#667eea;">
                    <?php echo $user_metrics['avg_render_ms'] ?? 0; ?>ms
                </div>
                <div style="color:#64748b;font-size:9px;">Ort. Süre</div>
            </div>
            <div style="text-align:center;padding:8px;background:#fff;border-radius:4px;">
                <div style="font-size:18px;font-weight:700;color:#f59e0b;">
                    <?php echo $user_metrics['total_size_mb'] ?? 0; ?>MB
                </div>
                <div style="color:#64748b;font-size:9px;">Toplam Boyut</div>
            </div>
        </div>
    </div>
    <?php endif; ?>
    
</div>

<style>
.upg-metabox {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
.upg-metabox select {
    padding: 6px 8px;
    border: 1px solid #e2e8f0;
}
.upg-metabox select:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102,126,234,0.2);
    outline: none;
}
</style>

<script>
function upgRegenerate(id) {
    upgGenerate(id, 
        '<?php echo esc_js(get_option('upg_default_template', 'default')); ?>',
        '<?php echo esc_js(get_option('upg_default_size', 'instagram')); ?>'
    );
}

function upgGenerate(id, template, size) {
    template = template || document.getElementById('upg-template').value;
    size = size || document.getElementById('upg-size').value;
    
    // Butonları disable et
    var buttons = document.querySelectorAll('.upg-metabox button');
    buttons.forEach(function(btn) {
        btn.disabled = true;
        btn.style.opacity = '0.7';
    });
    
    // AJAX render fonksiyonu
    var doRender = function() {
        return new Promise(function(resolve, reject) {
            jQuery.post(ajaxurl, {
                action: 'upg_generate',
                listing_id: id,
                template: template,
                size: size,
                _wpnonce: '<?php echo wp_create_nonce('upg_generate'); ?>'
            }, function(response) {
                resolve(response);
            }).fail(function(error) {
                reject(error);
            });
        });
    };
    
    // Friction wrapper varsa kullan
    var renderPromise;
    if (window.upgFriction && typeof window.upgFriction.wrapRender === 'function') {
        renderPromise = window.upgFriction.wrapRender(doRender);
    } else {
        renderPromise = doRender();
    }
    
    // Sonucu işle
    renderPromise.then(function(response) {
        if (response.success) {
            // Metrikleri konsola yaz
            if (response.data) {
                console.log('📊 Render Metrics:', {
                    render_time_ms: response.data.render_time_ms,
                    from_cache: response.data.from_cache,
                    tier: response.data.tier,
                    size_kb: response.data.size_kb
                });
                
                // Value signals göster (Pro kullanıcı için)
                if (window.upgValueSignals && response.data.value_signals) {
                    window.upgValueSignals.handleRenderResponse(response.data);
                }
            }
            location.reload();
        } else {
            alert('Hata: ' + (response.data || 'Bilinmeyen hata'));
            enableButtons();
        }
    }).catch(function(error) {
        console.error('Render error:', error);
        alert('Bağlantı hatası');
        enableButtons();
    });
    
    function enableButtons() {
        buttons.forEach(function(btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    }
}
</script>

