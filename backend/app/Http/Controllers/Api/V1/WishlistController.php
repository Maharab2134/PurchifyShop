<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    /**
     * GET /api/v1/wishlist — list wishlisted products (auth required).
     */
    public function index(): JsonResponse
    {
        $items = Wishlist::where('user_id', Auth::id())
            ->with('product.category', 'product.variants')
            ->orderByDesc('created_at')
            ->get();

        $products = $items->map(function ($w) {
            $p = $w->product;
            if (! $p) {
                return null;
            }
            $base = rtrim(config('app.url'), '/') . '/storage/';
            $imgs = is_array($p->images ?? null) ? $p->images : [];
            $images = array_map(fn ($path) => str_starts_with($path, 'http') ? $path : $base . ltrim($path, '/'), $imgs);
            $v = $p->relationLoaded('variants') ? $p->variants->first() : $p->variants()->first();
            return [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'images' => $images,
                'category' => $p->relationLoaded('category') && $p->category
                    ? ['id' => $p->category->id, 'name' => $p->category->name, 'slug' => $p->category->slug]
                    : null,
                'price' => $v ? (float) $v->price : 0,
                'wishlistId' => $w->id,
            ];
        })->filter()->values();

        return response()->json([
            'message' => 'Wishlist fetched',
            'data' => [
                'products' => $products,
                'productIds' => $items->pluck('product_id')->filter()->values()->all(),
            ],
        ]);
    }

    /**
     * POST /api/v1/wishlist — add product (auth required). Body: { productId }
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'productId' => ['required', 'uuid', 'exists:products,id'],
        ]);

        $exists = Wishlist::where('user_id', Auth::id())
            ->where('product_id', $validated['productId'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Product already in wishlist', 'data' => []], 200);
        }

        Wishlist::create([
            'user_id' => Auth::id(),
            'product_id' => $validated['productId'],
        ]);

        return response()->json(['message' => 'Added to wishlist'], 201);
    }

    /**
     * DELETE /api/v1/wishlist/{productId} — remove product (auth required).
     */
    public function destroy(string $productId): JsonResponse
    {
        Wishlist::where('user_id', Auth::id())
            ->where('product_id', $productId)
            ->delete();

        return response()->json(['message' => 'Removed from wishlist']);
    }
}
