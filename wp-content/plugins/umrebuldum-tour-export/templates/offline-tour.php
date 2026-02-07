<?php
/**
 * Offline Tour HTML Template
 * 
 * Single-file, offline-capable HTML export
 * All CSS is inline, images are base64 encoded
 * Includes multilingual Emergency Help screen
 *
 * @package Umrebuldum\TourExport
 */

// Exit if accessed directly.
defined( 'ABSPATH' ) || exit;

// Ensure $data is available
if ( ! isset( $data ) ) {
    return;
}

// Prepare emergency data (Kayboldum feature)
$guide_name = $data['guide_name'] ?? $data['organizer']['name'] ?? 'Tur Rehberi';
$guide_phone = $data['guide_phone'] ?? $data['organizer']['phone'] ?? '+90 XXX XXX XX XX';
$agency_name = $data['agency_name'] ?? $data['organizer']['name'] ?? 'Organizasyon';
$current_hotel = $data['hotel_mecca'] ?? $data['hotel_medina'] ?? 'Otel bilgisi yüklenmedi';
$hotel_address = $data['hotel_address'] ?? 'Otel adres bilgisi';
$guide_phone_qr = $data['guide_phone_qr'] ?? null;
$clean_phone = preg_replace( '/[^0-9+]/', '', $guide_phone );
?>
<!DOCTYPE html>
<html lang="tr" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
    <meta name="robots" content="noindex, nofollow">
    <title><?php echo esc_html( $data['title'] ); ?> - Tur Planı</title>
    
    <!-- Offline-ready: No external resources -->
    <style>
        /* ============================================
           RESET & BASE STYLES
           ============================================ */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        html {
            font-size: 16px;
            -webkit-text-size-adjust: 100%;
            scroll-behavior: smooth;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a2e;
            background: #f8f9fa;
            min-height: 100vh;
        }

        /* ============================================
           TYPOGRAPHY
           ============================================ */
        h1 { font-size: 1.75rem; font-weight: 700; line-height: 1.2; }
        h2 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; }
        h3 { font-size: 1.1rem; font-weight: 600; line-height: 1.4; }
        p { margin-bottom: 0.75rem; }
        
        a {
            color: #2563eb;
            text-decoration: none;
        }

        /* ============================================
           LAYOUT COMPONENTS
           ============================================ */
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 1rem;
        }

        .card {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 1rem;
            overflow: hidden;
        }

        .card-header {
            padding: 1rem;
            border-bottom: 1px solid #eee;
            background: #fafafa;
        }

        .card-body {
            padding: 1rem;
        }

        /* ============================================
           HEADER
           ============================================ */
        .tour-header {
            background: linear-gradient(135deg, #1e3a5f 0%, #0d7377 100%);
            color: #fff;
            padding: 1.5rem 1rem;
            text-align: center;
        }

        .tour-header__badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            margin-bottom: 0.75rem;
        }

        .tour-header__title {
            margin-bottom: 0.5rem;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .tour-header__meta {
            font-size: 0.875rem;
            opacity: 0.9;
        }

        /* ============================================
           FEATURED IMAGE
           ============================================ */
        .featured-image {
            width: 100%;
            height: auto;
            display: block;
        }

        .featured-image img {
            width: 100%;
            height: auto;
            display: block;
        }

        /* ============================================
           INFO GRID
           ============================================ */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }

        .info-item {
            padding: 0.75rem;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: center;
        }

        .info-item__icon {
            font-size: 1.5rem;
            margin-bottom: 0.25rem;
        }

        .info-item__label {
            font-size: 0.7rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-item__value {
            font-weight: 600;
            font-size: 0.9rem;
            color: #1a1a2e;
        }

        /* ============================================
           PRICE SECTION
           ============================================ */
        .price-section {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            color: #fff;
            padding: 1rem;
            text-align: center;
            border-radius: 12px;
            margin: 1rem;
        }

        .price-section__amount {
            font-size: 2rem;
            font-weight: 700;
        }

        .price-section__note {
            font-size: 0.75rem;
            opacity: 0.9;
        }

        /* ============================================
           ITINERARY / DAYS
           ============================================ */
        .itinerary {
            padding: 1rem;
        }

        .itinerary__title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #1e3a5f;
        }

        .day-card {
            position: relative;
            padding-left: 2.5rem;
            margin-bottom: 1.5rem;
        }

        .day-card::before {
            content: '';
            position: absolute;
            left: 0.6rem;
            top: 2rem;
            bottom: -1.5rem;
            width: 2px;
            background: #e5e7eb;
        }

        .day-card:last-child::before {
            display: none;
        }

        .day-card__number {
            position: absolute;
            left: 0;
            top: 0;
            width: 1.5rem;
            height: 1.5rem;
            background: #1e3a5f;
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
        }

        .day-card__content {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
        }

        .day-card__title {
            color: #1e3a5f;
            margin-bottom: 0.5rem;
        }

        .day-card__description {
            font-size: 0.9rem;
            color: #4b5563;
            margin-bottom: 0.5rem;
        }

        .day-card__location {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.8rem;
            color: #6b7280;
            background: #f3f4f6;
            padding: 0.5rem;
            border-radius: 6px;
            margin-top: 0.5rem;
        }

        /* ============================================
           INCLUDES / NOT INCLUDES
           ============================================ */
        .includes-section {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            margin: 1rem;
        }

        @media (min-width: 480px) {
            .includes-section {
                grid-template-columns: 1fr 1fr;
            }
        }

        .includes-card {
            padding: 1rem;
            border-radius: 8px;
        }

        .includes-card--yes {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
        }

        .includes-card--no {
            background: #fef2f2;
            border: 1px solid #fecaca;
        }

        .includes-card__title {
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .includes-card--yes .includes-card__title {
            color: #047857;
        }

        .includes-card--no .includes-card__title {
            color: #b91c1c;
        }

        .includes-card ul {
            list-style: none;
            font-size: 0.85rem;
        }

        .includes-card li {
            padding: 0.25rem 0;
            padding-left: 1.25rem;
            position: relative;
        }

        .includes-card--yes li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #059669;
        }

        .includes-card--no li::before {
            content: '✗';
            position: absolute;
            left: 0;
            color: #dc2626;
        }

        /* ============================================
           HOTELS
           ============================================ */
        .hotels-section {
            margin: 1rem;
        }

        .hotel-card {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 0.75rem;
        }

        .hotel-card__icon {
            font-size: 2rem;
        }

        .hotel-card__info {
            flex: 1;
        }

        .hotel-card__city {
            font-size: 0.75rem;
            color: #6b7280;
            text-transform: uppercase;
        }

        .hotel-card__name {
            font-weight: 600;
            color: #1e3a5f;
        }

        .hotel-card__distance {
            font-size: 0.8rem;
            color: #059669;
        }

        /* ============================================
           ORGANIZER
           ============================================ */
        .organizer-section {
            margin: 1rem;
            padding: 1rem;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
        }

        .organizer-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }

        .organizer-logo {
            width: 50px;
            height: 50px;
            border-radius: 8px;
            object-fit: cover;
            background: #f3f4f6;
        }

        .organizer-name {
            font-weight: 600;
            color: #1e3a5f;
        }

        .organizer-badge {
            font-size: 0.7rem;
            background: #dbeafe;
            color: #1d4ed8;
            padding: 0.125rem 0.5rem;
            border-radius: 4px;
        }

        .contact-list {
            list-style: none;
        }

        .contact-list li {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid #f3f4f6;
            font-size: 0.9rem;
        }

        .contact-list li:last-child {
            border-bottom: none;
        }

        /* ============================================
           GALLERY
           ============================================ */
        .gallery {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            padding: 1rem;
        }

        .gallery img {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            border-radius: 8px;
        }

        /* ============================================
           FOOTER
           ============================================ */
        .tour-footer {
            text-align: center;
            padding: 1.5rem 1rem;
            padding-bottom: 6rem; /* Space for FABs */
            background: #1a1a2e;
            color: #9ca3af;
            font-size: 0.75rem;
        }

        .tour-footer a {
            color: #60a5fa;
        }

        /* ============================================
           EMERGENCY HELP BUTTON (FAB)
           ============================================ */
        .emergency-fab {
            position: fixed;
            bottom: 1rem;
            left: 1rem;
            right: 1rem;
            height: auto;
            padding: 1rem 1.5rem;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: #fff;
            border: none;
            border-radius: 50px;
            font-size: 1.25rem;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            animation: pulse-emergency 2s infinite;
            -webkit-tap-highlight-color: transparent;
            font-family: inherit;
        }

        .emergency-fab:active {
            transform: scale(0.98);
        }

        .emergency-fab__icon {
            font-size: 1.5rem;
        }

        @keyframes pulse-emergency {
            0%, 100% { box-shadow: 0 4px 20px rgba(220, 38, 38, 0.5); }
            50% { box-shadow: 0 4px 30px rgba(220, 38, 38, 0.8); }
        }

        /* ============================================
           EMERGENCY SCREEN (Fullscreen Overlay)
           ============================================ */
        .emergency-screen {
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: #fff;
            z-index: 9999;
            display: none;
            flex-direction: column;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
        }

        .emergency-screen.active {
            display: flex;
        }

        .emergency-screen__close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 50%;
            color: #fff;
            font-size: 1.5rem;
            cursor: pointer;
            z-index: 10;
        }

        .emergency-screen__header {
            text-align: center;
            padding: 2rem 1rem 1rem;
            background: rgba(0,0,0,0.2);
        }

        .emergency-screen__icon {
            font-size: 4rem;
            margin-bottom: 0.5rem;
            animation: shake 0.5s ease-in-out infinite;
        }

        @keyframes shake {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
        }

        .emergency-screen__title {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 0.25rem;
        }

        /* Language Tabs */
        .emergency-lang-tabs {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            padding: 1rem;
            background: rgba(0,0,0,0.1);
        }

        .emergency-lang-tab {
            padding: 0.75rem 1.25rem;
            background: rgba(255,255,255,0.1);
            border: 2px solid transparent;
            border-radius: 2rem;
            color: #fff;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .emergency-lang-tab.active {
            background: #fff;
            color: #dc2626;
            border-color: #fff;
        }

        /* Emergency Content */
        .emergency-content {
            flex: 1;
            padding: 1.5rem;
            display: none;
        }

        .emergency-content.active {
            display: block;
        }

        .emergency-content[dir="rtl"] {
            text-align: right;
        }

        /* Help Text Box */
        .emergency-help-text {
            background: rgba(255,255,255,0.15);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            font-size: 1.25rem;
            line-height: 1.6;
            text-align: center;
        }

        .emergency-help-text strong {
            display: block;
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        /* Contact Cards - Large & Elderly Friendly */
        .emergency-contact-card {
            background: #fff;
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            color: #1a1a2e;
        }

        .emergency-contact-card__label {
            font-size: 0.9rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 0.25rem;
        }

        .emergency-contact-card__value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e3a5f;
            word-break: break-word;
        }

        .emergency-contact-card__icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        /* Call Button - Extra Large */
        .emergency-call-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            width: 100%;
            padding: 1.5rem;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: #fff;
            border: none;
            border-radius: 16px;
            font-size: 1.5rem;
            font-weight: 700;
            cursor: pointer;
            margin-top: 1rem;
            text-decoration: none;
            box-shadow: 0 4px 15px rgba(5, 150, 105, 0.4);
        }

        .emergency-call-btn:active {
            transform: scale(0.98);
        }

        .emergency-call-btn__icon {
            font-size: 2rem;
            animation: ring 1s ease-in-out infinite;
        }

        @keyframes ring {
            0%, 100% { transform: rotate(0); }
            25% { transform: rotate(15deg); }
            75% { transform: rotate(-15deg); }
        }

        /* Hotel Info Card */
        .emergency-hotel-card {
            background: rgba(255,255,255,0.1);
            border: 2px dashed rgba(255,255,255,0.3);
            border-radius: 16px;
            padding: 1.5rem;
            margin-top: 1.5rem;
        }

        .emergency-hotel-card__title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .emergency-hotel-card__name {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .emergency-hotel-card__address {
            font-size: 1rem;
            opacity: 0.9;
            line-height: 1.5;
        }

        /* Show This to Someone Box */
        .emergency-show-this {
            background: #fef3c7;
            border: 3px solid #f59e0b;
            border-radius: 16px;
            padding: 1.25rem;
            margin-top: 1.5rem;
            text-align: center;
            color: #92400e;
        }

        .emergency-show-this__title {
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .emergency-show-this__text {
            font-size: 1.1rem;
            font-weight: 600;
        }

        /* QR Code Section */
        .emergency-qr-section {
            background: #fff;
            border-radius: 16px;
            padding: 1.5rem;
            margin-top: 1.5rem;
            text-align: center;
        }

        .emergency-qr-section__title {
            font-size: 1rem;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .emergency-qr-code {
            display: inline-block;
            background: #fff;
            padding: 10px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .emergency-qr-code img {
            width: 200px;
            height: 200px;
            display: block;
        }

        .emergency-qr-caption {
            font-size: 0.85rem;
            color: #6b7280;
            margin-top: 0.75rem;
        }

        /* Agency/Organization Card */
        .emergency-agency-card {
            background: rgba(255,255,255,0.9);
            border-radius: 12px;
            padding: 1rem;
            margin-top: 0.75rem;
            text-align: center;
        }

        .emergency-agency-card__label {
            font-size: 0.8rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .emergency-agency-card__value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e3a5f;
        }

        /* ============================================
           OFFLINE INDICATOR
           ============================================ */
        .offline-badge {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            background: #059669;
            color: #fff;
            padding: 0.5rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 999;
        }

        /* ============================================
           PRINT STYLES
           ============================================ */
        @media print {
            body {
                background: #fff;
                font-size: 12pt;
            }
            
            .card {
                box-shadow: none;
                border: 1px solid #ddd;
                break-inside: avoid;
            }
            
            .tour-header {
                background: #1e3a5f !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .day-card {
                break-inside: avoid;
            }

            .emergency-fab,
            .emergency-screen,
            .offline-badge {
                display: none !important;
            }

            .tour-footer {
                padding-bottom: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="tour-header">
        <div class="container">
            <span class="tour-header__badge">📋 Tur Planı</span>
            <h1 class="tour-header__title"><?php echo esc_html( $data['title'] ); ?></h1>
            <p class="tour-header__meta">
                <?php if ( ! empty( $data['duration'] ) ) : ?>
                    <?php echo esc_html( $data['duration'] ); ?> Gün
                <?php endif; ?>
                <?php if ( ! empty( $data['departure_date'] ) ) : ?>
                    • <?php echo esc_html( date_i18n( 'j F Y', strtotime( $data['departure_date'] ) ) ); ?>
                <?php endif; ?>
            </p>
        </div>
    </header>

    <!-- Featured Image -->
    <?php if ( ! empty( $data['featured_image'] ) ) : ?>
        <div class="featured-image">
            <img src="<?php echo esc_attr( $data['featured_image'] ); ?>" alt="<?php echo esc_attr( $data['title'] ); ?>">
        </div>
    <?php endif; ?>

    <!-- Quick Info Grid -->
    <div class="container">
        <div class="card">
            <div class="card-body">
                <div class="info-grid">
                    <?php if ( ! empty( $data['duration'] ) ) : ?>
                        <div class="info-item">
                            <div class="info-item__icon">📅</div>
                            <div class="info-item__label">Süre</div>
                            <div class="info-item__value"><?php echo esc_html( $data['duration'] ); ?> Gün</div>
                        </div>
                    <?php endif; ?>
                    
                    <?php if ( ! empty( $data['departure_city'] ) ) : ?>
                        <div class="info-item">
                            <div class="info-item__icon">✈️</div>
                            <div class="info-item__label">Kalkış</div>
                            <div class="info-item__value"><?php echo esc_html( $data['departure_city'] ); ?></div>
                        </div>
                    <?php endif; ?>
                    
                    <?php if ( ! empty( $data['departure_date'] ) ) : ?>
                        <div class="info-item">
                            <div class="info-item__icon">🛫</div>
                            <div class="info-item__label">Gidiş</div>
                            <div class="info-item__value"><?php echo esc_html( date_i18n( 'j M', strtotime( $data['departure_date'] ) ) ); ?></div>
                        </div>
                    <?php endif; ?>
                    
                    <?php if ( ! empty( $data['return_date'] ) ) : ?>
                        <div class="info-item">
                            <div class="info-item__icon">🛬</div>
                            <div class="info-item__label">Dönüş</div>
                            <div class="info-item__value"><?php echo esc_html( date_i18n( 'j M', strtotime( $data['return_date'] ) ) ); ?></div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Price -->
    <?php if ( ! empty( $data['price'] ) ) : ?>
        <div class="price-section">
            <div class="price-section__amount"><?php echo esc_html( $data['price'] ); ?></div>
            <div class="price-section__note">Kişi başı fiyat</div>
        </div>
    <?php endif; ?>

    <!-- Hotels -->
    <?php if ( ! empty( $data['hotel_mecca'] ) || ! empty( $data['hotel_medina'] ) ) : ?>
        <section class="hotels-section">
            <h2 style="margin-bottom: 0.75rem;">🏨 Konaklama</h2>
            
            <?php if ( ! empty( $data['hotel_mecca'] ) ) : ?>
                <div class="hotel-card">
                    <div class="hotel-card__icon">🕋</div>
                    <div class="hotel-card__info">
                        <div class="hotel-card__city">Mekke</div>
                        <div class="hotel-card__name"><?php echo esc_html( $data['hotel_mecca'] ); ?></div>
                        <div class="hotel-card__distance">Harem'e yürüme mesafesi</div>
                    </div>
                </div>
            <?php endif; ?>
            
            <?php if ( ! empty( $data['hotel_medina'] ) ) : ?>
                <div class="hotel-card">
                    <div class="hotel-card__icon">🕌</div>
                    <div class="hotel-card__info">
                        <div class="hotel-card__city">Medine</div>
                        <div class="hotel-card__name"><?php echo esc_html( $data['hotel_medina'] ); ?></div>
                        <div class="hotel-card__distance">Mescid-i Nebevi yakını</div>
                    </div>
                </div>
            <?php endif; ?>
        </section>
    <?php endif; ?>

    <!-- Day by Day Itinerary -->
    <?php if ( ! empty( $data['days'] ) ) : ?>
        <section class="itinerary">
            <h2 class="itinerary__title">
                <span>📍</span> Gün Gün Program
            </h2>
            
            <?php foreach ( $data['days'] as $day ) : ?>
                <div class="day-card">
                    <div class="day-card__number"><?php echo esc_html( $day['day_number'] ); ?></div>
                    <div class="day-card__content">
                        <h3 class="day-card__title"><?php echo esc_html( $day['title'] ); ?></h3>
                        
                        <?php if ( ! empty( $day['description'] ) ) : ?>
                            <p class="day-card__description"><?php echo esc_html( $day['description'] ); ?></p>
                        <?php endif; ?>
                        
                        <?php if ( ! empty( $day['location'] ) ) : ?>
                            <div class="day-card__location">
                                <span>📍</span>
                                <?php echo esc_html( $day['location'] ); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </section>
    <?php endif; ?>

    <!-- Includes / Not Includes -->
    <?php if ( ! empty( $data['included'] ) || ! empty( $data['not_included'] ) ) : ?>
        <section class="includes-section">
            <?php if ( ! empty( $data['included'] ) ) : ?>
                <div class="includes-card includes-card--yes">
                    <h3 class="includes-card__title">✓ Fiyata Dahil</h3>
                    <ul>
                        <?php
                        $items = is_array( $data['included'] ) ? $data['included'] : explode( "\n", $data['included'] );
                        foreach ( $items as $item ) :
                            $item = trim( $item );
                            if ( $item ) :
                        ?>
                            <li><?php echo esc_html( $item ); ?></li>
                        <?php endif; endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
            
            <?php if ( ! empty( $data['not_included'] ) ) : ?>
                <div class="includes-card includes-card--no">
                    <h3 class="includes-card__title">✗ Fiyata Dahil Değil</h3>
                    <ul>
                        <?php
                        $items = is_array( $data['not_included'] ) ? $data['not_included'] : explode( "\n", $data['not_included'] );
                        foreach ( $items as $item ) :
                            $item = trim( $item );
                            if ( $item ) :
                        ?>
                            <li><?php echo esc_html( $item ); ?></li>
                        <?php endif; endforeach; ?>
                    </ul>
                </div>
            <?php endif; ?>
        </section>
    <?php endif; ?>

    <!-- Gallery -->
    <?php if ( ! empty( $data['gallery'] ) ) : ?>
        <section class="gallery">
            <?php foreach ( $data['gallery'] as $image ) : ?>
                <img src="<?php echo esc_attr( $image ); ?>" alt="Tur görseli">
            <?php endforeach; ?>
        </section>
    <?php endif; ?>

    <!-- Organizer -->
    <?php if ( ! empty( $data['organizer'] ) ) : ?>
        <section class="organizer-section">
            <div class="organizer-header">
                <?php if ( ! empty( $data['organizer']['logo'] ) ) : ?>
                    <img src="<?php echo esc_attr( $data['organizer']['logo'] ); ?>" alt="" class="organizer-logo">
                <?php else : ?>
                    <div class="organizer-logo" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🏢</div>
                <?php endif; ?>
                <div>
                    <div class="organizer-name"><?php echo esc_html( $data['organizer']['name'] ); ?></div>
                    <span class="organizer-badge">Organizatör</span>
                </div>
            </div>
            
            <ul class="contact-list">
                <?php if ( ! empty( $data['organizer']['phone'] ) ) : ?>
                    <li>
                        <span>📞</span>
                        <strong>Telefon:</strong>
                        <?php echo esc_html( $data['organizer']['phone'] ); ?>
                    </li>
                <?php endif; ?>
                
                <?php if ( ! empty( $data['organizer']['email'] ) ) : ?>
                    <li>
                        <span>✉️</span>
                        <strong>E-posta:</strong>
                        <?php echo esc_html( $data['organizer']['email'] ); ?>
                    </li>
                <?php endif; ?>
                
                <?php if ( ! empty( $data['organizer']['address'] ) ) : ?>
                    <li>
                        <span>📍</span>
                        <strong>Adres:</strong>
                        <?php echo esc_html( $data['organizer']['address'] ); ?>
                    </li>
                <?php endif; ?>
            </ul>
        </section>
    <?php endif; ?>

    <!-- Description -->
    <?php if ( ! empty( $data['description'] ) ) : ?>
        <div class="container">
            <div class="card">
                <div class="card-header">
                    <h2>ℹ️ Tur Hakkında</h2>
                </div>
                <div class="card-body">
                    <?php echo wp_kses_post( wpautop( $data['description'] ) ); ?>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- Footer -->
    <footer class="tour-footer">
        <p>
            Bu doküman <strong><?php echo esc_html( $data['export_date'] ); ?></strong> tarihinde 
            <a href="<?php echo esc_url( $data['url'] ); ?>">Umrebuldum.com</a> üzerinden oluşturulmuştur.
        </p>
        <p style="margin-top: 0.5rem;">
            Güncel bilgi için: <a href="<?php echo esc_url( $data['url'] ); ?>"><?php echo esc_url( $data['url'] ); ?></a>
        </p>
    </footer>

    <!-- Offline Badge -->
    <div class="offline-badge">
        <span>📴</span> Offline Hazır
    </div>

    <!-- ============================================
         EMERGENCY HELP BUTTON (Floating Action Button)
         ============================================ -->
    <button class="emergency-fab" id="emergencyFab" aria-label="Acil Yardım" title="Acil Yardım / Kayboldum">
        <span class="emergency-fab__icon">🆘</span>
        Yardım / Kayboldum
    </button>

    <!-- ============================================
         EMERGENCY HELP SCREEN (Fullscreen Overlay)
         ============================================ -->
    <div class="emergency-screen" id="emergencyScreen">
        <!-- Close Button -->
        <button class="emergency-screen__close" id="emergencyClose" aria-label="Kapat">✕</button>

        <!-- Header -->
        <div class="emergency-screen__header">
            <div class="emergency-screen__icon">🆘</div>
            <h1 class="emergency-screen__title" id="emergencyTitle">ACİL YARDIM</h1>
        </div>

        <!-- Language Tabs -->
        <div class="emergency-lang-tabs">
            <button class="emergency-lang-tab active" data-lang="tr">🇹🇷 Türkçe</button>
            <button class="emergency-lang-tab" data-lang="en">🇬🇧 English</button>
            <button class="emergency-lang-tab" data-lang="ar">🇸🇦 العربية</button>
        </div>

        <!-- TURKISH CONTENT -->
        <div class="emergency-content active" id="content-tr" dir="ltr">
            <!-- Static Help Text -->
            <div class="emergency-help-text">
                <strong>Kayboldum. Umre grubumdan ayrıldım.</strong>
                Lütfen tur rehberimi arayın.
            </div>

            <!-- REHBER -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">REHBER</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $guide_name ); ?></div>
            </div>

            <!-- TEL -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">TEL</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $guide_phone ); ?></div>
            </div>

            <!-- ORGANİZASYON -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">ORGANİZASYON</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $agency_name ); ?></div>
            </div>

            <!-- Call Button -->
            <a href="tel:<?php echo esc_attr( $clean_phone ); ?>" class="emergency-call-btn">
                <span class="emergency-call-btn__icon">📞</span>
                HEMEN ARA
            </a>

            <!-- QR Code for Phone -->
            <?php if ( $guide_phone_qr ) : ?>
            <div class="emergency-qr-section">
                <div class="emergency-qr-section__title">📱 Telefon için QR Kod</div>
                <div class="emergency-qr-code">
                    <img src="<?php echo esc_attr( $guide_phone_qr ); ?>" alt="QR Kod - Rehber Telefonu">
                </div>
                <div class="emergency-qr-caption">Bu QR kodu taratarak rehberi arayabilirsiniz</div>
            </div>
            <?php endif; ?>

            <!-- Show This Box -->
            <div class="emergency-show-this">
                <div class="emergency-show-this__title">👆 Bunu Birine Gösterin</div>
                <div class="emergency-show-this__text">
                    "Kayboldum. Umre grubumdan ayrıldım. Lütfen tur rehberimi arayın: <?php echo esc_html( $guide_phone ); ?>"
                </div>
            </div>
        </div>

        <!-- ENGLISH CONTENT -->
        <div class="emergency-content" id="content-en" dir="ltr">
            <!-- Static Help Text -->
            <div class="emergency-help-text">
                <strong>I am lost. I am part of an Umrah group.</strong>
                Please call my tour guide.
            </div>

            <!-- GUIDE -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">GUIDE</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $guide_name ); ?></div>
            </div>

            <!-- PHONE -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">PHONE</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $guide_phone ); ?></div>
            </div>

            <!-- ORGANIZATION -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">ORGANIZATION</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $agency_name ); ?></div>
            </div>

            <!-- Call Button -->
            <a href="tel:<?php echo esc_attr( $clean_phone ); ?>" class="emergency-call-btn">
                <span class="emergency-call-btn__icon">📞</span>
                CALL NOW
            </a>

            <!-- QR Code for Phone -->
            <?php if ( $guide_phone_qr ) : ?>
            <div class="emergency-qr-section">
                <div class="emergency-qr-section__title">📱 QR Code for Phone</div>
                <div class="emergency-qr-code">
                    <img src="<?php echo esc_attr( $guide_phone_qr ); ?>" alt="QR Code - Guide Phone">
                </div>
                <div class="emergency-qr-caption">Scan this QR code to call the guide</div>
            </div>
            <?php endif; ?>

            <!-- Show This Box -->
            <div class="emergency-show-this">
                <div class="emergency-show-this__title">👆 Show This to Someone</div>
                <div class="emergency-show-this__text">
                    "I am lost. I am part of an Umrah group. Please call my tour guide: <?php echo esc_html( $guide_phone ); ?>"
                </div>
            </div>
        </div>

        <!-- ARABIC CONTENT -->
        <div class="emergency-content" id="content-ar" dir="rtl">
            <!-- Static Help Text -->
            <div class="emergency-help-text">
                <strong>أنا ضائع. أنا ضمن مجموعة عمرة.</strong>
                الرجاء الاتصال بمرشد الرحلة.
            </div>

            <!-- المرشد -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">المرشد</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $guide_name ); ?></div>
            </div>

            <!-- الهاتف -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">الهاتف</div>
                <div class="emergency-contact-card__value" dir="ltr"><?php echo esc_html( $guide_phone ); ?></div>
            </div>

            <!-- المنظمة -->
            <div class="emergency-contact-card">
                <div class="emergency-contact-card__label">المنظمة</div>
                <div class="emergency-contact-card__value"><?php echo esc_html( $agency_name ); ?></div>
            </div>

            <!-- Call Button -->
            <a href="tel:<?php echo esc_attr( $clean_phone ); ?>" class="emergency-call-btn">
                <span class="emergency-call-btn__icon">📞</span>
                اتصل الآن
            </a>

            <!-- QR Code for Phone -->
            <?php if ( $guide_phone_qr ) : ?>
            <div class="emergency-qr-section">
                <div class="emergency-qr-section__title">📱 رمز QR للهاتف</div>
                <div class="emergency-qr-code">
                    <img src="<?php echo esc_attr( $guide_phone_qr ); ?>" alt="رمز QR - هاتف المرشد">
                </div>
                <div class="emergency-qr-caption">امسح هذا الرمز للاتصال بالمرشد</div>
            </div>
            <?php endif; ?>

            <!-- Show This Box -->
            <div class="emergency-show-this">
                <div class="emergency-show-this__title">👆 أظهر هذا لشخص ما</div>
                <div class="emergency-show-this__text" dir="ltr">
                    "أنا ضائع. أنا ضمن مجموعة عمرة. الرجاء الاتصال بمرشد الرحلة: <?php echo esc_html( $guide_phone ); ?>"
                </div>
            </div>
        </div>
    </div>

    <!-- JavaScript for Emergency Screen -->
    <script>
        (function() {
            var fab = document.getElementById('emergencyFab');
            var screen = document.getElementById('emergencyScreen');
            var closeBtn = document.getElementById('emergencyClose');
            var langTabs = document.querySelectorAll('.emergency-lang-tab');
            var contents = document.querySelectorAll('.emergency-content');
            var title = document.getElementById('emergencyTitle');

            var titles = {
                tr: 'ACİL YARDIM',
                en: 'EMERGENCY HELP',
                ar: 'مساعدة طارئة'
            };

            // Open emergency screen
            fab.addEventListener('click', function() {
                screen.classList.add('active');
                document.body.style.overflow = 'hidden';
            });

            // Close emergency screen
            closeBtn.addEventListener('click', function() {
                screen.classList.remove('active');
                document.body.style.overflow = '';
            });

            // Close on escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && screen.classList.contains('active')) {
                    screen.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            // Language switching
            langTabs.forEach(function(tab) {
                tab.addEventListener('click', function() {
                    var lang = this.getAttribute('data-lang');

                    // Update tabs
                    langTabs.forEach(function(t) {
                        t.classList.remove('active');
                    });
                    this.classList.add('active');

                    // Update content
                    contents.forEach(function(c) {
                        c.classList.remove('active');
                    });
                    document.getElementById('content-' + lang).classList.add('active');

                    // Update title
                    title.textContent = titles[lang];

                    // Update RTL/LTR
                    if (lang === 'ar') {
                        screen.setAttribute('dir', 'rtl');
                    } else {
                        screen.setAttribute('dir', 'ltr');
                    }
                });
            });
        })();
    </script>
</body>
</html>
