/**
 * Upgrade Modal - JavaScript
 * 
 * Saf JavaScript, framework yok
 * Access Control error kodlarını dinleyerek modal tetikler
 */

(function () {
    'use strict';

    // Global modal controller
    window.upgModal = {

        // Modal element
        el: null,

        // Funnel data (wp_localize_script'ten)
        data: window.upgFunnel || {},

        /**
         * Initialize
         */
        init: function () {
            this.el = document.getElementById('upg-upgrade-modal');

            if (!this.el) {
                console.warn('UPG: Upgrade modal not found');
                return;
            }

            this.bindEvents();
            this.updateRemainingText();

            console.log('UPG: Upgrade modal initialized', this.data);
        },

        /**
         * Event listeners
         */
        bindEvents: function () {
            var self = this;

            // Overlay click = close
            this.el.addEventListener('click', function (e) {
                if (e.target === self.el) {
                    self.close();
                }
            });

            // ESC key = close
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && self.isOpen()) {
                    self.close();
                }
            });

            // Upgrade button
            var upgradeBtn = document.getElementById('upg-btn-upgrade');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    self.goToCheckout();
                });
            }

            // Listen to AJAX errors
            this.interceptAjax();
        },

        /**
         * Intercept AJAX calls for upgrade triggers
         */
        interceptAjax: function () {
            var self = this;

            // jQuery AJAX intercept (WP Admin uses jQuery)
            if (typeof jQuery !== 'undefined') {
                jQuery(document).ajaxComplete(function (event, xhr, settings) {
                    try {
                        var response = JSON.parse(xhr.responseText);
                        self.checkResponse(response);
                    } catch (e) {
                        // Not JSON, ignore
                    }
                });
            }

            // Fetch API intercept (for modern code)
            var originalFetch = window.fetch;
            window.fetch = function () {
                return originalFetch.apply(this, arguments).then(function (response) {
                    // Clone response to read it
                    var clone = response.clone();
                    clone.json().then(function (data) {
                        self.checkResponse(data);
                    }).catch(function () { });
                    return response;
                });
            };
        },

        /**
         * Check API response for upgrade triggers
         */
        checkResponse: function (response) {
            if (!response) return;

            // Direct upgrade_required flag
            if (response.upgrade_required === true) {
                this.show(response.code || 'generic');
                return;
            }

            // WP_Error format
            if (response.code && this.data.triggers) {
                if (this.data.triggers.indexOf(response.code) !== -1) {
                    this.show(response.code);
                }
            }

            // data.code format
            if (response.data && response.data.code && this.data.triggers) {
                if (this.data.triggers.indexOf(response.data.code) !== -1) {
                    this.show(response.data.code);
                }
            }
        },

        /**
         * Show modal with specific type
         */
        show: function (type) {
            if (!this.el) return;

            // Update content based on type
            this.updateContent(type);

            // Show
            this.el.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Focus management
            var closeBtn = this.el.querySelector('.upg-modal-close');
            if (closeBtn) closeBtn.focus();

            // Analytics event (if available)
            this.trackEvent('modal_shown', type);
        },

        /**
         * Close modal
         */
        close: function () {
            if (!this.el) return;

            this.el.style.display = 'none';
            document.body.style.overflow = '';

            this.trackEvent('modal_closed');
        },

        /**
         * Check if modal is open
         */
        isOpen: function () {
            return this.el && this.el.style.display === 'flex';
        },

        /**
         * Update modal content based on type
         */
        updateContent: function (type) {
            var i18n = this.data.i18n || {};
            var title = document.getElementById('upg-modal-title');
            var desc = document.getElementById('upg-modal-desc');

            switch (type) {
                case 'quota_exceeded':
                    if (title) title.textContent = i18n.title_quota || 'Afiş Limitinize Ulaştınız!';
                    if (desc) desc.textContent = i18n.desc_quota || 'Pro\'ya yükselterek sınırsız afiş üretin!';
                    break;

                case 'template_restricted':
                    if (title) title.textContent = i18n.title_template || 'Pro Template!';
                    if (desc) desc.textContent = i18n.desc_template || 'Bu şablon Pro üyelere özel.';
                    break;

                case 'watermark_request':
                    if (title) title.textContent = i18n.title_watermark || 'Watermark\'ı Kaldırın!';
                    if (desc) desc.textContent = i18n.desc_watermark || 'Pro üyeler watermark\'sız afişler üretebilir.';
                    break;

                case 'login_required':
                    if (title) title.textContent = i18n.title_login || 'Giriş Yapın';
                    if (desc) desc.textContent = i18n.desc_login || 'Afiş üretmek için giriş yapın.';
                    // Change button to login
                    var upgradeBtn = document.getElementById('upg-btn-upgrade');
                    if (upgradeBtn) {
                        upgradeBtn.textContent = '🔑 ' + (i18n.btn_login || 'Giriş Yap');
                    }
                    break;

                default:
                    if (title) title.textContent = 'Pro\'ya Yükselt';
                    if (desc) desc.textContent = 'Tüm özelliklere erişim için Pro\'ya yükseltin!';
            }
        },

        /**
         * Update remaining quota text
         */
        updateRemainingText: function () {
            var remaining = this.data.remaining || 0;
            var el = document.getElementById('upg-remaining-text');

            if (el) {
                if (remaining <= 0) {
                    el.textContent = 'Afiş hakkınız kalmadı';
                } else if (remaining === 1) {
                    el.textContent = 'Son 1 afiş hakkınız kaldı!';
                } else {
                    el.textContent = remaining + ' afiş hakkınız kaldı';
                }
            }

            // Status box color
            var statusBox = document.getElementById('upg-status-box');
            if (statusBox) {
                if (remaining <= 0) {
                    statusBox.style.background = '#f8d7da';
                    statusBox.style.borderColor = '#dc3545';
                } else if (remaining === 1) {
                    statusBox.style.background = '#fff3cd';
                    statusBox.style.borderColor = '#ffc107';
                }
            }
        },

        /**
         * Navigate to checkout
         */
        goToCheckout: function () {
            var url;

            if (this.data.isLoggedIn) {
                url = this.data.checkoutUrl;
            } else {
                url = this.data.loginUrl;
            }

            if (url) {
                this.trackEvent('checkout_clicked');
                window.location.href = url;
            }
        },

        /**
         * Track analytics event
         */
        trackEvent: function (action, label) {
            // Google Analytics 4
            if (typeof gtag === 'function') {
                gtag('event', action, {
                    'event_category': 'upgrade_funnel',
                    'event_label': label || ''
                });
            }

            // Console log for debug
            console.log('UPG Event:', action, label);
        },

        /**
         * Manual trigger (can be called from other scripts)
         */
        trigger: function (type) {
            this.show(type || 'generic');
        }
    };

    // =========================================
    // INLINE PROMPT HELPER
    // =========================================

    window.upgPrompt = {

        /**
         * Insert inline prompt into target element
         */
        insert: function (targetSelector, type, title, desc) {
            var target = document.querySelector(targetSelector);
            if (!target) return;

            var template = document.getElementById('upg-inline-prompt-template');
            if (!template) return;

            var clone = template.content.cloneNode(true);
            var prompt = clone.querySelector('.upg-inline-prompt');

            if (title) {
                prompt.querySelector('.upg-inline-prompt-title').textContent = title;
            }
            if (desc) {
                prompt.querySelector('.upg-inline-prompt-desc').textContent = desc;
            }

            // Upgrade button click
            var btn = prompt.querySelector('.upg-inline-upgrade-btn');
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                upgModal.trigger(type);
            });

            target.appendChild(clone);
        },

        /**
         * Show quota warning in target
         */
        showQuotaWarning: function (targetSelector) {
            var remaining = window.upgFunnel.remaining || 0;

            if (remaining <= 1 && remaining >= 0) {
                this.insert(
                    targetSelector,
                    'quota_exceeded',
                    remaining === 0 ? 'Afiş limitinize ulaştınız!' : 'Son afiş hakkınız!',
                    'Pro\'ya yükseltip sınırsız afiş üretin.'
                );
            }
        }
    };

    // =========================================
    // OFFER ENGINE - Multi-Plan Handler
    // =========================================

    window.upgOffers = {

        // Offer data (wp_localize_script'ten)
        data: window.upgOfferEngine || {},

        /**
         * Plan seç ve checkout'a git
         */
        selectPlan: function (planKey) {
            var plans = this.data.plans || {};
            var plan = plans[planKey];

            if (!plan) {
                console.error('UPG: Plan not found:', planKey);
                return;
            }

            // Track event
            this.trackPlanSelection(planKey);

            // View count tracking (AJAX)
            this.trackModalView();

            // Checkout'a yönlendir
            var checkoutUrl = plan.checkout_url;

            if (window.upgFunnel && !window.upgFunnel.isLoggedIn) {
                // Login gerekli
                checkoutUrl = window.upgFunnel.loginUrl + '&redirect_to=' + encodeURIComponent(checkoutUrl);
            }

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            }
        },

        /**
         * Modal görüntüleme sayısını artır
         */
        trackModalView: function () {
            if (!this.data.nonce) return;

            var formData = new FormData();
            formData.append('action', 'upg_track_modal_view');
            formData.append('nonce', this.data.nonce);

            fetch(window.ajaxurl || '/wp-admin/admin-ajax.php', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            }).catch(function () { });
        },

        /**
         * Plan seçimi analytics
         */
        trackPlanSelection: function (planKey) {
            // Google Analytics 4
            if (typeof gtag === 'function') {
                gtag('event', 'select_plan', {
                    'event_category': 'upgrade_funnel',
                    'event_label': planKey,
                    'plan': planKey
                });
            }

            // Facebook Pixel
            if (typeof fbq === 'function') {
                fbq('track', 'InitiateCheckout', {
                    content_name: planKey
                });
            }

            console.log('UPG: Plan selected:', planKey);
        },

        /**
         * Önerilen planı vurgula
         */
        highlightRecommended: function () {
            var recommended = this.data.recommended;
            if (!recommended) return;

            var card = document.querySelector('[data-plan="' + recommended + '"]');
            if (card) {
                card.classList.add('upg-pricing-card-highlight');
            }
        },

        /**
         * View count'a göre badge güncelle
         */
        updateSmartBadges: function () {
            var viewCount = this.data.view_count || 0;

            if (viewCount >= 4) {
                // "Son teklif" badge'i ekle
                var yearlyCard = document.querySelector('[data-plan="pro_yearly"]');
                if (yearlyCard) {
                    var badge = yearlyCard.querySelector('.upg-pricing-badge');
                    if (badge) {
                        badge.textContent = '🔥 Son Teklif!';
                        badge.style.background = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
                    }
                }
            }
        },

        /**
         * Initialize
         */
        init: function () {
            this.data = window.upgOfferEngine || {};

            if (Object.keys(this.data).length === 0) {
                return; // Single plan mode
            }

            this.highlightRecommended();
            this.updateSmartBadges();

            console.log('UPG: Offer engine initialized', this.data);
        }
    };

    // =========================================
    // FRICTION HANDLER - Free Kullanıcı Bilinçli Gecikme
    // Amaç: Sinir bozmak değil, fark ettirmek
    // =========================================

    window.upgFriction = {

        data: window.upgUsage || {},

        // Friction ayarları
        config: {
            threshold: 3,           // Kaçıncı render'dan sonra başlasın
            delayMs: 800,           // Gecikme süresi (ms)
            progressDuration: 1200, // Progress bar animasyon süresi (ms)
        },

        // Loading mesajları (rastgele seçilir)
        messages: [
            { text: 'Afişiniz hazırlanıyor...', subtext: 'Pro ile anında oluştur 🚀' },
            { text: 'Sıranız bekleniyor...', subtext: 'Pro üyeler öncelikli! ⚡' },
            { text: 'Render kuyruğunda...', subtext: 'Pro ile kuyruk yok 🎯' },
            { text: 'İşleniyor...', subtext: 'Pro ile 30x daha hızlı cache ✨' },
        ],

        /**
         * Render işlemini friction ile wrap et
         * @param {Function} renderFn - Gerçek render fonksiyonu (AJAX call)
         * @param {Object} options - Seçenekler
         */
        wrapRender: function (renderFn, options) {
            var self = this;
            options = options || {};

            var friction = this.data.friction || {};
            var totalRenders = this.data.total_renders || 0;
            var threshold = options.threshold || this.config.threshold;

            // Pro kullanıcıya veya threshold altındaysa friction yok
            if (this.data.is_pro || !friction.apply || totalRenders < threshold) {
                console.log('UPG Friction: Skipped (Pro:', this.data.is_pro, 'Renders:', totalRenders, ')');
                return renderFn();
            }

            console.log('UPG Friction: Applying for render #' + (totalRenders + 1));

            // Friction uygula
            var delay = friction.delay || this.config.delayMs;
            var upgradeUrl = friction.upgrade_url || '#';

            // Progress loader göster
            this.showProgressLoader(upgradeUrl, delay);

            // Gerçek render'ı başlat (arka planda)
            var renderPromise = this.executeRender(renderFn);

            // İkisi de bitince devam et
            return Promise.all([
                renderPromise,
                this.waitForAnimation(delay)
            ]).then(function (results) {
                self.hideProgressLoader();
                return results[0]; // Render sonucu
            }).catch(function (error) {
                self.hideProgressLoader();
                throw error;
            });
        },

        /**
         * Render'ı çalıştır
         */
        executeRender: function (renderFn) {
            return new Promise(function (resolve, reject) {
                try {
                    var result = renderFn();
                    if (result && typeof result.then === 'function') {
                        result.then(resolve).catch(reject);
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        },

        /**
         * Animasyon bitene kadar bekle
         */
        waitForAnimation: function (duration) {
            return new Promise(function (resolve) {
                setTimeout(resolve, duration);
            });
        },

        /**
         * Progress bar ile loader göster
         */
        showProgressLoader: function (upgradeUrl, duration) {
            // Mevcut loader varsa kaldır
            this.hideProgressLoader();

            // Rastgele mesaj seç
            var msgIndex = Math.floor(Math.random() * this.messages.length);
            var msgData = this.messages[msgIndex];

            var loader = document.createElement('div');
            loader.id = 'upg-friction-loader';
            loader.className = 'upg-friction-active';
            loader.innerHTML =
                '<div class="upg-friction-overlay">' +
                '<div class="upg-friction-card">' +
                // Header
                '<div class="upg-friction-header">' +
                '<div class="upg-friction-icon">🎨</div>' +
                '<div class="upg-friction-text">' + msgData.text + '</div>' +
                '</div>' +
                // Progress bar
                '<div class="upg-friction-progress-wrap">' +
                '<div class="upg-friction-progress-bar">' +
                '<div class="upg-friction-progress-fill"></div>' +
                '</div>' +
                '<div class="upg-friction-progress-percent">0%</div>' +
                '</div>' +
                // Pro CTA
                '<div class="upg-friction-cta">' +
                '<div class="upg-friction-cta-text">' + msgData.subtext + '</div>' +
                '<a href="' + upgradeUrl + '" class="upg-friction-cta-btn">' +
                '⚡ Pro\'ya Geç - Anında Üret!' +
                '</a>' +
                '</div>' +
                // Comparison stats
                '<div class="upg-friction-comparison">' +
                '<div class="upg-friction-stat upg-friction-stat-free">' +
                '<span class="upg-friction-stat-icon">🐢</span>' +
                '<span class="upg-friction-stat-label">Free</span>' +
                '<span class="upg-friction-stat-value">~2sn</span>' +
                '</div>' +
                '<div class="upg-friction-stat upg-friction-stat-pro">' +
                '<span class="upg-friction-stat-icon">🚀</span>' +
                '<span class="upg-friction-stat-label">Pro</span>' +
                '<span class="upg-friction-stat-value">Anında!</span>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';

            document.body.appendChild(loader);
            document.body.style.overflow = 'hidden';

            // CSS inject
            this.injectStyles();

            // Progress animasyonu başlat
            this.animateProgress(duration);
        },

        /**
         * Progress bar animasyonu
         */
        animateProgress: function (duration) {
            var startTime = Date.now();
            var progressFill = document.querySelector('.upg-friction-progress-fill');
            var progressPercent = document.querySelector('.upg-friction-progress-percent');

            if (!progressFill || !progressPercent) return;

            var self = this;

            function updateProgress() {
                var elapsed = Date.now() - startTime;
                var progress = Math.min((elapsed / duration) * 100, 100);

                progressFill.style.width = progress + '%';
                progressPercent.textContent = Math.round(progress) + '%';

                // Dinamik renk değişimi
                if (progress < 30) {
                    progressFill.style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)';
                } else if (progress < 70) {
                    progressFill.style.background = 'linear-gradient(90deg, #764ba2 0%, #f59e0b 100%)';
                } else {
                    progressFill.style.background = 'linear-gradient(90deg, #f59e0b 0%, #22c55e 100%)';
                }

                if (progress < 100) {
                    requestAnimationFrame(updateProgress);
                } else {
                    // Tamamlandı efekti
                    progressPercent.textContent = '✓';
                    progressPercent.style.color = '#22c55e';
                }
            }

            requestAnimationFrame(updateProgress);
        },

        /**
         * Friction loader gizle
         */
        hideProgressLoader: function () {
            var loader = document.getElementById('upg-friction-loader');
            if (loader) {
                loader.classList.add('upg-friction-hiding');
                setTimeout(function () {
                    loader.remove();
                    document.body.style.overflow = '';
                }, 200);
            }
        },

        /**
         * CSS styles inject
         */
        injectStyles: function () {
            if (document.getElementById('upg-friction-styles')) return;

            var styles = document.createElement('style');
            styles.id = 'upg-friction-styles';
            styles.textContent = `
                .upg-friction-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    animation: upgFrictionFadeIn 0.2s ease;
                }
                
                @keyframes upgFrictionFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .upg-friction-card {
                    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
                    border-radius: 16px;
                    padding: 28px 32px;
                    max-width: 380px;
                    width: 90%;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    animation: upgFrictionSlideUp 0.3s ease;
                }
                
                @keyframes upgFrictionSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .upg-friction-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .upg-friction-icon {
                    font-size: 32px;
                    animation: upgFrictionPulse 1.5s ease-in-out infinite;
                }
                
                @keyframes upgFrictionPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                .upg-friction-text {
                    color: #f8fafc;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .upg-friction-progress-wrap {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .upg-friction-progress-bar {
                    flex: 1;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .upg-friction-progress-fill {
                    height: 100%;
                    width: 0%;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    border-radius: 4px;
                    transition: width 0.1s linear;
                }
                
                .upg-friction-progress-percent {
                    color: #94a3b8;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 40px;
                    text-align: right;
                }
                
                .upg-friction-cta {
                    background: rgba(102, 126, 234, 0.1);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                .upg-friction-cta-text {
                    color: #c7d2fe;
                    font-size: 14px;
                    margin-bottom: 12px;
                }
                
                .upg-friction-cta-btn {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    padding: 10px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                }
                
                .upg-friction-cta-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                    color: #fff;
                }
                
                .upg-friction-comparison {
                    display: flex;
                    gap: 12px;
                }
                
                .upg-friction-stat {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 12px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                }
                
                .upg-friction-stat-free {
                    opacity: 0.6;
                }
                
                .upg-friction-stat-pro {
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                }
                
                .upg-friction-stat-icon {
                    font-size: 20px;
                    margin-bottom: 4px;
                }
                
                .upg-friction-stat-label {
                    color: #64748b;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .upg-friction-stat-value {
                    color: #f8fafc;
                    font-size: 14px;
                    font-weight: 600;
                    margin-top: 2px;
                }
                
                .upg-friction-stat-pro .upg-friction-stat-value {
                    color: #22c55e;
                }
                
                .upg-friction-hiding .upg-friction-card {
                    animation: upgFrictionSlideDown 0.2s ease forwards;
                }
                
                @keyframes upgFrictionSlideDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(20px); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Initialize
         */
        init: function () {
            this.data = window.upgUsage || {};

            // CSS inject (sayfa yüklendiğinde hazır olsun)
            this.injectStyles();

            if (this.data.friction && this.data.friction.apply) {
                console.log('UPG Friction: Active for free user (renders:', this.data.total_renders, ')');
            } else if (this.data.is_pro) {
                console.log('UPG Friction: Disabled (Pro user)');
            }
        },

        /**
         * Manual friction tetikleme (test için)
         */
        test: function (duration) {
            var self = this;
            duration = duration || 2000;
            this.showProgressLoader('#', duration);
            setTimeout(function () {
                self.hideProgressLoader();
            }, duration);
        }
    };

    // =========================================
    // VALUE SIGNALS - Pro "Hissedilen Değer" Göstergesi
    // Amaç: Ödediğini hissettirmek (churn azaltır)
    // Gerçek ölçüme dayalı
    // =========================================

    window.upgValueSignals = {

        // User data (localize'dan gelir)
        data: window.upgUsage || {},

        // Toast timeout referansı
        toastTimeout: null,

        // Referans değerler (Free tier karşılaştırması için)
        reference: {
            avg_render_ms: 500,   // Free kullanıcı ortalama render süresi
            free_quality: 60,     // Free kalite
            pro_quality: 85,      // Pro kalite
            free_cache_days: 1,   // Free cache süresi
            pro_cache_days: 30,   // Pro cache süresi
        },

        /**
         * Value signal badges göster
         * @param {Array} signals - [{icon, text, type, percent, color}]
         * @param {Element} container - Badge container (null: toast olarak göster)
         */
        show: function (signals, container) {
            if (!signals || signals.length === 0) {
                return;
            }

            var wrapper = document.createElement('div');
            wrapper.className = 'upg-value-signals';

            signals.forEach(function (signal) {
                var badge = document.createElement('span');
                badge.className = 'upg-value-badge upg-value-' + signal.type;
                if (signal.color) {
                    badge.style.borderColor = signal.color;
                    badge.style.color = signal.color;
                }
                badge.innerHTML = signal.icon + ' ' + signal.text;
                wrapper.appendChild(badge);
            });

            if (container) {
                container.appendChild(wrapper);
            } else {
                // Toast olarak göster
                this.showToast(signals);
            }
        },

        /**
         * Gelişmiş Toast notification
         */
        showToast: function (signals) {
            var self = this;

            // Mevcut toast varsa kaldır
            var existing = document.getElementById('upg-value-toast');
            if (existing) {
                existing.remove();
            }
            if (this.toastTimeout) {
                clearTimeout(this.toastTimeout);
            }

            // CSS inject
            this.injectStyles();

            var toast = document.createElement('div');
            toast.id = 'upg-value-toast';
            toast.className = 'upg-value-toast';

            var html = '' +
                '<div class="upg-toast-card">' +
                '<div class="upg-toast-header">' +
                '<span class="upg-toast-icon">✨</span>' +
                '<span class="upg-toast-title">Pro Avantajlarınız</span>' +
                '<button class="upg-toast-close" onclick="upgValueSignals.hideToast()">&times;</button>' +
                '</div>' +
                '<div class="upg-toast-body">';

            signals.forEach(function (signal) {
                html += '' +
                    '<div class="upg-toast-item">' +
                    '<span class="upg-toast-item-icon">' + signal.icon + '</span>' +
                    '<div class="upg-toast-item-content">' +
                    '<span class="upg-toast-item-text">' + signal.text + '</span>';

                // Progress bar (yüzde varsa)
                if (signal.percent !== undefined && signal.percent > 0) {
                    html += '<div class="upg-toast-item-bar">' +
                        '<div class="upg-toast-item-fill" style="width:' + Math.min(signal.percent, 100) + '%;background:' + (signal.color || '#22c55e') + '"></div>' +
                        '</div>';
                }

                html += '</div></div>';
            });

            html += '</div></div>';

            toast.innerHTML = html;
            document.body.appendChild(toast);

            // Animasyon ile göster
            requestAnimationFrame(function () {
                toast.classList.add('upg-toast-visible');
            });

            // Otomatik kapat (5 saniye)
            this.toastTimeout = setTimeout(function () {
                self.hideToast();
            }, 5000);
        },

        /**
         * Toast'u gizle
         */
        hideToast: function () {
            var toast = document.getElementById('upg-value-toast');
            if (toast) {
                toast.classList.remove('upg-toast-visible');
                toast.classList.add('upg-toast-hiding');
                setTimeout(function () {
                    toast.remove();
                }, 300);
            }
        },

        /**
         * Render response'dan signals hesapla ve göster
         * Gerçek ölçüme dayalı
         */
        handleRenderResponse: function (response) {
            // Sadece Pro kullanıcılarda göster
            if (!response || response.tier !== 'pro') {
                return;
            }

            var signals = [];
            var ref = this.reference;

            // 1. Cache hızı sinyali
            if (response.from_cache === true) {
                var currentMs = response.render_time_ms || 50;
                var savedMs = ref.avg_render_ms - currentMs;
                var speedBoost = Math.round((savedMs / ref.avg_render_ms) * 100);

                if (speedBoost > 10) {
                    signals.push({
                        icon: '⚡',
                        text: 'Cache ile %' + speedBoost + ' daha hızlı',
                        type: 'speed',
                        percent: speedBoost,
                        color: '#22c55e'
                    });
                }
            } else if (response.render_time_ms && response.render_time_ms < ref.avg_render_ms) {
                // Cache değil ama yine de hızlı
                var speedBoost = Math.round((1 - (response.render_time_ms / ref.avg_render_ms)) * 100);
                if (speedBoost > 20) {
                    signals.push({
                        icon: '🚀',
                        text: 'Pro önceliği ile %' + speedBoost + ' hızlı',
                        type: 'speed',
                        percent: speedBoost,
                        color: '#667eea'
                    });
                }
            }

            // 2. Dosya boyutu sinyali (WebP optimization)
            if (response.size_kb) {
                // PNG'ye göre WebP ~50% daha küçük
                var pngEstimate = response.size_kb * 2;
                var savedKb = pngEstimate - response.size_kb;
                var savedPercent = Math.round((savedKb / pngEstimate) * 100);

                if (savedPercent > 20) {
                    signals.push({
                        icon: '💾',
                        text: '%' + savedPercent + ' daha küçük dosya',
                        type: 'size',
                        percent: savedPercent,
                        color: '#f59e0b'
                    });
                }
            }

            // 3. Kalite sinyali
            var qualityBoost = Math.round(((ref.pro_quality / ref.free_quality) - 1) * 100);
            signals.push({
                icon: '✨',
                text: '%' + qualityBoost + ' yüksek kalite',
                type: 'quality',
                percent: qualityBoost,
                color: '#a855f7'
            });

            // 4. Cache TTL avantajı (ilk render değilse)
            if (response.cache_info && response.cache_info.remaining) {
                var remainingDays = Math.round(response.cache_info.remaining / 86400);
                if (remainingDays > 1) {
                    signals.push({
                        icon: '📅',
                        text: remainingDays + ' gün daha cache\'de',
                        type: 'cache',
                        percent: (remainingDays / 30) * 100,
                        color: '#06b6d4'
                    });
                }
            }

            // Max 3 sinyal göster
            if (signals.length > 3) {
                signals = signals.slice(0, 3);
            }

            // Eğer server'dan signals geldiyse, onları da ekle
            if (response.value_signals && response.value_signals.length > 0) {
                signals = response.value_signals.concat(signals).slice(0, 4);
            }

            if (signals.length > 0) {
                this.showToast(signals);
            }
        },

        /**
         * CSS styles inject
         */
        injectStyles: function () {
            if (document.getElementById('upg-value-styles')) return;

            var styles = document.createElement('style');
            styles.id = 'upg-value-styles';
            styles.textContent = `
                .upg-value-toast {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    z-index: 999998;
                    transform: translateX(120%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .upg-value-toast.upg-toast-visible {
                    transform: translateX(0);
                }
                
                .upg-value-toast.upg-toast-hiding {
                    transform: translateX(120%);
                }
                
                .upg-toast-card {
                    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
                    border-radius: 16px;
                    min-width: 280px;
                    max-width: 340px;
                    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.5),
                                0 0 0 1px rgba(255, 255, 255, 0.1);
                    overflow: hidden;
                }
                
                .upg-toast-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 14px 16px;
                    background: linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .upg-toast-icon {
                    font-size: 20px;
                    animation: upgToastPulse 2s ease-in-out infinite;
                }
                
                @keyframes upgToastPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                }
                
                .upg-toast-title {
                    flex: 1;
                    color: #f8fafc;
                    font-size: 14px;
                    font-weight: 600;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .upg-toast-close {
                    background: none;
                    border: none;
                    color: #64748b;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                    transition: color 0.2s;
                }
                
                .upg-toast-close:hover {
                    color: #f8fafc;
                }
                
                .upg-toast-body {
                    padding: 12px 16px 16px;
                }
                
                .upg-toast-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .upg-toast-item:last-child {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                
                .upg-toast-item-icon {
                    font-size: 18px;
                    flex-shrink: 0;
                    width: 24px;
                    text-align: center;
                }
                
                .upg-toast-item-content {
                    flex: 1;
                    min-width: 0;
                }
                
                .upg-toast-item-text {
                    color: #e2e8f0;
                    font-size: 13px;
                    font-weight: 500;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: block;
                    margin-bottom: 6px;
                }
                
                .upg-toast-item-bar {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .upg-toast-item-fill {
                    height: 100%;
                    border-radius: 2px;
                    transition: width 0.5s ease;
                }
                
                /* Badge stillleri (inline için) */
                .upg-value-signals {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .upg-value-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: rgba(34, 197, 94, 0.1);
                    border: 1px solid rgba(34, 197, 94, 0.3);
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #22c55e;
                }
                
                .upg-value-badge.upg-value-speed {
                    background: rgba(34, 197, 94, 0.1);
                    border-color: rgba(34, 197, 94, 0.3);
                    color: #22c55e;
                }
                
                .upg-value-badge.upg-value-size {
                    background: rgba(245, 158, 11, 0.1);
                    border-color: rgba(245, 158, 11, 0.3);
                    color: #f59e0b;
                }
                
                .upg-value-badge.upg-value-quality {
                    background: rgba(168, 85, 247, 0.1);
                    border-color: rgba(168, 85, 247, 0.3);
                    color: #a855f7;
                }
                
                .upg-value-badge.upg-value-cache {
                    background: rgba(6, 182, 212, 0.1);
                    border-color: rgba(6, 182, 212, 0.3);
                    color: #06b6d4;
                }
                
                /* Responsive */
                @media (max-width: 480px) {
                    .upg-value-toast {
                        right: 12px;
                        bottom: 12px;
                        left: 12px;
                    }
                    
                    .upg-toast-card {
                        min-width: auto;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(styles);
        },

        /**
         * Initialize
         */
        init: function () {
            this.data = window.upgUsage || {};
            this.injectStyles();

            if (this.data.is_pro) {
                console.log('UPG Value Signals: Ready for Pro user');
            }
        },

        /**
         * Test için manuel gösterim
         */
        test: function () {
            this.showToast([
                { icon: '⚡', text: 'Cache ile %85 daha hızlı', type: 'speed', percent: 85, color: '#22c55e' },
                { icon: '💾', text: '%48 daha küçük dosya', type: 'size', percent: 48, color: '#f59e0b' },
                { icon: '✨', text: '%42 yüksek kalite', type: 'quality', percent: 42, color: '#a855f7' },
            ]);
        }
    };

    // =========================================
    // INIT ON DOM READY
    // =========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            upgModal.init();
            upgOffers.init();
            upgFriction.init();
            upgValueSignals.init();
        });
    } else {
        upgModal.init();
        upgOffers.init();
        upgFriction.init();
        upgValueSignals.init();
    }

})();

