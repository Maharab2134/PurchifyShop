<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\ShippingOption;
use Illuminate\Http\JsonResponse;

class ShippingOptionController extends Controller
{
    /**
     * GET /api/v1/shipping-options — active only (for cart/checkout).
     * Includes freeDeliveryMinAmount for progress bar on user panel.
     */
    public function index(): JsonResponse
    {
        $options = ShippingOption::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'name' => $o->name,
                'amount' => (float) $o->amount,
                'sortOrder' => $o->sort_order,
            ]);
        $freeDeliveryMinAmount = (float) Setting::getValue('free_delivery_min_amount', 0);
        $enabled = Setting::getValue('free_delivery_progress_bar_enabled', '1');
        return response()->json([
            'data' => $options,
            'freeDeliveryMinAmount' => $freeDeliveryMinAmount,
            'freeDeliveryProgressBarEnabled' => $enabled === '1',
        ]);
    }
}
