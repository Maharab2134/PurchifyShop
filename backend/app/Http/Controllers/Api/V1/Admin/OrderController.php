<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use App\Models\Shipment;
use App\Services\PathaoService;
use App\Services\SteadfastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Order::with(['user', 'address', 'shippingOption', 'transaction', 'payment', 'shipment'])
            ->orderByDesc('order_date');

        $vendorId = $this->resolveVendorId();
        if ($vendorId !== null) {
            $this->applyVendorScope($q, $vendorId);
        }

        if ($request->filled('status')) {
            $q->where('status', $request->input('status'));
        }
        if ($request->filled('paymentStatus')) {
            $q->whereHas('payment', fn ($p) => $p->where('status', $request->input('paymentStatus')));
        }
        if ($request->filled('userId')) {
            $q->where('user_id', $request->input('userId'));
        }
        if ($request->filled('dateFrom')) {
            $q->where('order_date', '>=', $request->input('dateFrom'));
        }
        if ($request->filled('dateTo')) {
            $q->where('order_date', '<=', $request->input('dateTo'));
        }
        if ($request->filled('search')) {
            $term = '%' . trim($request->input('search')) . '%';
            $q->where(function ($query) use ($term, $request) {
                $query->where('id', 'like', $term)
                    ->orWhere('tracking_number', 'like', $term)
                    ->orWhere('contact_phone', 'like', $term)
                    ->orWhere('amount', 'like', $term)
                    ->orWhereHas('user', function ($u) use ($term) {
                        $u->where('name', 'like', $term)->orWhere('email', 'like', $term);
                    });
            });
        }

        // Courier management pages: Steadfast page hides Pathao orders, Pathao page hides Steadfast orders
        if ($request->filled('courierPage')) {
            $courierPage = $request->input('courierPage');
            if ($courierPage === 'steadfast') {
                $q->where(function ($query) {
                    $query->whereDoesntHave('shipment')
                        ->orWhereHas('shipment', function ($s) {
                            $s->where('courier_company', '!=', 'Pathao')->orWhereNull('courier_company');
                        });
                });
            } elseif ($courierPage === 'pathao') {
                $q->where(function ($query) {
                    $query->whereDoesntHave('shipment')
                        ->orWhereHas('shipment', function ($s) {
                            $s->where('courier_company', '!=', 'Steadfast')->orWhereNull('courier_company');
                        });
                });
            }
        }

        $perPage = $request->input('limit', 20);
        $orders = $q->paginate($perPage);
        $data = $orders->getCollection()->map(fn ($o) => $this->listResource($o));

        return response()->json([
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
        try {
        $order = Order::with([
            'user',
            'address',
            'shippingOption',
            'payment',
            'transaction',
            'shipment',
            'orderItems.variant.product.brand',
            'orderItems.variant.attributes',
            'orderItems.variant.attributes.attribute',
            'orderItems.size',
        ])->findOrFail($id);

        $vendorId = $this->resolveVendorId();
        if ($vendorId !== null) {
            $belongsToVendor = $order->orderItems()
                ->whereHas('variant.product', fn ($p) => $p->where('vendor_id', $vendorId))
                ->exists();
            if (! $belongsToVendor) {
                return response()->json(['message' => 'Order not found'], 404);
            }
        }
        
        // Ensure variant and product relationships are loaded for images
        $order->loadMissing('orderItems.variant.product.brand', 'orderItems.variant.attributes', 'orderItems.variant.attributes.attribute');

            return response()->json(['data' => $this->detailResource($order)]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Order not found',
                'error' => "No order found with ID: {$id}",
            ], 404);
        }
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:PENDING,PROCESSING,SHIPPED,IN_TRANSIT,DELIVERED,CANCELED,RETURNED,REFUNDED'],
            'courierCompany' => ['nullable', 'string', 'max:255'],
            'courierTrackingId' => ['nullable', 'string', 'max:255'],
            'dispatchDate' => ['nullable', 'date'],
            'expectedDeliveryDate' => ['nullable', 'date'],
        ]);

        $order = Order::findOrFail($id);
        
        DB::beginTransaction();
        try {
            $order->update(['status' => $validated['status']]);

            if ($order->transaction) {
                $order->transaction->update(['status' => $validated['status']]);
            }

            // Handle courier information when status is IN_TRANSIT
            if ($validated['status'] === 'IN_TRANSIT') {
                $shipment = $order->shipment;
                if (!$shipment) {
                    // Normalize empty strings to null or default values
                    $courierCompany = !empty($validated['courierCompany']) ? trim($validated['courierCompany']) : null;
                    $courierTrackingId = !empty($validated['courierTrackingId']) ? trim($validated['courierTrackingId']) : null;
                    
                    // Create shipment with required fields
                    // Use courier company as carrier, or default to 'Unknown' if not provided
                    $carrier = $courierCompany ?? 'Unknown';
                    // Use courier tracking ID as tracking number, or generate one if not provided
                    $trackingNumber = $courierTrackingId ?? $order->tracking_number ?? 'TEMP-' . $order->id;
                    
                    $shipment = Shipment::create([
                        'order_id' => $order->id,
                        'carrier' => $carrier,
                        'tracking_number' => $trackingNumber,
                        'shipped_date' => now(),
                        'courier_company' => $courierCompany,
                        'courier_tracking_id' => $courierTrackingId,
                        'dispatch_date' => !empty($validated['dispatchDate']) ? $validated['dispatchDate'] : null,
                        'expected_delivery_date' => !empty($validated['expectedDeliveryDate']) ? $validated['expectedDeliveryDate'] : null,
                    ]);
                } else {
                    // Normalize empty strings to null
                    $courierCompany = !empty($validated['courierCompany']) ? trim($validated['courierCompany']) : null;
                    $courierTrackingId = !empty($validated['courierTrackingId']) ? trim($validated['courierTrackingId']) : null;
                    $dispatchDate = !empty($validated['dispatchDate']) ? $validated['dispatchDate'] : null;
                    $expectedDeliveryDate = !empty($validated['expectedDeliveryDate']) ? $validated['expectedDeliveryDate'] : null;
                    
                    $updateData = [
                        'courier_company' => $courierCompany,
                        'courier_tracking_id' => $courierTrackingId,
                        'dispatch_date' => $dispatchDate,
                        'expected_delivery_date' => $expectedDeliveryDate,
                    ];
                    
                    // Update carrier and tracking_number if provided
                    if ($courierCompany) {
                        $updateData['carrier'] = $courierCompany;
                    }
                    if ($courierTrackingId) {
                        $updateData['tracking_number'] = $courierTrackingId;
                    }
                    
                    $shipment->update($updateData);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to update order', [
                'order_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to update order',
                'error' => $e->getMessage(),
            ], 500);
        }

        $order->load(['user', 'address', 'shippingOption', 'transaction', 'shipment', 'orderItems.variant.product.brand', 'orderItems.size']);

        return response()->json([
            'message' => 'Order status updated',
            'data' => $this->detailResource($order->fresh()),
        ]);
    }

    /**
     * POST /api/v1/admin/orders/{id}/steadfast-create
     * Create a Steadfast parcel for the order and save tracking to shipment.
     */
    public function createSteadfastParcel(string $id, SteadfastService $steadfast): JsonResponse
    {
        if (! filter_var(Setting::getValue('steadfast_active', '1'), FILTER_VALIDATE_BOOLEAN)) {
            return response()->json([
                'message' => 'Steadfast Courier service is inactive. Enable it in Courier → Settings.',
            ], 422);
        }

        $order = Order::with(['address', 'user', 'shipment'])->findOrFail($id);

        $result = $steadfast->createParcel($order);

        if ($result['success']) {
            $order->load(['user', 'address', 'shippingOption', 'payment', 'transaction', 'shipment', 'orderItems.variant.product.brand', 'orderItems.size']);
            return response()->json([
                'message' => $result['message'],
                'data' => [
                    'order' => $this->detailResource($order->fresh()),
                    'steadfast' => [
                        'consignment_id' => $result['consignment_id'],
                        'tracking_code' => $result['tracking_code'],
                    ],
                ],
            ]);
        }

        return response()->json([
            'message' => $result['message'],
            'steadfast' => $result,
        ], 422);
    }

    /**
     * GET /api/v1/admin/orders/{id}/steadfast-status
     * Check Steadfast delivery status for the order.
     */
    public function getSteadfastStatus(string $id, SteadfastService $steadfast): JsonResponse
    {
        $order = Order::with('shipment')->findOrFail($id);
        $result = $steadfast->checkStatus($order);

        if ($result['success']) {
            return response()->json([
                'data' => [
                    'delivery_status' => $result['delivery_status'],
                    'response' => $result['response'] ?? null,
                ],
            ]);
        }

        return response()->json([
            'message' => $result['message'],
            'steadfast' => $result,
        ], 422);
    }

    /**
     * POST /api/v1/admin/orders/{id}/steadfast-cancel
     * Cancel/remove Steadfast consignment for the order. Clears shipment link and sets order back to PROCESSING.
     */
    public function cancelSteadfast(string $id, SteadfastService $steadfast): JsonResponse
    {
        $order = Order::with('shipment', 'transaction')->findOrFail($id);
        $result = $steadfast->cancelConsignment($order);

        if (! $result['success']) {
            return response()->json(['message' => $result['message']], 422);
        }

        $order->load(['orderItems.variant.product.brand', 'orderItems.variant.attributes', 'orderItems.variant.attributes.attribute', 'orderItems.size', 'user', 'address', 'shipment', 'payment', 'transaction']);
        return response()->json([
            'message' => $result['message'],
            'data' => ['order' => $this->detailResource($order)],
        ]);
    }

    /**
     * POST /api/v1/admin/orders/{id}/pathao-create
     * Create a Pathao parcel for the order. Body may include pathao_city_id, pathao_zone_id, pathao_area_id.
     */
    public function createPathaoParcel(\Illuminate\Http\Request $request, string $id, PathaoService $pathao): JsonResponse
    {
        if (! filter_var(Setting::getValue('pathao_active', '1'), FILTER_VALIDATE_BOOLEAN)) {
            return response()->json([
                'message' => 'Pathao Courier service is inactive. Enable it in Courier → Settings.',
            ], 422);
        }

        $order = Order::with(['address', 'user', 'shipment'])->findOrFail($id);
        $cityId = $request->input('pathao_city_id') ? (int) $request->input('pathao_city_id') : null;
        $zoneId = $request->input('pathao_zone_id') ? (int) $request->input('pathao_zone_id') : null;
        $areaId = $request->input('pathao_area_id') ? (int) $request->input('pathao_area_id') : null;
        $result = $pathao->createParcel($order, $cityId, $zoneId, $areaId);

        if ($result['success']) {
            $order->load(['user', 'address', 'shippingOption', 'payment', 'transaction', 'shipment', 'orderItems.variant.product.brand', 'orderItems.size']);
            return response()->json([
                'message' => $result['message'],
                'data' => [
                    'order' => $this->detailResource($order->fresh()),
                    'pathao' => $result['pathao'] ?? [],
                ],
            ]);
        }

        return response()->json([
            'message' => $result['message'],
            'pathao' => $result,
        ], 422);
    }

    /**
     * GET /api/v1/admin/orders/{id}/pathao-status
     * Check Pathao delivery status (stub until API integration).
     */
    public function getPathaoStatus(string $id, PathaoService $pathao): JsonResponse
    {
        $order = Order::with('shipment')->findOrFail($id);
        $result = $pathao->checkStatus($order);

        if ($result['success']) {
            return response()->json([
                'data' => [
                    'delivery_status' => $result['delivery_status'] ?? null,
                    'response' => $result['response'] ?? null,
                ],
            ]);
        }

        return response()->json([
            'message' => $result['message'],
            'pathao' => $result,
        ], 422);
    }

    /**
     * POST /api/v1/admin/orders/{id}/pathao-cancel
     * Cancel/remove Pathao consignment for the order.
     */
    public function cancelPathao(string $id, PathaoService $pathao): JsonResponse
    {
        $order = Order::with('shipment', 'transaction')->findOrFail($id);
        $result = $pathao->cancelConsignment($order);

        if (! $result['success']) {
            return response()->json(['message' => $result['message']], 422);
        }

        $order->load(['orderItems.variant.product.brand', 'orderItems.variant.attributes', 'orderItems.variant.attributes.attribute', 'orderItems.size', 'user', 'address', 'shipment', 'payment', 'transaction']);
        return response()->json([
            'message' => $result['message'],
            'data' => ['order' => $this->detailResource($order)],
        ]);
    }

    /**
     * GET /api/v1/admin/orders/notifications
     * Get count of new orders since last viewed.
     */
    public function notifications(): JsonResponse
    {
        $user = Auth::user();
        $lastViewed = $user->last_viewed_orders_at;
        
        // If never viewed, show orders from last 24 hours
        $since = $lastViewed ?? now()->subHours(24);
        
        $vendorId = $this->resolveVendorId();
        $countQuery = Order::query()->where('created_at', '>', $since);
        if ($vendorId !== null) {
            $this->applyVendorScope($countQuery, $vendorId);
        }
        $newOrdersCount = $countQuery->count();
        
        // Get recent orders for preview
        $recentOrdersQuery = Order::with(['user:id,name,email'])
            ->where('created_at', '>', $since)
            ->orderByDesc('created_at')
            ->limit(5);
        if ($vendorId !== null) {
            $this->applyVendorScope($recentOrdersQuery, $vendorId);
        }
        $recentOrders = $recentOrdersQuery
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'userId' => $o->user_id,
                'user' => $o->relationLoaded('user') && $o->user ? [
                    'id' => $o->user->id,
                    'name' => $o->user->name,
                    'email' => $o->user->email,
                ] : null,
                'amount' => (float) $o->amount,
                'status' => $o->status,
                'orderDate' => $o->order_date?->toIso8601String(),
                'createdAt' => $o->created_at?->toIso8601String(),
            ]);

        return response()->json([
            'data' => [
                'count' => $newOrdersCount,
                'recentOrders' => $recentOrders->values()->all(),
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/orders/notifications/mark-read
     * Mark order notifications as read.
     */
    public function markNotificationsAsRead(): JsonResponse
    {
        $user = Auth::user();
        $user->update(['last_viewed_orders_at' => now()]);

        return response()->json([
            'message' => 'Notifications marked as read',
        ]);
    }

    private function resolveVendorId(): ?string
    {
        $user = Auth::user();
        if (! $user) {
            return null;
        }

        return strtoupper((string) $user->role) === 'VENDOR' ? ($user->vendor_id ?: null) : null;
    }

    private function applyVendorScope($query, string $vendorId): void
    {
        $query->whereHas('orderItems.variant.product', function ($p) use ($vendorId) {
            $p->where('vendor_id', $vendorId);
        });
    }

    private function listResource(Order $o): array
    {
        return [
            'id' => $o->id,
            'trackingNumber' => $o->tracking_number,
            'userId' => $o->user_id,
            'user' => $o->relationLoaded('user') && $o->user ? [
                'id' => $o->user->id,
                'name' => $o->user->name,
                'email' => $o->user->email,
                'phone' => $o->user->phone,
            ] : null,
            'contactPhone' => $o->contact_phone,
            'amount' => (float) $o->amount,
            'shippingAmount' => (float) ($o->shipping_amount ?? 0),
            'status' => $o->status,
            'orderDate' => $o->order_date?->toIso8601String(),
            'createdAt' => $o->created_at?->toIso8601String(),
            'transactionStatus' => $o->relationLoaded('transaction') && $o->transaction ? $o->transaction->status : null,
            'payment' => $o->relationLoaded('payment') && $o->payment ? [
                'id' => $o->payment->id,
                'method' => $o->payment->method,
                'amount' => (float) $o->payment->amount,
                'status' => $o->payment->status,
                'senderNumber' => $o->payment->sender_number,
                'transactionId' => $o->payment->transaction_id,
            ] : null,
            'shipment' => $o->relationLoaded('shipment') && $o->shipment ? [
                'carrier' => $o->shipment->carrier,
                'courierCompany' => $o->shipment->courier_company,
                'courierTrackingId' => $o->shipment->courier_tracking_id,
                'steadfastConsignmentId' => $o->shipment->steadfast_consignment_id,
                'weight' => $o->shipment->weight !== null ? (float) $o->shipment->weight : null,
            ] : null,
            'parcelWeight' => $o->parcel_weight !== null ? (float) $o->parcel_weight : null,
        ];
    }

    /**
     * PUT /api/v1/admin/orders/{id}/parcel-weight
     * Set manual parcel weight (kg) for courier create parcel.
     */
    public function updateParcelWeight(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'weight' => ['nullable', 'numeric', 'min:0', 'max:9999.99'],
        ]);
        $order = Order::findOrFail($id);
        $weight = isset($validated['weight']) && $validated['weight'] !== '' ? (float) $validated['weight'] : null;
        $order->update(['parcel_weight' => $weight]);
        return response()->json([
            'message' => 'Parcel weight updated.',
            'data' => ['parcelWeight' => $order->parcel_weight !== null ? (float) $order->parcel_weight : null],
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $order = Order::findOrFail($id);
            
            // Delete related records
            if ($order->payment) {
                $order->payment->delete();
            }
            if ($order->transaction) {
                $order->transaction->delete();
            }
            
            // Delete order items
            $order->orderItems()->delete();
            
            // Delete the order
            $order->delete();
            
            return response()->json([
                'message' => 'Order deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Order not found',
            ], 404);
        }
    }

    /**
     * GET /api/v1/admin/orders/{id}/vendor-whatsapp
     * Get WhatsApp URL for sharing order with vendor
     */
    public function vendorWhatsApp(string $id): JsonResponse
    {
        try {
            $order = Order::with([
                'orderItems.variant.product.vendor',
                'orderItems.size',
            ])->findOrFail($id);

            // Ensure relationships are loaded
            $order->loadMissing('orderItems.variant.product.vendor', 'orderItems.variant.product.brand', 'orderItems.variant.attributes', 'orderItems.variant.attributes.attribute', 'orderItems.size');

            // Group order items by vendor
            $vendorGroups = [];
            foreach ($order->orderItems as $item) {
                // Check if variant and product exist
                if (!$item->variant || !$item->variant->product) {
                    continue;
                }

                $product = $item->variant->product;
                $vendor = $product->vendor ?? null;
                
                // Skip if no vendor or no WhatsApp number
                if (!$vendor || !$vendor->whatsapp_number || trim($vendor->whatsapp_number) === '') {
                    continue;
                }

                $vendorId = $vendor->id;
                if (!isset($vendorGroups[$vendorId])) {
                    $vendorGroups[$vendorId] = [
                        'vendor' => [
                            'id' => $vendor->id,
                            'name' => $vendor->name,
                            'whatsappNumber' => $vendor->whatsapp_number,
                        ],
                        'items' => [],
                    ];
                }

                $productName = $product->name ?? 'Unknown Product';
                $sizeName = ($item->size && $item->size->name) ? $item->size->name : 'N/A';
                $quantity = (int) $item->quantity;
                
                // Get variant attributes (Color, etc.)
                $attributes = [];
                if ($item->variant && $item->variant->relationLoaded('attributes') && $item->variant->attributes) {
                    foreach ($item->variant->attributes as $attr) {
                        if (!$attr->relationLoaded('attribute') || !$attr->attribute) {
                            $attr->load('attribute');
                        }
                        $attrName = $attr->attribute?->name ?? null;
                        $attrValue = $attr->value ?? null;
                        if ($attrName && $attrValue) {
                            $attributes[] = [
                                'name' => $attrName,
                                'value' => $attrValue,
                            ];
                        }
                    }
                }
                
                // Find Color attribute
                $colorAttribute = null;
                foreach ($attributes as $attr) {
                    if (strtolower($attr['name']) === 'color') {
                        $colorAttribute = $attr['value'];
                        break;
                    }
                }

                $vendorGroups[$vendorId]['items'][] = [
                    'productName' => $productName,
                    'size' => $sizeName,
                    'quantity' => $quantity,
                    'color' => $colorAttribute, // Add color for WhatsApp message
                    'attributes' => $attributes, // All attributes
                ];
            }

            // Generate WhatsApp URLs for each vendor
            $vendorWhatsAppUrls = [];
            foreach ($vendorGroups as $vendorId => $group) {
                $vendor = $group['vendor'];
                $whatsappNumber = preg_replace('/[^0-9]/', '', $vendor['whatsappNumber']);
                
                // Skip if WhatsApp number is empty after cleaning
                if (empty($whatsappNumber)) {
                    continue;
                }
                
                // Build message - ensure it's not empty
                $orderId = $order->tracking_number ? $order->tracking_number : $order->id;
                $message = "Order ID: " . $orderId . "\n\n";
                $message .= "Products:\n";
                
                // Build product list
                $hasItems = false;
                foreach ($group['items'] as $item) {
                    $productName = isset($item['productName']) ? trim($item['productName']) : 'Unknown Product';
                    $size = isset($item['size']) ? trim($item['size']) : 'N/A';
                    $quantity = isset($item['quantity']) ? (int) $item['quantity'] : 0;
                    
                    if ($productName && $quantity > 0) {
                        // Build attribute string (Color, etc.)
                        $attrParts = [];
                        if (isset($item['color']) && $item['color']) {
                            $attrParts[] = "Color: " . $item['color'];
                        }
                        $attrString = !empty($attrParts) ? ", " . implode(", ", $attrParts) : "";
                        
                        $message .= "• " . $productName . " (Size: " . $size . $attrString . ", Qty: " . $quantity . ")\n";
                        $hasItems = true;
                    }
                }
                
                // Only create URL if message has content and items
                if (!$hasItems || trim($message) === '') {
                    continue;
                }
                
                // Ensure message ends properly
                $message = trim($message);
                $encodedMessage = urlencode($message);
                $whatsappUrl = "https://wa.me/" . $whatsappNumber . "?text=" . $encodedMessage;
                
                $vendorWhatsAppUrls[] = [
                    'vendorId' => $vendorId,
                    'vendorName' => $vendor['name'],
                    'whatsappNumber' => $vendor['whatsappNumber'],
                    'whatsappUrl' => $whatsappUrl,
                    'items' => $group['items'],
                ];
            }

            return response()->json([
                'data' => [
                    'orderId' => $order->id,
                    'trackingNumber' => $order->tracking_number ? $order->tracking_number : $order->id,
                    'vendors' => $vendorWhatsAppUrls,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Order not found',
            ], 404);
        }
    }

    private function detailResource(Order $o): array
    {
        $out = [
            'id' => $o->id,
            'trackingNumber' => $o->tracking_number,
            'userId' => $o->user_id,
            'user' => $o->relationLoaded('user') && $o->user ? [
                'id' => $o->user->id,
                'name' => $o->user->name,
                'email' => $o->user->email,
            ] : null,
            'amount' => (float) $o->amount,
            'shippingAmount' => (float) (isset($o->shipping_amount) ? $o->shipping_amount : 0),
            'status' => $o->status,
            'orderDate' => $o->order_date?->toIso8601String(),
            'createdAt' => $o->created_at?->toIso8601String(),
            'updatedAt' => $o->updated_at?->toIso8601String(),
            'shippingOption' => $o->relationLoaded('shippingOption') && $o->shippingOption ? [
                'id' => $o->shippingOption->id,
                'name' => $o->shippingOption->name,
                'amount' => (float) $o->shippingOption->amount,
            ] : null,
            'address' => $o->relationLoaded('address') && $o->address ? [
                'street' => $o->address->street,
                'city' => $o->address->city,
                'state' => $o->address->state,
                'country' => $o->address->country,
                'zip' => $o->address->zip,
                'label' => $o->address->label,
            ] : null,
            'contactPhone' => $o->contact_phone,
            'payment' => $o->relationLoaded('payment') && $o->payment ? [
                'id' => $o->payment->id,
                'method' => $o->payment->method,
                'amount' => (float) $o->payment->amount,
                'status' => $o->payment->status,
                'senderNumber' => $o->payment->sender_number,
                'transactionId' => $o->payment->transaction_id,
            ] : null,
            'transaction' => $o->relationLoaded('transaction') && $o->transaction ? [
                'id' => $o->transaction->id,
                'status' => $o->transaction->status,
                'transactionDate' => $o->transaction->transaction_date?->toIso8601String(),
            ] : null,
            'shipment' => $o->relationLoaded('shipment') && $o->shipment ? [
                'id' => $o->shipment->id,
                'carrier' => $o->shipment->carrier,
                'courierCompany' => $o->shipment->courier_company,
                'courierTrackingId' => $o->shipment->courier_tracking_id,
                'steadfastConsignmentId' => $o->shipment->steadfast_consignment_id,
                'dispatchDate' => $o->shipment->dispatch_date?->toDateString(),
                'expectedDeliveryDate' => $o->shipment->expected_delivery_date?->toDateString(),
                'trackingNumber' => $o->shipment->tracking_number,
                'weight' => $o->shipment->weight !== null ? (float) $o->shipment->weight : null,
                'shippedDate' => $o->shipment->shipped_date?->toIso8601String(),
                'deliveryDate' => $o->shipment->delivery_date?->toIso8601String(),
            ] : null,
            'parcelWeight' => $o->parcel_weight !== null ? (float) $o->parcel_weight : null,
            'orderItems' => [],
        ];

        if ($o->relationLoaded('orderItems')) {
            // Ensure variant attributes are loaded
            if (!$o->orderItems->first()?->variant?->relationLoaded('attributes')) {
                $o->loadMissing('orderItems.variant.attributes', 'orderItems.variant.attributes.attribute');
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
                        'sizeId' => $i->size_id,
                        'quantity' => (int) $i->quantity,
                        'price' => (float) $i->price,
                        'selectedImage' => $selectedImageUrl,
                        'variant' => null,
                        'size' => $i->relationLoaded('size') && $i->size ? ['id' => $i->size->id, 'name' => $i->size->name] : null,
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

                $brandData = null;
                if ($product && $product->relationLoaded('brand') && $product->brand) {
                    $brandData = [
                        'id' => $product->brand->id,
                        'name' => $product->brand->name,
                        'logo' => $product->brand->logo ? (str_starts_with($product->brand->logo, 'http') ? $product->brand->logo : $base . ltrim($product->brand->logo, '/')) : null,
                    ];
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
                        'brand' => $brandData,
                    ];
                }

                return [
                    'id' => $i->id,
                    'variantId' => $i->variant_id,
                    'sizeId' => $i->size_id,
                    'quantity' => (int) $i->quantity,
                    'price' => (float) $i->price,
                    'selectedImage' => $selectedImageUrl,
                    'variant' => [
                        'id' => $variant->id,
                        'sku' => $variant->sku,
                        'images' => $variantImgUrls,
                        'attributes' => $attributes,
                        'product' => $productData,
                    ],
                    'size' => $i->relationLoaded('size') && $i->size ? ['id' => $i->size->id, 'name' => $i->size->name] : null,
                ];
            })->toArray();
        }

        return $out;
    }

    /**
     * POST /api/v1/admin/orders/clear
     * Deletes all orders and related data (order_items, payments, transactions, shipments, addresses).
     */
    public function clear(): JsonResponse
    {
        DB::transaction(function () {
            $orderIds = Order::pluck('id')->all();
            if (empty($orderIds)) {
                return;
            }
            if (Schema::hasTable('order_items')) {
                DB::table('order_items')->whereIn('order_id', $orderIds)->delete();
            }
            if (Schema::hasTable('payments')) {
                DB::table('payments')->whereIn('order_id', $orderIds)->delete();
            }
            if (Schema::hasTable('transactions')) {
                DB::table('transactions')->whereIn('order_id', $orderIds)->delete();
            }
            if (Schema::hasTable('shipments')) {
                DB::table('shipments')->whereIn('order_id', $orderIds)->delete();
            }
            if (Schema::hasTable('addresses')) {
                DB::table('addresses')->whereIn('order_id', $orderIds)->delete();
            }
            Order::whereIn('id', $orderIds)->delete();
        });

        return response()->json(['message' => 'All orders cleared']);
    }
}
