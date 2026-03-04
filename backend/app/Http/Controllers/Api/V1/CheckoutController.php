<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\Setting;
use App\Models\ShippingOption;
use App\Models\Transaction;
use App\Models\UserCoupon;
use App\Models\EmailTemplate;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    /**
     * POST /api/v1/checkout
     * Body: addressId or full address; paymentMethodId; for bKash/Nagad/Rocket: senderNumber, transactionId.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'addressId' => ['nullable', 'uuid', 'exists:addresses,id'],
            'street' => ['required_without:addressId', 'string'],
            'city' => ['required_without:addressId', 'string'],
            'state' => ['required_without:addressId', 'string'],
            'country' => ['required_without:addressId', 'string'],
            'zip' => ['required_without:addressId', 'string'],
            'phone' => ['required', 'string'],
            'paymentMethodId' => ['required', 'integer', 'exists:payment_methods,id'],
            'senderNumber' => ['nullable', 'string'],
            'transactionId' => ['nullable', 'string', 'max:100'],
            'couponCode' => ['nullable', 'string', 'max:50'],
            'shippingOptionId' => ['nullable', 'uuid', 'exists:shipping_options,id'],
        ]);

        // Normalize phone numbers (remove non-digits, validate format)
        $phone = preg_replace('/\D/', '', $validated['phone']);
        if (!preg_match('/^01\d{9}$/', $phone)) {
            return response()->json(['message' => 'Phone number must be exactly 11 digits starting with 01.'], 422);
        }
        $validated['phone'] = $phone;

        if (!empty($validated['senderNumber'])) {
            $senderNumber = preg_replace('/\D/', '', $validated['senderNumber']);
            if (!preg_match('/^01\d{9}$/', $senderNumber)) {
                return response()->json(['message' => 'Sending number must be exactly 11 digits starting with 01.'], 422);
            }
            $validated['senderNumber'] = $senderNumber;
        }

        $pm = PaymentMethod::findOrFail($validated['paymentMethodId']);
        if (! $pm->is_active) {
            return response()->json(['message' => 'Selected payment method is not available.'], 422);
        }
        if ($pm->requiresSenderAndTxn()) {
            if (empty($validated['senderNumber']) || empty($validated['transactionId'])) {
                return response()->json(['message' => 'Sender number and transaction ID are required for this payment method.'], 422);
            }
        }
        if ($pm->requiresTransactionIdOnly()) {
            if (empty(trim($validated['transactionId'] ?? ''))) {
                return response()->json(['message' => 'Transaction ID is required. Please enter the transaction number after sending payment to the given account.'], 422);
            }
            // Bank method: also require sending account number
            $config = $pm->config ?? [];
            $isBank = ! empty($config['accountNumber'] ?? null) || ! empty($config['bankName'] ?? null);
            if ($isBank && empty(trim($validated['senderNumber'] ?? ''))) {
                return response()->json(['message' => 'Sending account number is required for bank payment.'], 422);
            }
        }

        $userId = Auth::id();
        $sessionId = $request->header('X-Cart-Session-ID');
        
        // Try to find cart by user_id first, then by session_id as fallback
        $cart = Cart::where('user_id', $userId)
            ->where('status', 'ACTIVE')
            ->first();
        
        // If no cart found by user_id, try session_id (for cases where cart was created before login)
        if (! $cart && $sessionId) {
            $cart = Cart::where('session_id', $sessionId)
                ->where('status', 'ACTIVE')
                ->first();
            
            // If found by session_id, update it to associate with user
            if ($cart && ! $cart->user_id) {
                $cart->update(['user_id' => $userId]);
            }
        }
        
        if (! $cart) {
            return response()->json(['message' => 'Cart not found. Please add items to your cart first.'], 422);
        }
        
        // Load cartItems with relationships
        $cart->load(['cartItems.variant.product', 'cartItems.size']);
        
        // Count items directly from database to ensure accuracy
        $itemCount = CartItem::where('cart_id', $cart->id)->count();
        
        if ($itemCount === 0) {
            return response()->json(['message' => 'Cart is empty. Please add items to your cart first.'], 422);
        }
        
        // Reload cartItems collection to ensure it's fresh
        $cart->load('cartItems');
        
        if ($cart->cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart items could not be loaded. Please refresh and try again.'], 422);
        }

        foreach ($cart->cartItems as $ci) {
            if ($ci->variant->stock < $ci->quantity) {
                return response()->json([
                    'message' => sprintf(
                        'Insufficient stock for %s (SKU: %s). Available: %d, requested: %d.',
                        $ci->variant->product?->name ?? 'Product',
                        $ci->variant->sku,
                        $ci->variant->stock,
                        $ci->quantity
                    ),
                ], 422);
            }
        }

        $subtotal = 0;
        foreach ($cart->cartItems as $ci) {
            $subtotal += (float) $ci->variant->discountedPrice() * $ci->quantity;
        }

        $discount = 0;
        $userCoupon = null;
        $coupon = null;
        if (!empty($validated['couponCode'])) {
            $coupon = Coupon::where('code', strtoupper($validated['couponCode']))->first();
            if ($coupon && $coupon->isValid()) {
                $scope = (string) ($coupon->scope ?? 'USER');
                if ($scope === 'ALL') {
                    $discount = $coupon->calculateDiscount($subtotal);
                } else {
                    $userCoupon = UserCoupon::where('user_id', Auth::id())
                        ->where('coupon_id', $coupon->id)
                        ->where('is_used', false)
                        ->first();
                    if ($userCoupon) {
                        $discount = $coupon->calculateDiscount($subtotal);
                    }
                }
            }
        }

        $shippingAmount = 0.0;
        $shippingOptionId = null;
        if (!empty($validated['shippingOptionId'])) {
            $shipOpt = ShippingOption::find($validated['shippingOptionId']);
            if ($shipOpt && $shipOpt->is_active) {
                $shippingAmount = (float) $shipOpt->amount;
                $shippingOptionId = $shipOpt->id;
            }
        }

        $freeDeliveryMinAmount = (float) Setting::getValue('free_delivery_min_amount', 0);
        $freeDeliveryBarEnabled = Setting::getValue('free_delivery_progress_bar_enabled', '1') === '1';
        if ($freeDeliveryBarEnabled && $freeDeliveryMinAmount > 0 && ($subtotal - $discount) >= $freeDeliveryMinAmount) {
            $shippingAmount = 0.0;
        }

        $amount = max(0, $subtotal - $discount + $shippingAmount);

        $address = null;
        if (! empty($validated['addressId'])) {
            $address = Address::where('user_id', Auth::id())->findOrFail($validated['addressId']);
        } else {
            $address = Address::create([
                'user_id' => Auth::id(),
                'street' => $validated['street'],
                'city' => $validated['city'],
                'state' => $validated['state'],
                'country' => $validated['country'],
                'zip' => $validated['zip'],
            ]);
        }

        DB::beginTransaction();
        try {
            // Generate unique tracking number
            $trackingNumber = $this->generateTrackingNumber();
            
            $order = Order::create([
                'user_id' => Auth::id(),
                'tracking_number' => $trackingNumber,
                'amount' => round($amount, 2),
                'shipping_option_id' => $shippingOptionId,
                'shipping_amount' => round($shippingAmount, 2),
                'status' => 'PENDING',
                'contact_phone' => $validated['phone'],
            ]);

            foreach ($cart->cartItems as $ci) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'variant_id' => $ci->variant_id,
                    'size_id' => $ci->size_id,
                    'selected_image' => $ci->selected_image,
                    'quantity' => $ci->quantity,
                    'price' => $ci->variant->discountedPrice(),
                ]);
                $ci->variant->reduceStock($ci->quantity);
                if ($ci->variant->product_id) {
                    Product::where('id', $ci->variant->product_id)->increment('sales_count', (int) $ci->quantity);
                }
            }

            $address->update(['order_id' => $order->id]);

            Payment::create([
                'user_id' => Auth::id(),
                'order_id' => $order->id,
                'method' => $pm->slug,
                'amount' => $order->amount,
                'status' => 'PENDING',
                'sender_number' => $validated['senderNumber'] ?? null,
                'transaction_id' => $validated['transactionId'] ?? null,
            ]);

            Transaction::create([
                'order_id' => $order->id,
                'status' => 'PENDING',
            ]);

            if ($userCoupon) {
                $userCoupon->update([
                    'is_used' => true,
                    'order_id' => $order->id,
                    'used_at' => now(),
                ]);
                $userCoupon->coupon->increment('usage_count');
            } elseif ($coupon && (string) ($coupon->scope ?? '') === 'ALL') {
                $coupon->increment('usage_count');
            }

            $cart->update(['status' => 'CONVERTED']);
            $cart->cartItems()->delete();

            DB::commit();

            // Send order_created email after address is linked so Items and Shipping address show
            $order->load(['user', 'orderItems.variant.product', 'orderItems.size', 'address', 'shippingOption']);
            $template = EmailTemplate::where('event_type', 'order_created')->where('is_enabled', true)->first();
            if ($template && $order->user && $order->user->email) {
                try {
                    $variables = EmailService::getOrderVariables($order, $order->user);
                    app(EmailService::class)->sendTemplateEmail(
                        $template,
                        $order->user->email,
                        $order->user->name,
                        $variables,
                        'Order',
                        $order->id
                    );
                } catch (\Throwable $e) {
                    Log::warning('Order created email failed: ' . $e->getMessage(), ['order_id' => $order->id]);
                }
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        return response()->json([
            'message' => 'Checkout successful',
            'data' => [
                'orderId' => $order->id,
                'trackingNumber' => $order->tracking_number,
            ],
        ], 201);
    }

    /**
     * Generate unique tracking number
     * Format: ORD-YYYYMMDD-XXXXXX (e.g., ORD-20260124-A1B2C3)
     */
    private function generateTrackingNumber(): string
    {
        do {
            $date = now()->format('Ymd');
            $random = strtoupper(substr(md5(uniqid(rand(), true)), 0, 6));
            $trackingNumber = "ORD-{$date}-{$random}";
        } while (Order::where('tracking_number', $trackingNumber)->exists());

        return $trackingNumber;
    }
}
