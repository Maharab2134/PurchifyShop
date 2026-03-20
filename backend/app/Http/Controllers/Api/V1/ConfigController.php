<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    private function getDefaultLanguageSettings(): array
    {
        return [
            'isActive' => true,
            'defaultLang' => 'en',
            'enabled' => [
                'en' => true,
                'bn' => true,
            ],
        ];
    }

    private function getDefaultTranslations(): array
    {
        return [
            'en' => [
                'common' => [
                    'language.en' => 'English',
                    'language.bn' => 'বাংলা',
                ],
            ],
            'bn' => [
                'common' => [
                    'language.en' => 'English',
                    'language.bn' => 'বাংলা',
                ],
            ],
        ];
    }

    /**
     * GET /api/v1/config
     * Public config (e.g. search placeholder, top bar for storefront).
     */
    public function index(): JsonResponse
    {
        $searchPlaceholder = Setting::getValue('search_placeholder', 'Search products, brands...');
        $topbarRaw = Setting::getValue('topbar', '{}');
        $topbar = json_decode($topbarRaw, true) ?: [];
        $topbar = array_merge([
            'isActive' => true,
            'email' => '',
            'phone' => '',
            'bgColor' => '#ffffff',
            'textColor' => '#374151',
            'linkColor' => '#4f46e5',
            'wishlistLabel' => 'My Wishlist',
            'wishlistPath' => '/wishlist',
            'trackOrderLabel' => 'Track Order',
            'trackOrderPath' => '/track-order',
            'showTrackOrder' => true,
            'showApplyForVendors' => false,
            'applyForVendorsLabel' => 'Apply for Vendors',
            'applyForVendorsPath' => '/apply-vendor',
        ], is_array($topbar) ? $topbar : []);

        $languageSettingsRaw = Setting::getValue('language_settings', '{}');
        $languageSettings = json_decode($languageSettingsRaw, true) ?: [];
        $languageSettings = array_replace_recursive($this->getDefaultLanguageSettings(), is_array($languageSettings) ? $languageSettings : []);

        $translationsRaw = Setting::getValue('i18n_translations', '{}');
        $translations = json_decode($translationsRaw, true) ?: [];
        $translations = array_replace_recursive($this->getDefaultTranslations(), is_array($translations) ? $translations : []);

        $pixelSettingsRaw = Setting::getValue('pixel_settings', '{}');
        $pixelSettings = json_decode($pixelSettingsRaw, true) ?: [];
        $pixelSettings = array_merge([
            'isActive' => false,
            'metaPixelId' => '',
            'googleTagManagerId' => '',
            'googleAnalyticsId' => '',
        ], is_array($pixelSettings) ? $pixelSettings : []);

        return response()->json([
            'message' => 'Config fetched successfully',
            'data' => [
                'searchPlaceholder' => $searchPlaceholder,
                'topbar' => $topbar,
                'languageSettings' => $languageSettings,
                'translations' => $translations,
                'pixelSettings' => $pixelSettings,
            ],
        ]);
    }
}
