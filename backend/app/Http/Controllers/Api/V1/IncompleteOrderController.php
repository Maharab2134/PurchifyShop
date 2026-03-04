<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\IncompleteOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IncompleteOrderController extends Controller
{
    /**
     * POST /api/v1/incomplete-orders/track
     * Track when user visits checkout page (called from frontend)
     */
    public function track(Request $request): JsonResponse
    {
        $cart = null;
        // Try to authenticate via Sanctum guard (works even on public routes if token is sent)
        $userId = Auth::guard('sanctum')->id();
        
        if ($userId) {
            $cart = Cart::where('user_id', $userId)->where('status', 'ACTIVE')->with('cartItems.variant.product')->first();
        }
        
        // If no cart found for user, try session-based cart
        if (!$cart) {
            $sessionId = $request->header('X-Cart-Session-ID');
            if ($sessionId) {
                $cart = Cart::where('session_id', $sessionId)->where('status', 'ACTIVE')->with('cartItems.variant.product')->first();
            }
        }

        if (!$cart || $cart->cartItems->isEmpty()) {
            return response()->json(['message' => 'No active cart'], 422);
        }

        $items = $cart->cartItems->map(function ($ci) {
            return [
                'variantId' => $ci->variant_id,
                'sku' => $ci->variant->sku,
                'productName' => $ci->variant->product?->name ?? 'Unknown',
                'quantity' => $ci->quantity,
                'price' => (float) $ci->variant->discountedPrice(),
            ];
        })->toArray();

        $subtotal = $cart->cartItems->sum(fn ($ci) => (float) $ci->variant->discountedPrice() * $ci->quantity);

        // Always use currently authenticated user when logged in (so Incomplete Order shows correct name/ID)
        // Otherwise use cart's user_id or null for guests; use session_id for guest lookup
        $finalUserId = $userId ?? $cart->user_id;
        $sessionId = $request->header('X-Cart-Session-ID');

        // One incomplete order per user (or per guest session): update existing instead of creating duplicates
        $existing = null;
        if ($finalUserId) {
            $existing = IncompleteOrder::where('user_id', $finalUserId)->first();
        } elseif ($sessionId) {
            $existing = IncompleteOrder::where('session_id', $sessionId)->first();
        }

        $payload = [
            'user_id' => $finalUserId,
            'session_id' => $sessionId,
            'cart_id' => $cart->id,
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'visited_at' => now(),
        ];

        if ($existing) {
            $existing->update($payload);
        } else {
            IncompleteOrder::create($payload);
        }

        return response()->json(['message' => 'Checkout visit tracked']);
    }
}
