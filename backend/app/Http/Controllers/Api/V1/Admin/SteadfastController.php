<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\SteadfastService;
use Illuminate\Http\JsonResponse;

class SteadfastController extends Controller
{
    /**
     * GET /api/v1/admin/steadfast/status
     * Check if Steadfast API is configured (admin panel or .env) and optionally return balance.
     */
    public function status(): JsonResponse
    {
        $active = filter_var(Setting::getValue('steadfast_active', '1'), FILTER_VALIDATE_BOOLEAN);
        $apiKey = SteadfastService::getApiKey();
        $secretKey = SteadfastService::getSecretKey();
        $configured = ! empty($apiKey) && ! empty($secretKey);

        if (! $configured) {
            return response()->json([
                'data' => [
                    'configured' => false,
                    'active' => $active,
                    'message' => 'Set credentials in Courier → Steadfast Settings (or .env)',
                ],
            ]);
        }

        try {
            $service = new SteadfastService;
            $response = $service->getCurrentBalance();
            $status = $response['status'] ?? null;
            $balance = $response['current_balance'] ?? null;

            return response()->json([
                'data' => [
                    'configured' => true,
                    'active' => $active,
                    'balance' => $status === 200 ? (float) $balance : null,
                    'message' => $status === 200 ? 'API connected' : ($response['message'] ?? 'Connection check failed'),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => [
                    'configured' => true,
                    'active' => $active,
                    'balance' => null,
                    'message' => 'Connection failed: ' . $e->getMessage(),
                ],
            ]);
        }
    }
}
