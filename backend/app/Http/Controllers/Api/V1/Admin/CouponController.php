<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\User;
use App\Models\UserCoupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index(): JsonResponse
    {
        $coupons = Coupon::orderByDesc('created_at')->get()->map(fn ($c) => $this->resource($c));
        return response()->json(['data' => $coupons]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'in:PERCENTAGE,FIXED'],
            'value' => ['required', 'numeric', 'min:0'],
            'minPurchase' => ['nullable', 'numeric', 'min:0'],
            'maxDiscount' => ['nullable', 'numeric', 'min:0'],
            'validFrom' => ['required', 'date'],
            'validUntil' => ['required', 'date', 'after:validFrom'],
            'usageLimit' => ['nullable', 'integer', 'min:1'],
            'isActive' => ['boolean'],
            'scope' => ['nullable', 'string', 'in:ALL,USER'],
        ]);

        $scope = $validated['scope'] ?? 'USER';
        $coupon = Coupon::create([
            'code' => strtoupper($validated['code']),
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_purchase' => $validated['minPurchase'] ?? 0,
            'max_discount' => $validated['maxDiscount'] ?? null,
            'valid_from' => $validated['validFrom'],
            'valid_until' => $validated['validUntil'],
            'usage_limit' => $validated['usageLimit'] ?? null,
            'is_active' => $validated['isActive'] ?? true,
            'scope' => $scope,
        ]);

        return response()->json(['message' => 'Coupon created', 'data' => $this->resource($coupon)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $coupon = Coupon::with('userCoupons.user:id,name,email')->findOrFail($id);
        return response()->json(['data' => $this->resource($coupon)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $validated = $request->validate([
            'code' => ['sometimes', 'string', 'max:50', 'unique:coupons,code,' . $id],
            'name' => ['sometimes', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', 'in:PERCENTAGE,FIXED'],
            'value' => ['sometimes', 'numeric', 'min:0'],
            'minPurchase' => ['nullable', 'numeric', 'min:0'],
            'maxDiscount' => ['nullable', 'numeric', 'min:0'],
            'validFrom' => ['sometimes', 'date'],
            'validUntil' => ['sometimes', 'date', 'after:validFrom'],
            'usageLimit' => ['nullable', 'integer', 'min:1'],
            'isActive' => ['boolean'],
            'scope' => ['sometimes', 'string', 'in:ALL,USER'],
        ]);

        $updates = [];
        if (isset($validated['code'])) {
            $updates['code'] = strtoupper($validated['code']);
        }
        if (isset($validated['name'])) {
            $updates['name'] = $validated['name'];
        }
        if (array_key_exists('description', $validated)) {
            $updates['description'] = $validated['description'];
        }
        if (isset($validated['type'])) {
            $updates['type'] = $validated['type'];
        }
        if (isset($validated['value'])) {
            $updates['value'] = $validated['value'];
        }
        if (array_key_exists('minPurchase', $validated)) {
            $updates['min_purchase'] = $validated['minPurchase'] ?? 0;
        }
        if (array_key_exists('maxDiscount', $validated)) {
            $updates['max_discount'] = $validated['maxDiscount'];
        }
        if (isset($validated['validFrom'])) {
            $updates['valid_from'] = $validated['validFrom'];
        }
        if (isset($validated['validUntil'])) {
            $updates['valid_until'] = $validated['validUntil'];
        }
        if (array_key_exists('usageLimit', $validated)) {
            $updates['usage_limit'] = $validated['usageLimit'];
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = (bool) $validated['isActive'];
        }
        if (isset($validated['scope'])) {
            $updates['scope'] = $validated['scope'];
        }

        $coupon->update($updates);
        return response()->json(['message' => 'Coupon updated', 'data' => $this->resource($coupon->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();
        return response()->json(['message' => 'Coupon deleted']);
    }

    public function assignToUser(Request $request, string $id): JsonResponse
    {
        $coupon = Coupon::findOrFail($id);
        if ((string) ($coupon->scope ?? 'USER') !== 'USER') {
            return response()->json(['message' => 'This coupon is for everyone; user assignment is not needed.'], 422);
        }
        $validated = $request->validate([
            'userId' => ['required', 'uuid', 'exists:users,id'],
        ]);

        $user = User::findOrFail($validated['userId']);
        $exists = UserCoupon::where('user_id', $user->id)
            ->where('coupon_id', $coupon->id)
            ->where('is_used', false)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'User already has this unused coupon'], 422);
        }

        UserCoupon::create([
            'user_id' => $user->id,
            'coupon_id' => $coupon->id,
            'is_used' => false,
        ]);

        return response()->json(['message' => 'Coupon assigned to user'], 201);
    }

    private function resource(Coupon $c): array
    {
        return [
            'id' => $c->id,
            'code' => $c->code,
            'name' => $c->name,
            'description' => $c->description,
            'type' => $c->type,
            'value' => (float) $c->value,
            'minPurchase' => (float) $c->min_purchase,
            'maxDiscount' => $c->max_discount ? (float) $c->max_discount : null,
            'validFrom' => $c->valid_from->toDateString(),
            'validUntil' => $c->valid_until->toDateString(),
            'usageLimit' => $c->usage_limit,
            'usageCount' => $c->usage_count,
            'isActive' => (bool) $c->is_active,
            'scope' => (string) ($c->scope ?? 'USER'),
            'isValid' => $c->isValid(),
            'createdAt' => $c->created_at->toIso8601String(),
            'updatedAt' => $c->updated_at->toIso8601String(),
        ];
    }
}
