<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;

class PaymentMethodController extends Controller
{
    /**
     * GET /api/v1/payment-methods — active only (for checkout).
     */
    public function index(): JsonResponse
    {
        $methods = PaymentMethod::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($m) => $this->resource($m));

        return response()->json([
            'message' => 'Payment methods fetched',
            'data' => $methods,
        ]);
    }

    private function resource(PaymentMethod $m): array
    {
        $config = $m->config ?? [];
        return [
            'id' => $m->id,
            'slug' => $m->slug,
            'name' => $m->name,
            'isActive' => (bool) $m->is_active,
            'requiresSenderAndTxn' => $m->requiresSenderAndTxn(),
            'requiresTransactionIdOnly' => $m->requiresTransactionIdOnly(),
            'charge' => (float) ($m->charge ?? 0),
            'config' => [
                'number' => $config['number'] ?? null,
                'instruction' => $config['instruction'] ?? null,
                'accountNumber' => $config['accountNumber'] ?? null,
                'bankName' => $config['bankName'] ?? null,
                'branch' => $config['branch'] ?? null,
                'accountHolder' => $config['accountHolder'] ?? null,
            ],
        ];
    }
}
