<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class StoreInfoController extends Controller
{
    /**
     * GET /api/v1/store-info
     * Public endpoint to get store information (used throughout the project)
     */
    public function index(): JsonResponse
    {
        try {
            $storeInfoRaw = Setting::getValue('store_info', '{}');
            $storeInfo = json_decode($storeInfoRaw, true) ?: [];
        } catch (\Exception $e) {
            // If database error, return empty defaults
            $storeInfo = [];
        }
        
        $storeInfo = array_merge([
            'storeName' => '',
            'logo' => '',
            'address' => '',
            'email' => '',
            'phone' => '',
            'whatsappLink' => '',
            'messengerLink' => '',
        ], is_array($storeInfo) ? $storeInfo : []);

        return response()->json([
            'message' => 'Store information fetched successfully',
            'data' => $storeInfo,
        ]);
    }
}
