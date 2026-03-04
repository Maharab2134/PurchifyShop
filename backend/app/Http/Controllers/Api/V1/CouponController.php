<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\UserCoupon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CouponController extends Controller
{
    public function index(): JsonResponse
    {
        $userCoupons = UserCoupon::where('user_id', Auth::id())
            ->where('is_used', false)
            ->with('coupon')
            ->get()
            ->filter(fn ($uc) => $uc->coupon && $uc->coupon->isValid())
            ->map(fn ($uc) => $this->resource($uc->coupon, $uc));

        return response()->json([
            'message' => 'Coupons fetched',
            'data' => $userCoupons->values(),
        ]);
    }

    public function validateCoupon(string $code): JsonResponse
    {
        $coupon = Coupon::where('code', strtoupper($code))->first();
        if (!$coupon) {
            return response()->json(['message' => 'Coupon not found'], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json(['message' => 'Coupon is not valid'], 422);
        }

        $scope = $coupon->scope ?? 'USER';
        $userCoupon = null;

        if ($scope === 'USER') {
            $userCoupon = UserCoupon::where('user_id', Auth::id())
                ->where('coupon_id', $coupon->id)
                ->where('is_used', false)
                ->first();
            if (!$userCoupon) {
                return response()->json(['message' => 'You do not have this coupon'], 403);
            }
        }

        return response()->json([
            'message' => 'Coupon is valid',
            'data' => $this->resource($coupon, $userCoupon),
        ]);
    }

    private function resource(Coupon $c, ?UserCoupon $uc = null): array
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
            'userCouponId' => $uc?->id,
        ];
    }
}
