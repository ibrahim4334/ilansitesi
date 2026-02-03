/**
 * Umrebuldum Poster Generator - Admin Health Dashboard
 * 
 * Fetches /umrebuldum/v1/health and renders data.
 * Read-only, manual refresh only.
 */
(function () {
    'use strict';

    // Check if we have the config
    if (typeof upgHealth === 'undefined') {
        console.error('upgHealth config not found');
        return;
    }

    // DOM Elements
    const elements = {
        loading: document.getElementById('upg-health-loading'),
        error: document.getElementById('upg-health-error'),
        errorMessage: document.getElementById('upg-health-error-message'),
        content: document.getElementById('upg-health-content'),
        refreshBtn: document.getElementById('upg-health-refresh'),
        statusBanner: document.getElementById('upg-status-banner'),
        statusBadge: document.getElementById('upg-status-badge'),
        statusText: document.getElementById('upg-status-text'),
        statusTimestamp: document.getElementById('upg-status-timestamp'),
        issuesContainer: document.getElementById('upg-issues-container'),
        issuesList: document.getElementById('upg-issues-list')
    };

    /**
     * Show loading state
     */
    function showLoading() {
        elements.loading.style.display = 'block';
        elements.error.style.display = 'none';
        elements.content.style.display = 'none';
    }

    /**
     * Show error state
     */
    function showError(message) {
        elements.loading.style.display = 'none';
        elements.error.style.display = 'block';
        elements.content.style.display = 'none';
        elements.errorMessage.textContent = message || 'Bilinmeyen hata';
    }

    /**
     * Show content
     */
    function showContent() {
        elements.loading.style.display = 'none';
        elements.error.style.display = 'none';
        elements.content.style.display = 'block';
    }

    /**
     * Safe get nested value
     */
    function get(obj, path, defaultValue) {
        if (!obj) return defaultValue;
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result === null || result === undefined) return defaultValue;
            result = result[key];
        }
        return result !== undefined ? result : defaultValue;
    }

    /**
     * Format boolean as icon
     */
    function formatBool(value, trueClass, falseClass) {
        trueClass = trueClass || 'upg-badge-ok';
        falseClass = falseClass || 'upg-badge-fail';
        if (value === true) {
            return '<span class="' + trueClass + '">✓ Evet</span>';
        } else if (value === false) {
            return '<span class="' + falseClass + '">✗ Hayır</span>';
        }
        return '-';
    }

    /**
     * Format timestamp
     */
    function formatTimestamp(ts) {
        if (!ts) return '-';
        const date = new Date(ts * 1000);
        return date.toLocaleString('tr-TR');
    }

    /**
     * Format error types object
     */
    function formatErrorTypes(types) {
        if (!types || Object.keys(types).length === 0) {
            return '<span class="upg-badge-ok">Yok</span>';
        }

        const items = [];
        for (const key in types) {
            if (types.hasOwnProperty(key)) {
                items.push(key + ': ' + types[key]);
            }
        }
        return items.join(', ');
    }

    /**
     * Render health data
     */
    function renderHealth(data) {
        // Status banner
        const status = get(data, 'status', 'UNKNOWN').toLowerCase();
        elements.statusBanner.className = 'upg-status-banner status-' + status;
        elements.statusBadge.className = 'upg-status-badge status-' + status;
        elements.statusBadge.textContent = get(data, 'status', 'UNKNOWN');

        const statusMessages = {
            'ok': 'Tüm sistemler çalışıyor',
            'degraded': 'Sistem çalışıyor ancak performans sorunu var',
            'fail': 'Kritik sistem hatası tespit edildi'
        };
        elements.statusText.textContent = statusMessages[status] || '';
        elements.statusTimestamp.textContent = 'Son güncelleme: ' + formatTimestamp(get(data, 'timestamp'));

        // Issues
        const issues = get(data, 'issues', []);
        if (issues.length > 0) {
            elements.issuesContainer.style.display = 'block';
            elements.issuesList.innerHTML = issues.map(function (issue) {
                return '<li>' + escapeHtml(issue) + '</li>';
            }).join('');
        } else {
            elements.issuesContainer.style.display = 'none';
        }

        // Insights (New)
        const insights = get(data, 'insights', []);
        const insightsContainer = document.getElementById('upg-insights-container');
        const insightsList = document.getElementById('upg-insights-list');

        if (insightsContainer && insightsList) {
            if (insights.length > 0) {
                insightsContainer.style.display = 'block';
                insightsList.innerHTML = insights.map(function (item) {
                    const typeClass = 'insight-' + (item.type || 'info');
                    const badgeClass = 'upg-badge-' + (item.type === 'critical' ? 'fail' : (item.type === 'warning' ? 'warn' : 'ok'));
                    const badgeText = item.type === 'critical' ? 'KRİTİK' : (item.type === 'warning' ? 'DİKKAT' : 'FIRSAT');

                    return `
                        <div class="insight-item ${typeClass}" style="margin-bottom: 10px; padding: 10px; border-left: 3px solid #ccc; background: #f9f9f9;">
                            <div style="font-weight:600; margin-bottom: 4px;">
                                <span class="${badgeClass}" style="font-size: 11px; border: 1px solid; padding: 1px 4px; border-radius: 3px; margin-right: 5px;">${badgeText}</span>
                                ${escapeHtml(item.title)}
                            </div>
                            <div style="font-size: 13px; color: #555;">${escapeHtml(item.message)}</div>
                            <div style="font-size: 12px; margin-top: 4px; color: #2271b1;">👉 ${escapeHtml(item.action)}</div>
                        </div>
                    `;
                }).join('');
            } else {
                insightsContainer.style.display = 'none';
            }
        }

        // Core status
        setText('upg-core-version', get(data, 'core.plugin_version', '-'));
        setText('upg-core-php', get(data, 'core.php_version', '-'));
        setText('upg-core-wp', get(data, 'core.wp_version', '-'));
        setText('upg-core-memory', get(data, 'core.memory_limit', '-'));
        setHtml('upg-core-gd', formatBool(get(data, 'core.gd_available')));
        setHtml('upg-core-webp', formatBool(get(data, 'core.webp_supported')));

        // Cache health
        setHtml('upg-cache-dir', formatBool(get(data, 'cache.cache_dir_exists')));
        setHtml('upg-cache-writable', formatBool(get(data, 'cache.cache_writable')));
        setText('upg-cache-files', get(data, 'cache.cache_total_files', 0));
        setText('upg-cache-size', get(data, 'cache.cache_total_size_mb', 0) + ' MB');

        const oldestHours = get(data, 'cache.oldest_cache_file_age_hours', 0);
        const oldestText = oldestHours > 24
            ? Math.round(oldestHours / 24) + ' gün'
            : Math.round(oldestHours) + ' saat';
        setText('upg-cache-oldest', oldestHours > 0 ? oldestText : '-');

        // Performance
        setText('upg-perf-renders', get(data, 'performance.total_renders_today', 0));
        setText('upg-perf-cache-ratio', get(data, 'performance.cache_hit_ratio', 0) + '%');
        setText('upg-perf-avg-time', get(data, 'performance.avg_render_time_ms', 0) + ' ms');

        // Errors
        const totalErrors = get(data, 'errors.total_errors', 0);
        const criticalErrors = get(data, 'errors.critical_errors', 0);

        setHtml('upg-errors-total', totalErrors > 0
            ? '<span class="upg-badge-warn">' + totalErrors + '</span>'
            : '<span class="upg-badge-ok">0</span>');
        setHtml('upg-errors-critical', criticalErrors > 0
            ? '<span class="upg-badge-fail">' + criticalErrors + '</span>'
            : '<span class="upg-badge-ok">0</span>');
        setHtml('upg-errors-types', formatErrorTypes(get(data, 'errors.errors_by_type', {})));

        // Monetization
        setHtml('upg-money-woo', formatBool(get(data, 'monetization.woo_active')));
        setHtml('upg-money-subs', formatBool(get(data, 'monetization.subscriptions_active')));
        setHtml('upg-money-product', get(data, 'monetization.pro_product_id_set')
            ? '<span class="upg-badge-ok">✓ Tanımlı</span>'
            : '<span class="upg-badge-warn">⚠ Tanımsız</span>');
        setText('upg-money-pro-users', get(data, 'monetization.pro_users_count', 0));

        showContent();
    }

    /**
     * Set text content safely
     */
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value !== null && value !== undefined ? value : '-';
    }

    /**
     * Set HTML content safely
     */
    function setHtml(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html || '-';
    }

    /**
     * Escape HTML
     */
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Fetch health data
     */
    function fetchHealth() {
        showLoading();

        fetch(upgHealth.endpoint, {
            method: 'GET',
            headers: {
                'X-WP-Nonce': upgHealth.nonce
            }
        })
            .then(function (response) {
                if (!response.ok && response.status !== 503) {
                    throw new Error('HTTP ' + response.status);
                }
                return response.json();
            })
            .then(function (data) {
                renderHealth(data);
            })
            .catch(function (error) {
                showError(error.message || 'Bağlantı hatası');
            });
    }

    // Refresh button handler
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', fetchHealth);
    }

    // Initial fetch
    fetchHealth();

})();
