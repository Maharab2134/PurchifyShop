<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingOptionController extends Controller
{
    public function index(): JsonResponse
    {
        $options = ShippingOption::orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn ($o) => $this->resource($o));
        return response()->json(['data' => $options]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ]);
        $option = ShippingOption::create([
            'name' => $validated['name'],
            'amount' => $validated['amount'],
            'sort_order' => $validated['sortOrder'] ?? 0,
            'is_active' => true,
        ]);
        return response()->json(['message' => 'Shipping option created', 'data' => $this->resource($option)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $option = ShippingOption::findOrFail($id);
        return response()->json(['data' => $this->resource($option)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $option = ShippingOption::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['boolean'],
        ]);
        $updates = [];
        if (array_key_exists('name', $validated)) {
            $updates['name'] = $validated['name'];
        }
        if (array_key_exists('amount', $validated)) {
            $updates['amount'] = $validated['amount'];
        }
        if (array_key_exists('sortOrder', $validated)) {
            $updates['sort_order'] = $validated['sortOrder'];
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = (bool) $validated['isActive'];
        }
        $option->update($updates);
        return response()->json(['message' => 'Shipping option updated', 'data' => $this->resource($option->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $option = ShippingOption::findOrFail($id);
        $option->delete();
        return response()->json(['message' => 'Shipping option deleted']);
    }

    private function resource(ShippingOption $o): array
    {
        return [
            'id' => $o->id,
            'name' => $o->name,
            'amount' => (float) $o->amount,
            'sortOrder' => $o->sort_order,
            'isActive' => (bool) $o->is_active,
            'createdAt' => $o->created_at->toIso8601String(),
            'updatedAt' => $o->updated_at->toIso8601String(),
        ];
    }
}
