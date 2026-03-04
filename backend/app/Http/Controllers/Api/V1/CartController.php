<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    /**
     * GET /api/v1/cart
     * Uses session for guests, user for authenticated. Header X-Cart-Session-ID for guest.
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $items = $cart ? $cart->cartItems()
            ->with('variant.product.brand')
            ->with('variant.sizes')
            ->with('variant.attributes')
            ->with('variant.attributes.attribute')
            ->with('size')
            ->get() : collect();
        $data = [
            'id' => $cart?->id,
            'items' => $items->map(fn ($i) => $this->cartItemResource($i)),
            'total' => 0,
            'itemCount' => 0,
        ];
        $total = 0;
        foreach ($items as $i) {
            $total += (float) $i->variant->discountedPrice() * $i->quantity;
        }
        $data['total'] = round($total, 2);
        $data['itemCount'] = $items->sum('quantity');

        return response()->json(['data' => $data]);
    }

    /**
     * POST /api/v1/cart/items
     * Body: { variantId, quantity, sizeId? } — sizeId = user-selected size; only that one is stored/shown.
     */
    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'variantId' => ['required', 'uuid', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'sizeId' => ['nullable', 'uuid', 'exists:sizes,id'],
            'selectedImage' => ['nullable', 'string', 'max:255'],
        ]);
        $selectedImage = null;
        if (array_key_exists('selectedImage', $validated)) {
            $selectedImage = trim((string) $validated['selectedImage']);
            if ($selectedImage === '') {
                $selectedImage = null;
            }
        }
        $variant = ProductVariant::with('product.brand', 'sizes', 'attributes.attribute')->findOrFail($validated['variantId']);
        if ($variant->stock < $validated['quantity']) {
            return response()->json([
                'message' => sprintf(
                    'Insufficient stock. Available: %d, requested: %d.',
                    $variant->stock,
                    $validated['quantity']
                ),
            ], 422);
        }
        $cart = $this->resolveOrCreateCart($request);
        $item = $cart->cartItems()->where('variant_id', $validated['variantId'])->first();
        $newQty = $item ? $item->quantity + $validated['quantity'] : $validated['quantity'];
        if ($variant->stock < $newQty) {
            return response()->json([
                'message' => sprintf(
                    'Insufficient stock. Available: %d, requested total: %d.',
                    $variant->stock,
                    $newQty
                ),
            ], 422);
        }
        if ($item) {
            $item->increment('quantity', $validated['quantity']);
            $updateData = [];
            if (array_key_exists('sizeId', $validated)) {
                $updateData['size_id'] = $validated['sizeId'];
            }
            if ($selectedImage !== null) {
                $updateData['selected_image'] = $selectedImage;
            }
            if (!empty($updateData)) {
                $item->update($updateData);
            }
        } else {
            $cart->cartItems()->create([
                'variant_id' => $validated['variantId'],
                'size_id' => $validated['sizeId'] ?? null,
                'selected_image' => $selectedImage,
                'quantity' => $validated['quantity'],
            ]);
        }
        return $this->index($request);
    }

    /**
     * PATCH /api/v1/cart/items/{id}
     * Body: { quantity }
     */
    public function updateItem(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:0']]);
        $cart = $this->resolveCart($request);
        if (! $cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }
        $item = $cart->cartItems()
            ->with('variant.product.brand')
            ->with('variant.sizes')
            ->with('variant.attributes')
            ->with('variant.attributes.attribute')
            ->with('size')
            ->find($id);
        if (! $item) {
            return response()->json(['message' => 'Cart item not found'], 404);
        }
        if ($validated['quantity'] === 0) {
            $item->delete();
        } else {
            if ($item->variant->stock < $validated['quantity']) {
                return response()->json([
                    'message' => sprintf(
                        'Insufficient stock. Available: %d, requested: %d.',
                        $item->variant->stock,
                        $validated['quantity']
                    ),
                ], 422);
            }
            $item->update(['quantity' => $validated['quantity']]);
        }
        return $this->index($request);
    }

    /**
     * DELETE /api/v1/cart/items/{id}
     */
    public function removeItem(Request $request, string $id): JsonResponse
    {
        $cart = $this->resolveCart($request);
        if (! $cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }
        $cart->cartItems()->where('id', $id)->delete();
        return $this->index($request);
    }

    private function resolveCart(Request $request): ?Cart
    {
        if (Auth::check()) {
            return Cart::where('user_id', Auth::id())->where('status', 'ACTIVE')->first();
        }
        $sid = $request->header('X-Cart-Session-ID');
        if (! $sid) {
            return null;
        }
        return Cart::where('session_id', $sid)->where('status', 'ACTIVE')->first();
    }

    private function resolveOrCreateCart(Request $request): Cart
    {
        $cart = $this->resolveCart($request);
        if ($cart) {
            return $cart;
        }
        
        $sid = null;
        if (! Auth::check()) {
            $sid = $request->header('X-Cart-Session-ID');
            if (! $sid) {
                abort(422, 'Send X-Cart-Session-ID header for guest cart. Generate a UUID and store in localStorage.');
            }
            
            // Check if a cart exists with this session_id (regardless of status)
            $existingCart = Cart::where('session_id', $sid)->first();
            if ($existingCart) {
                // Reactivate the existing cart
                $existingCart->update(['status' => 'ACTIVE']);
                return $existingCart;
            }
        } else {
            // For authenticated users, check if there's an inactive cart
            $existingCart = Cart::where('user_id', Auth::id())->first();
            if ($existingCart) {
                // Reactivate the existing cart
                $existingCart->update(['status' => 'ACTIVE']);
                return $existingCart;
            }
        }
        
        return Cart::create([
            'user_id' => Auth::id(),
            'session_id' => $sid,
            'status' => 'ACTIVE',
        ]);
    }

    private function cartItemResource(CartItem $i): array
    {
        $v = $i->variant;
        $p = $v->product;
        $base = rtrim(config('app.url'), '/') . '/storage/';
        $selectedImage = $i->selected_image;
        $selectedImageUrl = null;
        if ($selectedImage) {
            $selectedImageUrl = str_starts_with($selectedImage, 'http') || str_starts_with($selectedImage, 'data:')
                ? $selectedImage
                : $base . ltrim($selectedImage, '/');
        }
        
        // Get all images from both variant and product (same as ProductDetail)
        $variantImages = is_array($v->images ?? null) ? $v->images : [];
        $productImages = is_array($p?->images ?? null) ? $p->images : [];
        
        // Convert all images to full URLs
        $variantImgUrls = array_map(
            fn ($path) => str_starts_with($path, 'http') ? $path : $base . ltrim($path, '/'),
            $variantImages
        );
        $productImgUrls = array_map(
            fn ($path) => str_starts_with($path, 'http') ? $path : $base . ltrim($path, '/'),
            $productImages
        );
        
        $price = (float) $v->discountedPrice();
        $originalPrice = (float) $v->originalPrice();
        $selectedSize = ($i->relationLoaded('size') && $i->size) ? ['id' => $i->size->id, 'name' => $i->size->name] : null;
        
        // Get variant attributes (for display in cart)
        $attributes = [];
        if ($v->relationLoaded('attributes') && $v->attributes) {
            foreach ($v->attributes as $attr) {
                // Make sure the attribute relationship is loaded
                if (!$attr->relationLoaded('attribute') || !$attr->attribute) {
                    // Reload the attribute if not loaded
                    $attr->load('attribute');
                }
                
                $attrName = $attr->attribute?->name ?? null;
                $attrValue = $attr->value ?? null; // 'value' is a column, not a relationship
                
                if ($attrName && $attrValue) {
                    $attributes[] = [
                        'attribute' => [
                            'id' => $attr->attribute->id ?? '',
                            'name' => $attrName,
                        ],
                        'value' => [
                            'id' => $attr->id ?? '',
                            'value' => $attrValue,
                        ],
                    ];
                }
            }
        }
        
        return [
            'id' => $i->id,
            'variantId' => $v->id,
            'sizeId' => $i->size_id,
            'selectedSize' => $selectedSize,
            'selectedImage' => $selectedImageUrl,
            'quantity' => $i->quantity,
            'price' => $price,
            'originalPrice' => $originalPrice,
            'discountBadge' => $v->discountBadge(),
            'variant' => [
                'id' => $v->id,
                'sku' => $v->sku,
                'price' => $price,
                'originalPrice' => $originalPrice,
                'stock' => $v->stock,
                'images' => $variantImgUrls, // All variant images
                'attributes' => $attributes, // Variant attributes (color, etc.)
                'product' => $v->relationLoaded('product') && $v->product
                    ? [
                        'id' => $v->product->id,
                        'name' => $v->product->name,
                        'slug' => $v->product->slug,
                        'shortDescription' => $v->product->short_description,
                        'images' => $productImgUrls, // All product images
                        'discountedPrice' => $price,
                        'originalPrice' => $originalPrice,
                        'discountBadge' => $v->discountBadge(),
                        'isOutOfStock' => $v->stock <= 0,
                        'brand' => $v->product->relationLoaded('brand') && $v->product->brand
                            ? [
                                'id' => $v->product->brand->id,
                                'name' => $v->product->brand->name,
                                'logo' => $v->product->brand->logo ? (str_starts_with($v->product->brand->logo, 'http') ? $v->product->brand->logo : rtrim(config('app.url'), '/') . '/storage/' . ltrim($v->product->brand->logo, '/')) : null,
                            ]
                            : null,
                    ]
                    : null,
                'sizes' => $v->relationLoaded('sizes') ? $v->sizes->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values()->all() : [],
            ],
        ];
    }
}
