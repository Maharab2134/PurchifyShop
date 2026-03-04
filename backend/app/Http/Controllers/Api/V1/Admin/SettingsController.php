<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
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
        // Keep this minimal; admin will edit/expand from UI.
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
     * GET /admin/settings
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

        $storeInfoRaw = Setting::getValue('store_info', '{}');
        $storeInfo = json_decode($storeInfoRaw, true) ?: [];
        $storeInfo = array_merge([
            'storeName' => '',
            'logo' => '',
            'address' => '',
            'email' => '',
            'phone' => '',
            'whatsappLink' => '',
            'messengerLink' => '',
        ], is_array($storeInfo) ? $storeInfo : []);

        $seoSettingsRaw = Setting::getValue('seo_settings', '{}');
        $seoSettings = json_decode($seoSettingsRaw, true) ?: [];
        $seoSettings = array_merge([
            'defaultTitle' => '',
            'defaultDescription' => '',
            'defaultKeywords' => '',
            'defaultOgImage' => '',
            'pages' => [],
        ], is_array($seoSettings) ? $seoSettings : []);

        $popupSettingsRaw = Setting::getValue('popup_settings', '{}');
        $popupSettings = json_decode($popupSettingsRaw, true) ?: [];
        $popupSettings = array_merge([
            'isActive' => false,
            'showTime' => 3000, // milliseconds
            'delayTime' => 1000, // milliseconds before showing
            'image' => '', // Popup product image
            'title' => '', // Popup title text
            'description' => '', // Popup description text
            'buttonText' => '', // Button text
            'buttonLink' => '', // Button link URL
            'pages' => [], // Array of page paths where popup should show (empty = all pages)
        ], is_array($popupSettings) ? $popupSettings : []);

        $animationSettingsRaw = Setting::getValue('animation_settings', '{}');
        $animationSettings = json_decode($animationSettingsRaw, true) ?: [];
        $animationSettings = array_merge([
            'welcomeAnimation' => [
                'isActive' => false,
                'duration' => 3000, // milliseconds
                'showConfetti' => true,
                'backgroundColor' => '#000000',
                'circleColor' => '#ffffff',
            ],
            'pageTransitionAnimation' => [
                'isActive' => false,
                'duration' => 1000, // milliseconds
                'backgroundColor' => '#000000',
                'circleColor' => '#6366f1',
            ],
        ], is_array($animationSettings) ? $animationSettings : []);

        $languageSettingsRaw = Setting::getValue('language_settings', '{}');
        $languageSettings = json_decode($languageSettingsRaw, true) ?: [];
        $languageSettings = array_replace_recursive($this->getDefaultLanguageSettings(), is_array($languageSettings) ? $languageSettings : []);

        $translationsRaw = Setting::getValue('i18n_translations', '{}');
        $translations = json_decode($translationsRaw, true) ?: [];
        $translations = array_replace_recursive($this->getDefaultTranslations(), is_array($translations) ? $translations : []);

        return response()->json([
            'data' => [
                'searchPlaceholder' => $searchPlaceholder,
                'topbar' => $topbar,
                'storeInfo' => $storeInfo,
                'seoSettings' => $seoSettings,
                'popupSettings' => $popupSettings,
                'animationSettings' => $animationSettings,
                'languageSettings' => $languageSettings,
                'translations' => $translations,
            ],
        ]);
    }

    /**
     * PUT /admin/settings
     * Body: { searchPlaceholder?: string, topbar?: object }
     */
    public function update(Request $request): JsonResponse
    {
        \Illuminate\Support\Facades\Log::info('Settings update request', ['body' => $request->all()]);
        $validated = $request->validate([
            'searchPlaceholder' => ['nullable', 'string', 'max:255'],
            'topbar' => ['nullable', 'array'],
            'topbar.isActive' => ['nullable', 'boolean'],
            'topbar.email' => ['nullable', 'string', 'max:255'],
            'topbar.phone' => ['nullable', 'string', 'max:64'],
            'topbar.bgColor' => ['nullable', 'string', 'max:32'],
            'topbar.textColor' => ['nullable', 'string', 'max:32'],
            'topbar.linkColor' => ['nullable', 'string', 'max:32'],
            'topbar.wishlistLabel' => ['nullable', 'string', 'max:64'],
            'topbar.wishlistPath' => ['nullable', 'string', 'max:255'],
            'topbar.trackOrderLabel' => ['nullable', 'string', 'max:64'],
            'topbar.trackOrderPath' => ['nullable', 'string', 'max:255'],
            'topbar.showTrackOrder' => ['nullable', 'boolean'],
            'topbar.showApplyForVendors' => ['nullable', 'boolean'],
            'topbar.applyForVendorsLabel' => ['nullable', 'string', 'max:64'],
            'topbar.applyForVendorsPath' => ['nullable', 'string', 'max:255'],
            'storeInfo' => ['nullable', 'array'],
            'storeInfo.storeName' => ['nullable', 'string', 'max:255'],
            'storeInfo.logo' => ['nullable', 'string', 'max:512'],
            'storeInfo.address' => ['nullable', 'string', 'max:1000'],
            'storeInfo.email' => ['nullable', 'string', 'email', 'max:255'],
            'storeInfo.phone' => ['nullable', 'string', 'max:64'],
            'storeInfo.whatsappLink' => ['nullable', 'string', 'max:512'],
            'storeInfo.messengerLink' => ['nullable', 'string', 'max:512'],
            'seoSettings' => ['nullable', 'array'],
            'seoSettings.defaultTitle' => ['nullable', 'string', 'max:255'],
            'seoSettings.defaultDescription' => ['nullable', 'string', 'max:500'],
            'seoSettings.defaultKeywords' => ['nullable', 'string', 'max:500'],
            'seoSettings.defaultOgImage' => ['nullable', 'string', 'max:512'],
            'seoSettings.pages' => ['nullable', 'array'],
            'seoSettings.pages.*.path' => ['required_with:seoSettings.pages', 'string', 'max:255'],
            'seoSettings.pages.*.title' => ['nullable', 'string', 'max:255'],
            'seoSettings.pages.*.description' => ['nullable', 'string', 'max:500'],
            'seoSettings.pages.*.keywords' => ['nullable', 'string', 'max:500'],
            'seoSettings.pages.*.ogImage' => ['nullable', 'string', 'max:512'],
            'popupSettings' => ['nullable', 'array'],
            'popupSettings.isActive' => ['nullable', 'boolean'],
            'popupSettings.showTime' => ['nullable', 'integer', 'min:1000', 'max:30000'],
            'popupSettings.delayTime' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'popupSettings.image' => ['nullable', 'string', 'max:512'],
            'popupSettings.title' => ['nullable', 'string', 'max:255'],
            'popupSettings.description' => ['nullable', 'string', 'max:1000'],
            'popupSettings.buttonText' => ['nullable', 'string', 'max:100'],
            'popupSettings.buttonLink' => ['nullable', 'string', 'max:512'],
            'popupSettings.pages' => ['nullable', 'array'],
            'popupSettings.pages.*' => ['nullable', 'string', 'max:255'],
            'animationSettings' => ['nullable', 'array'],
            'animationSettings.welcomeAnimation' => ['nullable', 'array'],
            'animationSettings.welcomeAnimation.isActive' => ['nullable', 'boolean'],
            'animationSettings.welcomeAnimation.duration' => ['nullable', 'integer', 'min:100', 'max:30000'],
            'animationSettings.welcomeAnimation.showConfetti' => ['nullable', 'boolean'],
            'animationSettings.welcomeAnimation.backgroundColor' => ['nullable', 'string', 'max:32'],
            'animationSettings.welcomeAnimation.circleColor' => ['nullable', 'string', 'max:32'],
            'animationSettings.pageTransitionAnimation' => ['nullable', 'array'],
            'animationSettings.pageTransitionAnimation.isActive' => ['nullable', 'boolean'],
            'animationSettings.pageTransitionAnimation.duration' => ['nullable', 'integer', 'min:100', 'max:10000'],
            'animationSettings.pageTransitionAnimation.backgroundColor' => ['nullable', 'string', 'max:32'],
            'animationSettings.pageTransitionAnimation.circleColor' => ['nullable', 'string', 'max:32'],

            'languageSettings' => ['nullable', 'array'],
            'languageSettings.isActive' => ['nullable', 'boolean'],
            'languageSettings.defaultLang' => ['nullable', 'in:en,bn'],
            'languageSettings.enabled' => ['nullable', 'array'],
            'languageSettings.enabled.en' => ['nullable', 'boolean'],
            'languageSettings.enabled.bn' => ['nullable', 'boolean'],

            // translations is a free-form nested object: { en: { ns: { key: value } }, bn: { ... } }
            'translations' => ['nullable', 'array'],
        ]);

        if (array_key_exists('searchPlaceholder', $validated)) {
            Setting::setValue('search_placeholder', $validated['searchPlaceholder'] ?? '');
        }
        if (array_key_exists('topbar', $validated) && is_array($validated['topbar'])) {
            $topbarRaw = Setting::getValue('topbar', '{}');
            $current = json_decode($topbarRaw, true) ?: [];
            $merged = array_merge([
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
            ], $current, $validated['topbar']);
            Setting::setValue('topbar', json_encode($merged));
        }
        if (array_key_exists('storeInfo', $validated) && is_array($validated['storeInfo'])) {
            $storeInfoRaw = Setting::getValue('store_info', '{}');
            $current = json_decode($storeInfoRaw, true) ?: [];
            $merged = array_merge([
                'storeName' => '',
                'logo' => '',
                'address' => '',
                'email' => '',
                'phone' => '',
                'whatsappLink' => '',
                'messengerLink' => '',
            ], $current, $validated['storeInfo']);
            Setting::setValue('store_info', json_encode($merged));
        }
        if (array_key_exists('seoSettings', $validated) && is_array($validated['seoSettings'])) {
            $seoSettingsRaw = Setting::getValue('seo_settings', '{}');
            $current = json_decode($seoSettingsRaw, true) ?: [];
            $merged = array_merge([
                'defaultTitle' => '',
                'defaultDescription' => '',
                'defaultKeywords' => '',
                'defaultOgImage' => '',
                'pages' => [],
            ], $current, $validated['seoSettings']);
            // Ensure pages array is properly structured
            if (isset($merged['pages']) && is_array($merged['pages'])) {
                $merged['pages'] = array_values(array_filter($merged['pages'], function($page) {
                    return isset($page['path']) && !empty($page['path']);
                }));
            }
            Setting::setValue('seo_settings', json_encode($merged));
        }
        if (array_key_exists('popupSettings', $validated) && is_array($validated['popupSettings'])) {
            $popupSettingsRaw = Setting::getValue('popup_settings', '{}');
            $current = json_decode($popupSettingsRaw, true) ?: [];
            $merged = array_merge([
                'isActive' => false,
                'showTime' => 3000,
                'delayTime' => 1000,
                'image' => '',
                'title' => '',
                'description' => '',
                'buttonText' => '',
                'buttonLink' => '',
                'pages' => [],
            ], $current, $validated['popupSettings']);
            // Ensure pages array is properly structured
            if (isset($merged['pages']) && is_array($merged['pages'])) {
                $merged['pages'] = array_values(array_filter($merged['pages'], function($page) {
                    return !empty($page) && is_string($page);
                }));
            }
            Setting::setValue('popup_settings', json_encode($merged));
        }
        if (array_key_exists('animationSettings', $validated) && is_array($validated['animationSettings'])) {
            $animationSettingsRaw = Setting::getValue('animation_settings', '{}');
            $current = json_decode($animationSettingsRaw, true) ?: [];
            
            // Default values
            $defaults = [
                'welcomeAnimation' => [
                    'isActive' => false,
                    'duration' => 3000,
                    'showConfetti' => true,
                    'backgroundColor' => '#000000',
                    'circleColor' => '#ffffff',
                ],
                'pageTransitionAnimation' => [
                    'isActive' => false,
                    'duration' => 1000,
                    'backgroundColor' => '#000000',
                    'circleColor' => '#6366f1',
                ],
            ];
            
            // Recursive merge: defaults -> current -> validated
            $merged = array_replace_recursive($defaults, $current, $validated['animationSettings']);
            
            Setting::setValue('animation_settings', json_encode($merged));
        }

        if (array_key_exists('languageSettings', $validated) && is_array($validated['languageSettings'])) {
            $currentRaw = Setting::getValue('language_settings', '{}');
            $current = json_decode($currentRaw, true) ?: [];
            $defaults = $this->getDefaultLanguageSettings();
            $merged = array_replace_recursive($defaults, is_array($current) ? $current : [], $validated['languageSettings']);

            // Safety: ensure at least one language is enabled
            $enEnabled = (bool)($merged['enabled']['en'] ?? false);
            $bnEnabled = (bool)($merged['enabled']['bn'] ?? false);
            if (!$enEnabled && !$bnEnabled) {
                $merged['enabled']['en'] = true;
                $merged['defaultLang'] = 'en';
            }
            // Safety: defaultLang must be enabled
            $defaultLang = $merged['defaultLang'] ?? 'en';
            if ($defaultLang === 'bn' && !$bnEnabled) $merged['defaultLang'] = $enEnabled ? 'en' : 'bn';
            if ($defaultLang === 'en' && !$enEnabled) $merged['defaultLang'] = $bnEnabled ? 'bn' : 'en';

            Setting::setValue('language_settings', json_encode($merged));
        }

        if (array_key_exists('translations', $validated) && is_array($validated['translations'])) {
            $currentRaw = Setting::getValue('i18n_translations', '{}');
            $current = json_decode($currentRaw, true) ?: [];
            $defaults = $this->getDefaultTranslations();
            $merged = array_replace_recursive($defaults, is_array($current) ? $current : [], $validated['translations']);
            Setting::setValue('i18n_translations', json_encode($merged));
        }

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

        $storeInfoRaw = Setting::getValue('store_info', '{}');
        $storeInfo = json_decode($storeInfoRaw, true) ?: [];
        $storeInfo = array_merge([
            'storeName' => '',
            'logo' => '',
            'address' => '',
            'email' => '',
            'phone' => '',
            'whatsappLink' => '',
            'messengerLink' => '',
        ], is_array($storeInfo) ? $storeInfo : []);

        $seoSettingsRaw = Setting::getValue('seo_settings', '{}');
        $seoSettings = json_decode($seoSettingsRaw, true) ?: [];
        $seoSettings = array_merge([
            'defaultTitle' => '',
            'defaultDescription' => '',
            'defaultKeywords' => '',
            'defaultOgImage' => '',
            'pages' => [],
        ], is_array($seoSettings) ? $seoSettings : []);

        return response()->json([
            'message' => 'Settings updated',
            'data' => [
                'searchPlaceholder' => $searchPlaceholder,
                'topbar' => $topbar,
                'storeInfo' => $storeInfo,
                'seoSettings' => $seoSettings,
            ],
        ]);
    }
}
