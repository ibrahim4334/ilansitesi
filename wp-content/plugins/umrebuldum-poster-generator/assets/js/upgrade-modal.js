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
    // FRICTION HANDLER - Free Kullanıcı Gecikme
    // =========================================

    window.upgFriction = {

        data: window.upgUsage || {},

        /**
         * Render işlemini friction ile wrap et
         * @param {Function} renderFn - Gerçek render fonksiyonu
         * @param {Object} options - Seçenekler
         */
        withFriction: function (renderFn, options) {
            var self = this;
            var friction = this.data.friction || {};

            // Pro kullanıcıya friction yok
            if (this.data.is_pro || !friction.apply) {
                return renderFn();
            }

            // Friction uygula
            var delay = friction.delay || 800;
            var message = friction.message || 'Hazırlanıyor...';

            // Loading state göster
            this.showFrictionLoader(message, friction.upgrade_url);

            // Gecikme sonrası render
            return new Promise(function (resolve, reject) {
                setTimeout(function () {
                    self.hideFrictionLoader();

                    try {
                        var result = renderFn();
                        if (result && result.then) {
                            result.then(resolve).catch(reject);
                        } else {
                            resolve(result);
                        }
                    } catch (e) {
                        reject(e);
                    }
                }, delay);
            });
        },

        /**
         * Friction loader göster
         */
        showFrictionLoader: function (message, upgradeUrl) {
            // Mevcut loader varsa kaldır
            this.hideFrictionLoader();

            var loader = document.createElement('div');
            loader.id = 'upg-friction-loader';
            loader.innerHTML =
                '<div class="upg-friction-overlay">' +
                '<div class="upg-friction-content">' +
                '<div class="upg-friction-spinner"></div>' +
                '<div class="upg-friction-message">' + message + '</div>' +
                '<a href="' + (upgradeUrl || '#') + '" class="upg-friction-upgrade">⚡ Pro ile Anında Oluştur</a>' +
                '</div>' +
                '</div>';

            document.body.appendChild(loader);
        },

        /**
         * Friction loader gizle
         */
        hideFrictionLoader: function () {
            var loader = document.getElementById('upg-friction-loader');
            if (loader) {
                loader.remove();
            }
        },

        init: function () {
            this.data = window.upgUsage || {};

            if (this.data.friction && this.data.friction.apply) {
                console.log('UPG: Friction active for free user');
            }
        }
    };

    // =========================================
    // VALUE SIGNALS - Pro Badges
    // =========================================

    window.upgValueSignals = {

        /**
         * Value signal badges göster
         * @param {Array} signals - [{icon, text, type, percent}]
         * @param {Element} container - Badge container
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
         * Toast notification olarak göster
         */
        showToast: function (signals) {
            var existing = document.getElementById('upg-value-toast');
            if (existing) existing.remove();

            var toast = document.createElement('div');
            toast.id = 'upg-value-toast';
            toast.className = 'upg-value-toast';

            var html = '<div class="upg-toast-header">⚡ Pro Avantajları</div>';
            signals.forEach(function (signal) {
                html += '<div class="upg-toast-item">' + signal.icon + ' ' + signal.text + '</div>';
            });

            toast.innerHTML = html;
            document.body.appendChild(toast);

            // Animasyon
            setTimeout(function () {
                toast.classList.add('upg-toast-visible');
            }, 100);

            // Otomatik kapat
            setTimeout(function () {
                toast.classList.remove('upg-toast-visible');
                setTimeout(function () {
                    toast.remove();
                }, 300);
            }, 4000);
        },

        /**
         * Render response'dan signals al ve göster
         */
        handleRenderResponse: function (response) {
            if (response && response.value_signals && response.value_signals.length > 0) {
                this.showToast(response.value_signals);
            }
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
        });
    } else {
        upgModal.init();
        upgOffers.init();
        upgFriction.init();
    }

})();

