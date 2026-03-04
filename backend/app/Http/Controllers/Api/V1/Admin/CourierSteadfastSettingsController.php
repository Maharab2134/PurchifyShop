<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourierSteadfastSettingsController extends Controller
{
    /**
     * GET /api/v1/admin/courier/steadfast/settings
     * Returns Steadfast credentials for admin panel (masked for security in response if needed).
     */
    public function show(): JsonResponse
    {
        $apiKey = Setting::getValue('steadfast_api_key');
        $secretKey = Setting::getValue('steadfast_secret_key');
        $baseUrl = Setting::getValue('steadfast_base_url');
        $webhookToken = Setting::getValue('steadfast_webhook_bearer_token');
        $active = filter_var(Setting::getValue('steadfast_active', '1'), FILTER_VALIDATE_BOOLEAN);

        return response()->json([
            'data' => [
                'apiKey' => $apiKey ?? '',
                'secretKey' => $secretKey ?? '',
                'baseUrl' => $baseUrl ?? config('steadfast-courier.base_url', 'https://portal.packzy.com/api/v1'),
                'webhookBearerToken' => $webhookToken ?? '',
                'active' => $active,
            ],
        ]);
    }

    /**
     * PUT /api/v1/admin/courier/steadfast/settings
     * Save Steadfast API credentials from admin panel.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'apiKey' => ['nullable', 'string', 'max:500'],
            'secretKey' => ['nullable', 'string', 'max:500'],
            'baseUrl' => ['nullable', 'string', 'max:500'],
            'webhookBearerToken' => ['nullable', 'string', 'max:500'],
            'active' => ['nullable', 'boolean'],
        ]);

        Setting::setValue('steadfast_api_key', $validated['apiKey'] ?? '');
        Setting::setValue('steadfast_secret_key', $validated['secretKey'] ?? '');
        Setting::setValue('steadfast_base_url', trim($validated['baseUrl'] ?? '') ?: '');
        Setting::setValue('steadfast_webhook_bearer_token', $validated['webhookBearerToken'] ?? '');
        Setting::setValue('steadfast_active', isset($validated['active']) ? ($validated['active'] ? '1' : '0') : '1');

        return response()->json([
            'message' => 'Steadfast settings saved.',
            'data' => [
                'apiKey' => $validated['apiKey'] ?? '',
                'secretKey' => $validated['secretKey'] ?? '',
                'baseUrl' => trim($validated['baseUrl'] ?? '') ?: config('steadfast-courier.base_url', 'https://portal.packzy.com/api/v1'),
                'webhookBearerToken' => $validated['webhookBearerToken'] ?? '',
                'active' => filter_var(Setting::getValue('steadfast_active', '1'), FILTER_VALIDATE_BOOLEAN),
            ],
        ]);
    }
}
