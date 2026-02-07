<?php
/**
 * QR Code Generator Helper
 * 
 * Generates QR codes as base64 data URIs for offline embedding.
 * Uses api.qrserver.com for generation, then converts to base64.
 *
 * @package Umrebuldum\TourExport
 */

namespace Umrebuldum\TourExport;

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

/**
 * QR Code Generator Class
 */
class QR_Generator {

    /**
     * QR Server API URL
     */
    const API_URL = 'https://api.qrserver.com/v1/create-qr-code/';

    /**
     * Default QR code size
     */
    const DEFAULT_SIZE = 200;

    /**
     * Generate QR code as base64 data URI
     *
     * @param string $data   The data to encode in QR code (e.g., "tel:+905551234567")
     * @param int    $size   Size in pixels (width = height)
     * @return string|null   Base64 data URI or null on failure
     */
    public static function generate_base64( $data, $size = null ) {
        if ( empty( $data ) ) {
            return null;
        }

        if ( ! $size ) {
            $size = self::DEFAULT_SIZE;
        }

        // Build API URL
        $api_url = add_query_arg( [
            'size' => $size . 'x' . $size,
            'data' => urlencode( $data ),
            'format' => 'png',
            'margin' => '10',
            'color' => '1e3a5f', // Dark blue color matching theme
            'bgcolor' => 'ffffff',
        ], self::API_URL );

        // Fetch QR code image
        $response = wp_remote_get( $api_url, [
            'timeout'   => 10,
            'sslverify' => true,
        ] );

        // Check for errors
        if ( is_wp_error( $response ) ) {
            error_log( 'UTE QR Generator Error: ' . $response->get_error_message() );
            return self::generate_fallback_qr( $data );
        }

        $response_code = wp_remote_retrieve_response_code( $response );
        if ( $response_code !== 200 ) {
            error_log( 'UTE QR Generator Error: API returned ' . $response_code );
            return self::generate_fallback_qr( $data );
        }

        // Get image data
        $image_data = wp_remote_retrieve_body( $response );
        if ( empty( $image_data ) ) {
            return self::generate_fallback_qr( $data );
        }

        // Convert to base64 data URI
        return 'data:image/png;base64,' . base64_encode( $image_data );
    }

    /**
     * Generate QR code for phone number
     *
     * @param string $phone Phone number
     * @param int    $size  Size in pixels
     * @return string|null  Base64 data URI
     */
    public static function generate_for_phone( $phone, $size = null ) {
        if ( empty( $phone ) ) {
            return null;
        }

        // Clean phone number (keep only digits and +)
        $clean_phone = preg_replace( '/[^0-9+]/', '', $phone );
        
        // Generate QR with tel: protocol
        return self::generate_base64( 'tel:' . $clean_phone, $size );
    }

    /**
     * Generate fallback QR placeholder (SVG)
     * Used when API fails - shows phone number as text
     *
     * @param string $data Original data
     * @return string SVG data URI
     */
    private static function generate_fallback_qr( $data ) {
        // Create simple SVG placeholder
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
            <rect width="200" height="200" fill="#f5f5f5" rx="10"/>
            <rect x="20" y="20" width="160" height="160" fill="#1e3a5f" rx="8"/>
            <text x="100" y="90" text-anchor="middle" fill="#fff" font-size="14" font-family="Arial, sans-serif">📱 QR KOD</text>
            <text x="100" y="115" text-anchor="middle" fill="#fff" font-size="11" font-family="Arial, sans-serif">Yüklenemedi</text>
            <text x="100" y="140" text-anchor="middle" fill="#ffc107" font-size="10" font-family="Arial, sans-serif">' . esc_html( $data ) . '</text>
        </svg>';

        return 'data:image/svg+xml;base64,' . base64_encode( $svg );
    }

    /**
     * Generate QR code and cache it (transient)
     *
     * @param string $data Data to encode
     * @param int    $size Size in pixels
     * @param int    $expiry Cache expiry in seconds (default: 1 day)
     * @return string|null Base64 data URI
     */
    public static function generate_cached( $data, $size = null, $expiry = DAY_IN_SECONDS ) {
        $cache_key = 'ute_qr_' . md5( $data . '_' . ( $size ?? self::DEFAULT_SIZE ) );
        
        // Check cache
        $cached = get_transient( $cache_key );
        if ( $cached !== false ) {
            return $cached;
        }

        // Generate new QR
        $qr_base64 = self::generate_base64( $data, $size );
        
        // Cache if successful
        if ( $qr_base64 ) {
            set_transient( $cache_key, $qr_base64, $expiry );
        }

        return $qr_base64;
    }
}
