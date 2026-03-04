<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Review::with(['user:id,name', 'product:id,name,slug']);

        // Filter by product
        if ($request->filled('productId')) {
            $q->where('product_id', $request->input('productId'));
        }

        // Filter by rating
        if ($request->filled('rating')) {
            $q->where('rating', $request->input('rating'));
        }

        // Filter by user
        if ($request->filled('userId')) {
            $q->where('user_id', $request->input('userId'));
        }

        // Search by comment
        if ($request->filled('search')) {
            $q->where('comment', 'like', '%' . $request->input('search') . '%');
        }

        // Sort
        $sortBy = $request->input('sortBy', 'created_at');
        $sortOrder = $request->input('sortOrder', 'desc');
        $q->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->input('limit', 20), 100);
        $reviews = $q->paginate($perPage);

        return response()->json([
            'data' => [
                'reviews' => $reviews->getCollection()->map(fn ($r) => $this->resource($r)),
                'totalResults' => $reviews->total(),
                'totalPages' => $reviews->lastPage(),
                'currentPage' => $reviews->currentPage(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $review = Review::with(['user:id,name', 'product:id,name,slug'])->findOrFail($id);
        return response()->json(['data' => $this->resource($review)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $productId = $review->product_id;
        $review->delete();

        // Update product rating
        $product = \App\Models\Product::find($productId);
        if ($product) {
            $avg = Review::where('product_id', $productId)->avg('rating');
            $count = Review::where('product_id', $productId)->count();
            $product->update([
                'average_rating' => $avg ? round($avg, 2) : 0,
                'review_count' => $count,
            ]);
        }

        return response()->json(['message' => 'Review deleted']);
    }

    private function resource(Review $r): array
    {
        return [
            'id' => $r->id,
            'userId' => $r->user_id,
            'productId' => $r->product_id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'user' => $r->relationLoaded('user') && $r->user
                ? ['id' => $r->user->id, 'name' => $r->user->name]
                : null,
            'product' => $r->relationLoaded('product') && $r->product
                ? ['id' => $r->product->id, 'name' => $r->product->name, 'slug' => $r->product->slug]
                : null,
            'createdAt' => $r->created_at->toIso8601String(),
            'updatedAt' => $r->updated_at->toIso8601String(),
        ];
    }
}
