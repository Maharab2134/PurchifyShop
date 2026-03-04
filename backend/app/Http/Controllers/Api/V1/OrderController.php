<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::where('user_id', Auth::id())
            ->with([
                'orderItems.variant.product',
                'orderItems.variant.attributes',
                'orderItems.variant.attributes.attribute',
                'orderItems.size',
                'address',
                'shipment',
                'transaction',
                'payment',
            ])
            ->orderByDesc('order_date')
            ->paginate($request->input('limit', 20));

        $data = $orders->getCollection()->map(fn ($o) => $this->orderResource($o, true));
        return response()->json([
            'message' => 'Orders fetched successfully',
            'data' => [
                'orders' => $data,
                'totalResults' => $orders->total(),
                'totalPages' => $orders->lastPage(),
                'currentPage' => $orders->currentPage(),
                'resultsPerPage' => $orders->perPage(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $order = Order::with([
            'orderItems.variant.product',
            'orderItems.variant.attributes',
            'orderItems.variant.attributes.attribute',
            'orderItems.size',
            'address',
            'shipment',
            'transaction',
            'payment',
            'user',
        ])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        return response()->json([
            'message' => 'Order fetched successfully',
            'data' => $this->orderResource($order, true),
        ]);
    }

    public function cancel(string $id): JsonResponse
    {
        $order = Order::with(['orderItems.variant', 'payment', 'transaction'])
            ->where('user_id', Auth::id())
            ->findOrFail($id);

        // Check if order can be cancelled
        // User can only cancel if status is PENDING
        // Once admin changes to PROCESSING or beyond, user cannot cancel
        if ($order->status !== 'PENDING') {
            return response()->json([
                'message' => 'Order cannot be cancelled. Order is already being processed.',
            ], 422);
        }

        // Update order status to CANCELED
        $order->status = 'CANCELED';
        $order->save();

        // Update payment status if exists
        if ($order->payment) {
            $order->payment->status = 'CANCELED';
            $order->payment->save();
        }

        // Update transaction status if exists
        if ($order->transaction) {
            $order->transaction->status = 'CANCELED';
            $order->transaction->save();
        }

        // Restore stock for order items
        foreach ($order->orderItems as $item) {
            if ($item->variant) {
                $item->variant->increment('stock', $item->quantity);
            }
        }

        return response()->json([
            'message' => 'Order cancelled successfully',
            'data' => $this->orderResource($order->fresh(), true),
        ]);
    }

    private function orderResource(Order $o, bool $includeItems = false): array
    {
        $out = [
            'id' => $o->id,
            'trackingNumber' => $o->tracking_number,
            'userId' => $o->user_id,
            'contactPhone' => $o->contact_phone,
            'amount' => (float) $o->amount,
            'orderDate' => $o->order_date?->toIso8601String(),
            'status' => $o->status,
            'createdAt' => $o->created_at?->toIso8601String(),
            'updatedAt' => $o->updated_at?->toIso8601String(),
        ];
        if ($includeItems) {
            // Ensure orderItems are loaded
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
