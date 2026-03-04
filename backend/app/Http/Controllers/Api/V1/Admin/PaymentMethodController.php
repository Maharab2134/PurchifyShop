<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    public function index(): JsonResponse
    {
        $methods = PaymentMethod::orderBy('sort_order')->orderBy('id')->get()->map(fn ($m) => $this->resource($m));
        return response()->json(['data' => $methods]);
    }

    public function show(int $id): JsonResponse
    {
        $m = PaymentMethod::findOrFail($id);
        return response()->json(['data' => $this->resource($m)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:64', 'unique:payment_methods,slug'],
            'name' => ['required', 'string', 'max:128'],
            'isActive' => ['boolean'],
            'requiresSenderAndTxn' => ['boolean'],
            'config' => ['nullable', 'array'],
            'config.number' => ['nullable', 'string', 'max:50'],
            'config.instruction' => ['nullable', 'string', 'max:500'],
            'config.accountNumber' => ['nullable', 'string', 'max:100'],
            'config.bankName' => ['nullable', 'string', 'max:100'],
            'config.branch' => ['nullable', 'string', 'max:100'],
            'config.accountHolder' => ['nullable', 'string', 'max:100'],
            'charge' => ['nullable', 'numeric', 'min:0'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ]);

        $maxSort = PaymentMethod::max('sort_order') ?? 0;
        $m = PaymentMethod::create([
            'slug' => strtolower(trim($validated['slug'])),
            'name' => trim($validated['name']),
            'is_active' => $validated['isActive'] ?? true,
            'config' => $validated['config'] ?? null,
            'charge' => $validated['charge'] ?? 0,
            'sort_order' => $validated['sortOrder'] ?? ($maxSort + 1),
        ]);

        return response()->json(['message' => 'Payment method created', 'data' => $this->resource($m)]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $m = PaymentMethod::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:128'],
            'isActive' => ['boolean'],
            'config' => ['nullable', 'array'],
            'config.number' => ['nullable', 'string', 'max:50'],
            'config.instruction' => ['nullable', 'string', 'max:500'],
            'config.accountNumber' => ['nullable', 'string', 'max:100'],
            'config.bankName' => ['nullable', 'string', 'max:100'],
            'config.branch' => ['nullable', 'string', 'max:100'],
            'config.accountHolder' => ['nullable', 'string', 'max:100'],
            'charge' => ['nullable', 'numeric', 'min:0'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ]);

        $updates = [];
        if (array_key_exists('name', $validated)) {
            $updates['name'] = trim($validated['name']);
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = (bool) $validated['isActive'];
        }
        if (array_key_exists('sortOrder', $validated)) {
            $updates['sort_order'] = (int) $validated['sortOrder'];
        }
        if (array_key_exists('charge', $validated)) {
            $updates['charge'] = (float) $validated['charge'];
        }
        if (array_key_exists('config', $validated)) {
            $config = $m->config ?? [];
            if (isset($validated['config']['number'])) {
                $config['number'] = $validated['config']['number'];
            }
            if (isset($validated['config']['instruction'])) {
                $config['instruction'] = $validated['config']['instruction'];
            }
            if (isset($validated['config']['accountNumber'])) {
                $config['accountNumber'] = $validated['config']['accountNumber'];
            }
            if (isset($validated['config']['bankName'])) {
                $config['bankName'] = $validated['config']['bankName'];
            }
            if (isset($validated['config']['branch'])) {
                $config['branch'] = $validated['config']['branch'];
            }
            if (isset($validated['config']['accountHolder'])) {
                $config['accountHolder'] = $validated['config']['accountHolder'];
            }
            $updates['config'] = $config;
        }
        $m->update($updates);

        return response()->json(['message' => 'Payment method updated', 'data' => $this->resource($m->fresh())]);
    }

    public function destroy(int $id): JsonResponse
    {
        $m = PaymentMethod::findOrFail($id);
        
        // Check if any payments use this method
        $paymentCount = \App\Models\Payment::where('method', $m->slug)->count();
        if ($paymentCount > 0) {
            return response()->json([
                'message' => "Cannot delete payment method. It is used by {$paymentCount} payment(s).",
            ], 422);
        }
        
        $m->delete();
        return response()->json(['message' => 'Payment method deleted successfully']);
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
            'charge' => (float) ($m->charge ?? 0),
            'config' => [
                'number' => $config['number'] ?? null,
                'instruction' => $config['instruction'] ?? null,
                'accountNumber' => $config['accountNumber'] ?? null,
                'bankName' => $config['bankName'] ?? null,
                'branch' => $config['branch'] ?? null,
                'accountHolder' => $config['accountHolder'] ?? null,
            ],
            'sortOrder' => $m->sort_order,
        ];
    }
}
