<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingSettingsController extends Controller
{
    /**
     * GET /admin/shipping-settings — free delivery minimum amount and progress bar enabled.
     */
    public function show(): JsonResponse
    {
        $freeDeliveryMinAmount = (float) Setting::getValue('free_delivery_min_amount', 0);
        $enabled = Setting::getValue('free_delivery_progress_bar_enabled', '1');
        return response()->json([
            'data' => [
                'freeDeliveryMinAmount' => $freeDeliveryMinAmount,
                'freeDeliveryProgressBarEnabled' => $enabled === '1',
            ],
        ]);
    }

    /**
     * PUT /admin/shipping-settings — update free delivery minimum amount and progress bar enabled.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'freeDeliveryMinAmount' => ['required', 'numeric', 'min:0'],
            'freeDeliveryProgressBarEnabled' => ['sometimes', 'boolean'],
        ]);
        Setting::setValue('free_delivery_min_amount', (string) $validated['freeDeliveryMinAmount']);
        if (array_key_exists('freeDeliveryProgressBarEnabled', $validated)) {
            Setting::setValue('free_delivery_progress_bar_enabled', $validated['freeDeliveryProgressBarEnabled'] ? '1' : '0');
        }
        $freeDeliveryMinAmount = (float) Setting::getValue('free_delivery_min_amount', 0);
        $enabled = Setting::getValue('free_delivery_progress_bar_enabled', '1');
        return response()->json([
            'message' => 'Shipping settings updated',
            'data' => [
                'freeDeliveryMinAmount' => $freeDeliveryMinAmount,
                'freeDeliveryProgressBarEnabled' => $enabled === '1',
            ],
        ]);
    }
}
