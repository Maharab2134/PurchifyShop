<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function index(Request $request, string $productId): JsonResponse
    {
        $reviews = Review::where('product_id', $productId)
            ->with('user:id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'message' => 'Reviews fetched successfully',
            'data' => $reviews->map(fn ($r) => $this->reviewResource($r)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'productId' => ['required', 'uuid', 'exists:products,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string'],
        ]);
        $r = Review::create([
            'user_id' => Auth::id(),
            'product_id' => $validated['productId'],
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);
        $product = Product::find($validated['productId']);
        $avg = Review::where('product_id', $product->id)->avg('rating');
        $count = Review::where('product_id', $product->id)->count();
        $product->update(['average_rating' => round($avg, 2), 'review_count' => $count]);
        
        $r->load('user:id,name');
        return response()->json([
            'message' => 'Review created',
            'data' => $this->reviewResource($r),
        ], 201);
    }

    private function reviewResource(Review $r): array
    {
        return [
            'id' => $r->id,
            'userId' => $r->user_id,
            'productId' => $r->product_id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'user' => $r->relationLoaded('user') && $r->user
                ? ['id' => $r->user->id, 'name' => $r->user->name, 'avatar' => null]
                : null,
            'createdAt' => $r->created_at->toIso8601String(),
        ];
    }
}
