<?php
/**
 * Rate Limiter
 * 
 * API abuse koruması - Redis olmadan transients ile çalışır
 * WhatsApp bot ve mobil PWA için güvenli
 * 
 * @package Umrebuldum\Poster
 */

namespace Umrebuldum\Poster;

defined('ABSPATH') || exit;

class Rate_Limiter {
    
    private $prefix = 'upg_rl_';
    
    /**
     * Rate limit kuralları
     */
    private $rules = [
        'generate' => [
            'limit'  => 10,     // 10 istek
            'window' => 3600,   // 1 saat
        ],
        'api_read' => [
            'limit'  => 100,    // 100 istek
            'window' => 3600,   // 1 saat
        ],
        'api_write' => [
            'limit'  => 20,     // 20 istek
            'window' => 3600,   // 1 saat
        ],
        'webhook' => [
            'limit'  => 50,     // 50 istek
            'window' => 60,     // 1 dakika
        ],
    ];
    
    /**
     * Rate limit kontrolü
     * 
     * @param string $action generate|api_read|api_write|webhook
     * @param string $identifier IP veya user_id
     * @return array ['allowed' => bool, 'remaining' => int, 'reset' => int]
     */
    public function check(string $action, string $identifier = null): array {
        $identifier = $identifier ?? $this->get_identifier();
        $rule = $this->rules[$action] ?? $this->rules['api_read'];
        
        $key = $this->prefix . $action . '_' . md5($identifier);
        $data = get_transient($key);
        
        if ($data === false) {
            // İlk istek
            $data = [
                'count' => 1,
                'start' => time(),
            ];
            set_transient($key, $data, $rule['window']);
            
            return [
                'allowed'   => true,
                'remaining' => $rule['limit'] - 1,
                'reset'     => time() + $rule['window'],
                'limit'     => $rule['limit'],
            ];
        }
        
        // Window kontrolü
        if ((time() - $data['start']) > $rule['window']) {
            // Window süresi dolmuş, sıfırla
            $data = [
                'count' => 1,
                'start' => time(),
            ];
            set_transient($key, $data, $rule['window']);
            
            return [
                'allowed'   => true,
                'remaining' => $rule['limit'] - 1,
                'reset'     => time() + $rule['window'],
                'limit'     => $rule['limit'],
            ];
        }
        
        // Limit aşıldı mı?
        if ($data['count'] >= $rule['limit']) {
            return [
                'allowed'   => false,
                'remaining' => 0,
                'reset'     => $data['start'] + $rule['window'],
                'limit'     => $rule['limit'],
                'retry_after' => ($data['start'] + $rule['window']) - time(),
            ];
        }
        
        // Sayacı artır
        $data['count']++;
        set_transient($key, $data, $rule['window']);
        
        return [
            'allowed'   => true,
            'remaining' => $rule['limit'] - $data['count'],
            'reset'     => $data['start'] + $rule['window'],
            'limit'     => $rule['limit'],
        ];
    }
    
    /**
     * Rate limit header'ları ekle
     */
    public function add_headers(array $result): void {
        if (headers_sent()) return;
        
        header('X-RateLimit-Limit: ' . $result['limit']);
        header('X-RateLimit-Remaining: ' . $result['remaining']);
        header('X-RateLimit-Reset: ' . $result['reset']);
        
        if (!$result['allowed']) {
            header('Retry-After: ' . $result['retry_after']);
        }
    }
    
    /**
     * Belirli bir identifier'ı sıfırla
     */
    public function reset(string $action, string $identifier): bool {
        $key = $this->prefix . $action . '_' . md5($identifier);
        return delete_transient($key);
    }
    
    /**
     * Tüm rate limit verilerini temizle
     */
    public function flush(): int {
        global $wpdb;
        
        $count = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                '_transient_' . $this->prefix . '%'
            )
        );
        
        return $count;
    }
    
    /**
     * Whitelist kontrolü
     */
    public function is_whitelisted(string $identifier = null): bool {
        $identifier = $identifier ?? $this->get_identifier();
        
        // Admin kullanıcılar
        if (current_user_can('manage_options')) {
            return true;
        }
        
        // Whitelist'teki IP'ler
        $whitelist = get_option('upg_rate_limit_whitelist', []);
        if (in_array($identifier, $whitelist)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Kural güncelle
     */
    public function set_rule(string $action, int $limit, int $window): void {
        $this->rules[$action] = [
            'limit'  => $limit,
            'window' => $window,
        ];
    }
    
    /**
     * İstemci tanımlayıcısı
     */
    private function get_identifier(): string {
        // Önce user ID dene
        if (is_user_logged_in()) {
            return 'user_' . get_current_user_id();
        }
        
        // IP adresi al
        $ip = $this->get_client_ip();
        
        return 'ip_' . $ip;
    }
    
    /**
     * Client IP al (proxy arkasında bile)
     */
    private function get_client_ip(): string {
        $headers = [
            'HTTP_CF_CONNECTING_IP',     // Cloudflare
            'HTTP_X_FORWARDED_FOR',      // Proxy
            'HTTP_X_REAL_IP',            // Nginx proxy
            'REMOTE_ADDR',               // Standart
        ];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                
                // X-Forwarded-For birden fazla IP içerebilir
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0';
    }
}
