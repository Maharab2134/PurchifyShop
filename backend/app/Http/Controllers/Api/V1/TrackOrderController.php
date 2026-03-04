<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackOrderController extends Controller
{
    /**
     * POST /api/v1/track-order
     * Public endpoint to track order by tracking_number + phone.
     * Body: { trackingNumber: string, phone: string }
     */
    public function track(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trackingNumber' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string'],
        ]);

        $trackingNumber = trim($validated['trackingNumber']);
        // Normalize phone number (remove non-digits, validate format)
        $phone = preg_replace('/\D/', '', $validated['phone']);
        if (!preg_match('/^01\d{9}$/', $phone)) {
            return response()->json(['message' => 'Phone number must be exactly 11 digits starting with 01.'], 422);
        }

        // Find order by tracking_number
        $order = Order::where('tracking_number', $trackingNumber)
            ->with([
                'orderItems.variant.product',
                'orderItems.variant.attributes',
                'orderItems.variant.attributes.attribute',
                'orderItems.size',
                'address',
                'shipment',
                'payment',
                'user',
            ])
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'Order not found. Please check your tracking number.',
            ], 404);
        }

        // Verify phone matches: Check user's phone, order's contact_phone, or payment sender_number
        // Priority: user.phone > order.contact_phone > payment.sender_number
        $normalizedInput = preg_replace('/[^0-9]/', '', $phone);
        $phoneMatch = false;
        
        // Check user's phone number
        if ($order->user && $order->user->phone) {
            $normalizedUserPhone = preg_replace('/[^0-9]/', '', $order->user->phone);
            if ($normalizedInput === $normalizedUserPhone) {
                $phoneMatch = true;
            }
        }
        
        // If not matched, check order's contact_phone
        if (!$phoneMatch && $order->contact_phone) {
            $normalizedContactPhone = preg_replace('/[^0-9]/', '', $order->contact_phone);
            if ($normalizedInput === $normalizedContactPhone) {
                $phoneMatch = true;
            }
        }
        
        // If still not matched, check payment sender_number (for digital payments)
        if (!$phoneMatch && $order->payment && $order->payment->sender_number) {
            $normalizedPayment = preg_replace('/[^0-9]/', '', $order->payment->sender_number);
            if ($normalizedInput === $normalizedPayment) {
                $phoneMatch = true;
            }
        }
        
        if (!$phoneMatch) {
            return response()->json([
                'message' => 'Phone number does not match. Please verify the phone number used during order placement.',
            ], 403);
        }

        // Return order details (same format as OrderController)
        $orderData = $this->orderResource($order, true);

        return response()->json([
            'message' => 'Order found successfully',
            'data' => $orderData,
        ]);
    }

    /**
     * Format order resource (same as OrderController::orderResource)
     */
    private function orderResource(Order $o, bool $includeItems = false): array
    {
        $out = [
            'id' => $o->id,
            'trackingNumber' => $o->tracking_number,
            'userId' => $o->user_id,
            'amount' => (float) $o->amount,
            'orderDate' => $o->order_date?->toIso8601String(),
            'status' => $o->status,
            'createdAt' => $o->created_at?->toIso8601String(),
            'updatedAt' => $o->updated_at?->toIso8601String(),
        ];
        if ($includeItems) {
            if (!$o->relationLoaded('orderItems')) {
                $o->loadMissing('orderItems.variant.product', 'orderItems.variant.attributes', 'orderItems.variant.attributes.attribute', 'orderItems.size');
            }
            
            $base = rtrim(config('app.url'), '/') . '/storage/';
            $out['orderItems'] = $o->orderItems->map(function ($i) use ($base) {
                $variant = $i->relationLoaded('variant') ? $i->variant : null;
                $product = $variant && $variant->relationLoaded('product') ? $variant->product : null;

                $selectedImage = $i->selected_image;
                $selectedImageUrl = null;
                if ($selectedImage) {
                    $selectedImageUrl = str_starts_with($selectedImage, 'http') || str_starts_with($selectedImage, 'data:')
                        ? $selectedImage
                        : $base . ltrim($selectedImage, '/');
                }

                if (! $variant) {
                    return [
                        'id' => $i->id,
                        'variantId' => $i->variant_id,
                        'quantity' => (int) $i->quantity,
                        'price' => (float) $i->price,
                        'selectedImage' => $selectedImageUrl,
                        'size' => $i->relationLoaded('size') && $i->size ? ['id' => $i->size->id, 'name' => $i->size->name] : null,
                        'variant' => null,
                    ];
                }

                $variantImages = is_array($variant->images ?? null) ? $variant->images : [];
                $productImages = $product ? (is_array($product->images ?? null) ? $product->images : []) : [];
                $variantImgUrls = array_map(fn ($path) => str_starts_with($path, 'http') ? $path : $base . ltrim($path, '/'), $variantImages);
                $productImgUrls = array_map(fn ($path) => str_starts_with($path, 'http') ? $path : $base . ltrim($path, '/'), $productImages);

                $attributes = [];
                if ($variant->relationLoaded('attributes') && $variant->attributes) {
                    foreach ($variant->attributes as $attr) {
                        if (! $attr->relationLoaded('attribute') || ! $attr->attribute) {
                            $attr->load('attribute');
                        }
                        $attrName = $attr->attribute?->name ?? null;
                        $attrValue = $attr->value ?? null;
                        if ($attrName && $attrValue) {
                            $attributes[] = [
                                'attribute' => ['id' => $attr->attribute->id ?? '', 'name' => $attrName],
                                'value' => ['id' => $attr->id ?? '', 'value' => $attrValue],
                            ];
                        }
                    }
                }

                $productData = null;
                if ($product) {
                    $productData = [
                        'id' => $product->id,
                        'name' => $product->name,
                        'slug' => $product->slug,
                        'images' => $productImgUrls,
                        'shortDescription' => $product->short_description ?? null,
                        'description' => $product->description ?? null,
                    ];
                }

                return [
                    'id' => $i->id,
                    'variantId' => $i->variant_id,
                    'quantity' => (int) $i->quantity,
                    'price' => (float) $i->price,
                    'selectedImage' => $selectedImageUrl,
                    'size' => $i->relationLoaded('size') && $i->size ? ['id' => $i->size->id, 'name' => $i->size->name] : null,
                    'variant' => [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'images' => $variantImgUrls,
                        'attributes' => $attributes,
                        'product' => $productData,
                    ],
                ];
            })->toArray();
            $out['address'] = $o->relationLoaded('address') && $o->address ? [
                'street' => $o->address->street,
                'city' => $o->address->city,
                'state' => $o->address->state,
                'country' => $o->address->country,
                'zip' => $o->address->zip,
            ] : null;
            $out['shipment'] = $o->relationLoaded('shipment') && $o->shipment ? [
                'carrier' => $o->shipment->carrier,
                'courierCompany' => $o->shipment->courier_company,
                'courierTrackingId' => $o->shipment->courier_tracking_id,
                'dispatchDate' => $o->shipment->dispatch_date?->toDateString(),
                'expectedDeliveryDate' => $o->shipment->expected_delivery_date?->toDateString(),
                'trackingNumber' => $o->shipment->tracking_number,
                'shippedDate' => $o->shipment->shipped_date?->toIso8601String(),
                'deliveryDate' => $o->shipment->delivery_date?->toIso8601String(),
            ] : null;
            $out['transaction'] = $o->relationLoaded('transaction') && $o->transaction
                ? ['id' => $o->transaction->id, 'status' => $o->transaction->status]
                : null;
            $out['payment'] = $o->relationLoaded('payment') && $o->payment
                ? [
                    'id' => $o->payment->id,
                    'method' => $o->payment->method,
                    'amount' => (float) $o->payment->amount,
                    'status' => $o->payment->status,
                    'senderNumber' => $o->payment->sender_number,
                    'transactionId' => $o->payment->transaction_id,
                ]
                : null;
            $out['shippingAmount'] = $o->shipping_amount ? (float) $o->shipping_amount : 0;
        }
        return $out;
    }
}
