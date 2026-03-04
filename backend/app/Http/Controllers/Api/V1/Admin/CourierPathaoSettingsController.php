<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourierPathaoSettingsController extends Controller
{
    /**
     * GET /api/v1/admin/courier/pathao/settings
     */
    public function show(): JsonResponse
    {
        $apiKey = Setting::getValue('pathao_api_key');
        $secretKey = Setting::getValue('pathao_secret_key');
        $baseUrl = Setting::getValue('pathao_base_url');
        $storeId = Setting::getValue('pathao_store_id');
        $username = Setting::getValue('pathao_username');
        $active = filter_var(Setting::getValue('pathao_active', '1'), FILTER_VALIDATE_BOOLEAN);

        return response()->json([
            'data' => [
                'apiKey' => $apiKey ?? '',
                'secretKey' => $secretKey ?? '',
                'baseUrl' => $baseUrl ?? 'https://api-hermes.pathao.com',
                'storeId' => $storeId ?? '',
                'username' => $username ?? '',
                'active' => $active,
            ],
        ]);
    }

    /**
     * PUT /api/v1/admin/courier/pathao/settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'apiKey' => ['nullable', 'string', 'max:500'],
            'secretKey' => ['nullable', 'string', 'max:500'],
            'baseUrl' => ['nullable', 'string', 'max:500'],
            'storeId' => ['nullable', 'string', 'max:100'],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'max:500'],
            'active' => ['nullable', 'boolean'],
        ]);

        Setting::setValue('pathao_api_key', $validated['apiKey'] ?? '');
        Setting::setValue('pathao_secret_key', $validated['secretKey'] ?? '');
        Setting::setValue('pathao_base_url', trim($validated['baseUrl'] ?? '') ?: '');
        Setting::setValue('pathao_store_id', trim($validated['storeId'] ?? '') ?: '');
        if (array_key_exists('username', $validated)) {
            Setting::setValue('pathao_username', $validated['username'] ?? '');
        }
        if (array_key_exists('password', $validated) && (string) ($validated['password'] ?? '') !== '') {
            Setting::setValue('pathao_password', $validated['password']);
        }
        Setting::setValue('pathao_active', isset($validated['active']) ? ($validated['active'] ? '1' : '0') : '1');

        return response()->json([
            'message' => 'Pathao settings saved.',
            'data' => [
                'apiKey' => $validated['apiKey'] ?? '',
                'secretKey' => $validated['secretKey'] ?? '',
                'baseUrl' => trim($validated['baseUrl'] ?? '') ?: 'https://api-hermes.pathao.com',
                'storeId' => trim($validated['storeId'] ?? '') ?: '',
                'username' => $validated['username'] ?? '',
                'active' => filter_var(Setting::getValue('pathao_active', '1'), FILTER_VALIDATE_BOOLEAN),
            ],
        ]);
    }
}
