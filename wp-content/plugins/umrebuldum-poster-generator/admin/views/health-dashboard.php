<?php
/**
 * System Health Dashboard View
 * 
 * Read-only dashboard showing system status from /umrebuldum/v1/health endpoint.
 * 
 * @package Umrebuldum\Poster
 */

defined('ABSPATH') || exit;
?>
<div class="wrap">
    <h1>🩺 Sistem Durumu</h1>
    
    <p class="description">
        Umrebuldum Poster Generator sistem sağlık durumu.
        <button type="button" id="upg-health-refresh" class="button button-secondary" style="margin-left: 10px;">
            🔄 Yenile
        </button>
    </p>
    
    <!-- Loading State -->
    <div id="upg-health-loading" class="upg-health-loading">
        <span class="spinner is-active" style="float: none;"></span>
        Sistem durumu yükleniyor...
    </div>
    
    <!-- Error State -->
    <div id="upg-health-error" class="upg-notice upg-notice-error" style="display: none;">
        <p><strong>Hata:</strong> <span id="upg-health-error-message"></span></p>
    </div>
    
    <!-- Health Content -->
    <div id="upg-health-content" style="display: none;">
        
        <!-- Status Badge -->
        <div id="upg-status-banner" class="upg-status-banner">
            <span id="upg-status-badge" class="upg-status-badge"></span>
            <span id="upg-status-text"></span>
            <small id="upg-status-timestamp" style="margin-left: 15px; color: #666;"></small>
        </div>
        
        <!-- Issues (if any) -->
        <div id="upg-issues-container" class="upg-notice upg-notice-warning" style="display: none; margin-top: 15px;">
            <strong>⚠️ Tespit Edilen Sorunlar:</strong>
            <ul id="upg-issues-list" style="margin: 5px 0 0 20px;"></ul>
        </div>
        
        <!-- Actionable Insights -->
        <div id="upg-insights-container" class="upg-card" style="display: none; margin-top: 20px; border-left: 4px solid #2271b1;">
            <h2 style="margin-top:0;">🧠 Öneriler & Aksiyonlar</h2>
            <div id="upg-insights-list"></div>
        </div>
        
        <!-- Cards Grid -->
        <div class="upg-health-grid" style="margin-top: 20px;">
            
            <!-- Core Status Card -->
            <div class="upg-card">
                <h2>🖥️ Sistem</h2>
                <table class="form-table upg-health-table">
                    <tr>
                        <th>Plugin Versiyonu</th>
                        <td id="upg-core-version">-</td>
                    </tr>
                    <tr>
                        <th>PHP Versiyonu</th>
                        <td id="upg-core-php">-</td>
                    </tr>
                    <tr>
                        <th>WordPress</th>
                        <td id="upg-core-wp">-</td>
                    </tr>
                    <tr>
                        <th>Memory Limit</th>
                        <td id="upg-core-memory">-</td>
                    </tr>
                    <tr>
                        <th>GD Extension</th>
                        <td id="upg-core-gd">-</td>
                    </tr>
                    <tr>
                        <th>WebP Desteği</th>
                        <td id="upg-core-webp">-</td>
                    </tr>
                </table>
            </div>
            
            <!-- Cache Health Card -->
            <div class="upg-card">
                <h2>📁 Cache</h2>
                <table class="form-table upg-health-table">
                    <tr>
                        <th>Dizin Durumu</th>
                        <td id="upg-cache-dir">-</td>
                    </tr>
                    <tr>
                        <th>Yazılabilir</th>
                        <td id="upg-cache-writable">-</td>
                    </tr>
                    <tr>
                        <th>Toplam Dosya</th>
                        <td id="upg-cache-files">-</td>
                    </tr>
                    <tr>
                        <th>Toplam Boyut</th>
                        <td id="upg-cache-size">-</td>
                    </tr>
                    <tr>
                        <th>En Eski Dosya</th>
                        <td id="upg-cache-oldest">-</td>
                    </tr>
                </table>
            </div>
            
            <!-- Performance Card -->
            <div class="upg-card">
                <h2>⚡ Performans (Bugün)</h2>
                <table class="form-table upg-health-table">
                    <tr>
                        <th>Toplam Render</th>
                        <td id="upg-perf-renders">-</td>
                    </tr>
                    <tr>
                        <th>Cache Hit Oranı</th>
                        <td id="upg-perf-cache-ratio">-</td>
                    </tr>
                    <tr>
                        <th>Ort. Render Süresi</th>
                        <td id="upg-perf-avg-time">-</td>
                    </tr>
                </table>
            </div>
            
            <!-- Errors Card -->
            <div class="upg-card">
                <h2>❌ Hatalar (Bugün)</h2>
                <table class="form-table upg-health-table">
                    <tr>
                        <th>Toplam Hata</th>
                        <td id="upg-errors-total">-</td>
                    </tr>
                    <tr>
                        <th>Kritik Hatalar</th>
                        <td id="upg-errors-critical">-</td>
                    </tr>
                    <tr>
                        <th>Hata Dağılımı</th>
                        <td id="upg-errors-types">-</td>
                    </tr>
                </table>
            </div>
            
            <!-- Monetization Card -->
            <div class="upg-card">
                <h2>💳 Monetizasyon</h2>
                <table class="form-table upg-health-table">
                    <tr>
                        <th>WooCommerce</th>
                        <td id="upg-money-woo">-</td>
                    </tr>
                    <tr>
                        <th>Subscriptions</th>
                        <td id="upg-money-subs">-</td>
                    </tr>
                    <tr>
                        <th>Pro Product ID</th>
                        <td id="upg-money-product">-</td>
                    </tr>
                    <tr>
                        <th>Pro Kullanıcı</th>
                        <td id="upg-money-pro-users">-</td>
                    </tr>
                </table>
            </div>
            
        </div>
    </div>
</div>

<style>
.upg-health-loading {
    padding: 20px;
    background: #fff;
    border: 1px solid #ccd0d4;
    margin-top: 15px;
}

.upg-status-banner {
    padding: 15px 20px;
    background: #fff;
    border: 1px solid #ccd0d4;
    border-left-width: 4px;
    margin-top: 15px;
}

.upg-status-banner.status-ok {
    border-left-color: #46b450;
}

.upg-status-banner.status-degraded {
    border-left-color: #ffb900;
}

.upg-status-banner.status-fail {
    border-left-color: #dc3232;
}

.upg-status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 14px;
    margin-right: 10px;
}

.upg-status-badge.status-ok {
    background: #46b450;
    color: #fff;
}

.upg-status-badge.status-degraded {
    background: #ffb900;
    color: #23282d;
}

.upg-status-badge.status-fail {
    background: #dc3232;
    color: #fff;
}

.upg-health-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
}

.upg-health-table th {
    padding: 8px 10px 8px 0;
    width: 140px;
    font-weight: 500;
}

.upg-health-table td {
    padding: 8px 0;
}

.upg-notice {
    padding: 12px;
    border-left: 4px solid;
    background: #fff;
}

.upg-notice-error {
    border-left-color: #dc3232;
}

.upg-notice-warning {
    border-left-color: #ffb900;
}

.upg-badge-ok {
    color: #46b450;
}

.upg-badge-fail {
    color: #dc3232;
}

.upg-badge-warn {
    color: #ffb900;
}
</style>
