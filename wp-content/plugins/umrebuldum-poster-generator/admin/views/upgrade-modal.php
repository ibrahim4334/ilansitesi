<?php
/**
 * Upgrade Modal View
 * 
 * Free → Pro conversion modal'ı
 * Çoklu plan desteği ile (Offer Engine entegrasyonu)
 * 
 * @package Umrebuldum\Poster
 */

defined('ABSPATH') || exit;

$funnel = new \Umrebuldum\Poster\Upgrade_Funnel();
$offer_engine = new \Umrebuldum\Poster\Offer_Engine();
$features = $funnel->get_pro_features();
$plans = $offer_engine->get_visible_plans();
$has_multiple = count($plans) > 1;
$recommended = $offer_engine->get_recommended_plan();
?>

<!-- Upgrade Modal Overlay -->
<div id="upg-upgrade-modal" class="upg-modal-overlay" style="display:none;" role="dialog" aria-modal="true">
    <div class="upg-modal <?php echo $has_multiple ? 'upg-modal-wide' : ''; ?>">
        <!-- Header -->
        <div class="upg-modal-header">
            <span class="upg-modal-badge upg-badge-pro">PRO</span>
            <h2 class="upg-modal-title" id="upg-modal-title">Pro'ya Yükselt</h2>
            <button type="button" class="upg-modal-close" onclick="upgModal.close()" aria-label="Kapat">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        
        <!-- Body -->
        <div class="upg-modal-body">
            <!-- Dynamic message -->
            <p class="upg-modal-desc" id="upg-modal-desc">
                Pro üyelik ile tüm özelliklere erişin!
            </p>
            
            <?php if ($has_multiple): ?>
            <!-- ====================================== -->
            <!-- MULTI-PLAN PRICING CARDS              -->
            <!-- ====================================== -->
            <div class="upg-pricing-grid" data-plan-count="<?php echo count($plans); ?>">
                <?php foreach ($plans as $key => $plan): 
                    $is_recommended = ($key === $recommended);
                    $badge = $offer_engine->get_plan_badge($key);
                    $highlight = !empty($plan['highlight']) || $is_recommended;
                ?>
                <div class="upg-pricing-card <?php echo $highlight ? 'upg-pricing-card-highlight' : ''; ?>" 
                     data-plan="<?php echo esc_attr($key); ?>">
                    
                    <!-- Badge -->
                    <?php if ($badge): ?>
                    <div class="upg-pricing-badge"><?php echo esc_html($badge); ?></div>
                    <?php endif; ?>
                    
                    <!-- Title -->
                    <h3 class="upg-pricing-title"><?php echo esc_html($plan['title']); ?></h3>
                    
                    <?php if (!empty($plan['subtitle'])): ?>
                    <p class="upg-pricing-subtitle"><?php echo esc_html($plan['subtitle']); ?></p>
                    <?php endif; ?>
                    
                    <!-- Price -->
                    <div class="upg-pricing-price">
                        <span class="upg-price-main"><?php echo esc_html($plan['price_text']); ?></span>
                        <?php if (!empty($plan['price_monthly'])): ?>
                        <span class="upg-price-monthly"><?php echo esc_html($plan['price_monthly']); ?></span>
                        <?php endif; ?>
                    </div>
                    
                    <!-- Savings -->
                    <?php if (!empty($plan['savings'])): ?>
                    <div class="upg-pricing-savings"><?php echo esc_html($plan['savings']); ?></div>
                    <?php endif; ?>
                    
                    <!-- Features -->
                    <ul class="upg-pricing-features">
                        <?php foreach ($plan['features'] ?? [] as $feature): ?>
                        <li><?php echo esc_html($feature); ?></li>
                        <?php endforeach; ?>
                    </ul>
                    
                    <!-- CTA Button -->
                    <a href="<?php echo esc_url($offer_engine->get_checkout_url($key)); ?>" 
                       class="upg-btn <?php echo $highlight ? 'upg-btn-primary' : 'upg-btn-outline'; ?> upg-pricing-btn"
                       data-plan="<?php echo esc_attr($key); ?>"
                       onclick="upgOffers.selectPlan('<?php echo esc_js($key); ?>')">
                        Seç
                    </a>
                </div>
                <?php endforeach; ?>
            </div>
            
            <?php else: ?>
            <!-- ====================================== -->
            <!-- SINGLE PLAN (Original Layout)         -->
            <!-- ====================================== -->
            <div class="upg-features-grid">
                <?php foreach ($features as $feature): ?>
                <div class="upg-feature-item">
                    <span class="upg-feature-icon"><?php echo esc_html($feature['icon']); ?></span>
                    <div class="upg-feature-text">
                        <strong><?php echo esc_html($feature['title']); ?></strong>
                        <span><?php echo esc_html($feature['desc']); ?></span>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            
            <!-- Current Status (Free users) -->
            <div class="upg-status-box" id="upg-status-box">
                <span class="upg-status-label">Mevcut durumunuz:</span>
                <span class="upg-status-value">
                    <span class="upg-badge-free">FREE</span>
                    <span id="upg-remaining-text">2 afiş hakkınız kaldı</span>
                </span>
            </div>
            <?php endif; ?>
        </div>
        
        <?php if (!$has_multiple): ?>
        <!-- Footer (Only for single plan) -->
        <div class="upg-modal-footer">
            <a href="#" id="upg-btn-upgrade" class="upg-btn upg-btn-primary">
                🚀 Pro'ya Yükselt
            </a>
            <button type="button" class="upg-btn upg-btn-secondary" onclick="upgModal.close()">
                Daha sonra
            </button>
        </div>
        <?php else: ?>
        <!-- Footer (Multi-plan) -->
        <div class="upg-modal-footer upg-modal-footer-compact">
            <button type="button" class="upg-btn upg-btn-link" onclick="upgModal.close()">
                Daha sonra karar vereceğim
            </button>
        </div>
        <?php endif; ?>
        
        <!-- Trust badges -->
        <div class="upg-trust-badges">
            <span>🔒 Güvenli Ödeme</span>
            <span>💳 Kredi Kartı / Havale</span>
            <span>↩️ 14 Gün İade Garantisi</span>
        </div>
    </div>
</div>

<!-- Inline Upgrade Prompt (generator form içinde) -->
<template id="upg-inline-prompt-template">
    <div class="upg-inline-prompt">
        <div class="upg-inline-prompt-icon">⚡</div>
        <div class="upg-inline-prompt-content">
            <strong class="upg-inline-prompt-title"></strong>
            <p class="upg-inline-prompt-desc"></p>
        </div>
        <a href="#" class="upg-btn upg-btn-small upg-btn-primary upg-inline-upgrade-btn">
            Pro'ya Yükselt
        </a>
    </div>
</template>

<!-- Pro Value Toast Container (JS tarafından kullanılır) -->
<div id="upg-pro-value-container" aria-live="polite" aria-atomic="true"></div>

<?php
/**
 * Pro kullanıcı için değer göstergesi inline badge'leri
 * Render sonrası gerçek metriklere göre gösterilir
 */
if ($funnel->is_pro()): ?>
<template id="upg-pro-value-template">
    <div class="upg-pro-value-inline">
        <div class="upg-pro-value-header">
            <span class="upg-pro-badge">✨ PRO</span>
            <span class="upg-pro-value-title">Avantajlarınız</span>
        </div>
        <div class="upg-pro-value-badges" id="upg-dynamic-value-badges">
            <!-- JS tarafından doldurulur -->
        </div>
    </div>
</template>
<style>
    .upg-pro-value-inline {
        background: linear-gradient(145deg, rgba(102, 126, 234, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
        border: 1px solid rgba(102, 126, 234, 0.2);
        border-radius: 12px;
        padding: 14px 16px;
        margin: 12px 0;
    }
    .upg-pro-value-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
    }
    .upg-pro-badge {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .upg-pro-value-title {
        color: #64748b;
        font-size: 12px;
        font-weight: 500;
    }
    .upg-pro-value-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
</style>
<?php endif; ?>

