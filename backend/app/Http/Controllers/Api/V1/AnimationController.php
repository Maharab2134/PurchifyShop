<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class AnimationController extends Controller
{
    /**
     * GET /api/v1/animation-settings
     * Public endpoint for animation and popup settings (used in user panel)
     */
    public function index(): JsonResponse
    {
        try {
            $animationSettingsRaw = Setting::getValue('animation_settings', '{}');
            $animationSettings = json_decode($animationSettingsRaw, true) ?: [];
        } catch (\Exception $e) {
            // If database error, return empty defaults
            $animationSettings = [];
        }
        
        $animationSettings = array_merge([
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
        ], is_array($animationSettings) ? $animationSettings : []);

        try {
            $popupSettingsRaw = Setting::getValue('popup_settings', '{}');
            $popupSettings = json_decode($popupSettingsRaw, true) ?: [];
        } catch (\Exception $e) {
            // If database error, return empty defaults
            $popupSettings = [];
        }
        
        $popupSettings = array_merge([
            'isActive' => false,
            'showTime' => 3000,
            'delayTime' => 1000,
            'image' => '',
            'title' => '',
            'description' => '',
            'buttonText' => '',
            'buttonLink' => '',
            'pages' => [],
        ], is_array($popupSettings) ? $popupSettings : []);

        return response()->json([
            'data' => [
                'animationSettings' => $animationSettings,
                'popupSettings' => $popupSettings,
            ],
        ]);
    }
}
