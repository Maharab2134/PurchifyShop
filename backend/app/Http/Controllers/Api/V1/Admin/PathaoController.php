<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\PathaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PathaoController extends Controller
{
    /**
     * GET /api/v1/admin/pathao/status
     * Check if Pathao API is configured (admin panel).
     */
    public function status(): JsonResponse
    {
        $active = filter_var(Setting::getValue('pathao_active', '1'), FILTER_VALIDATE_BOOLEAN);
        $configured = PathaoService::isConfigured();

        return response()->json([
            'data' => [
                'configured' => $configured,
                'active' => $active,
                'message' => $configured
                    ? 'Configured'
                    : 'Set Client ID, Client Secret, Username and Password in Courier → Settings → Pathao Settings',
            ],
        ]);
    }

    /**
     * GET /api/v1/admin/pathao/cities
     */
    public function cities(PathaoService $pathao): JsonResponse
    {
        $result = $pathao->getCities();
        if (! ($result['success'] ?? false)) {
            $msg = $result['message'] ?? 'Failed to load cities';
            $msg = is_array($msg) ? implode(' ', $msg) : (string) $msg;
            return response()->json(['message' => $msg], 422);
        }
        return response()->json(['data' => $result['data'] ?? []]);
    }

    /**
     * GET /api/v1/admin/pathao/zones?city_id=1
     */
    public function zones(Request $request, PathaoService $pathao): JsonResponse
    {
        $cityId = (int) $request->query('city_id', 0);
        if ($cityId <= 0) {
            return response()->json(['message' => 'city_id required'], 422);
        }
        $result = $pathao->getZones($cityId);
        if (! ($result['success'] ?? false)) {
            $msg = $result['message'] ?? 'Failed to load zones';
            $msg = is_array($msg) ? implode(' ', $msg) : (string) $msg;
            return response()->json(['message' => $msg], 422);
        }
        return response()->json(['data' => $result['data'] ?? []]);
    }

    /**
     * GET /api/v1/admin/pathao/areas?zone_id=1
     */
    public function areas(Request $request, PathaoService $pathao): JsonResponse
    {
        $zoneId = (int) $request->query('zone_id', 0);
        if ($zoneId <= 0) {
            return response()->json(['message' => 'zone_id required'], 422);
        }
        $result = $pathao->getAreas($zoneId);
        if (! ($result['success'] ?? false)) {
            $msg = $result['message'] ?? 'Failed to load areas';
            $msg = is_array($msg) ? implode(' ', $msg) : (string) $msg;
            return response()->json(['message' => $msg], 422);
        }
        return response()->json(['data' => $result['data'] ?? []]);
    }
}
