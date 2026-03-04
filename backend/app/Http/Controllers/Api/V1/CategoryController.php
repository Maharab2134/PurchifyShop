<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * GET /api/v1/categories
     */
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('sort_order')->orderBy('name')->get()->map(fn ($c) => $this->categoryResource($c));
        return response()->json([
            'message' => 'Categories fetched successfully',
            'data' => $categories,
        ]);
    }

    /**
     * GET /api/v1/categories/{id}
     */
    public function show(string $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        return response()->json([
            'message' => 'Category fetched successfully',
            'data' => $this->categoryResource($category),
        ]);
    }

    private function categoryResource(Category $c): array
    {
        $imgs = $c->images ?? [];
        $base = rtrim(config('app.url'), '/') . '/storage/';
        $images = array_map(fn ($p) => str_starts_with($p, 'http') ? $p : $base . ltrim($p, '/'), is_array($imgs) ? $imgs : []);
        return [
            'id' => $c->id,
            'slug' => $c->slug,
            'name' => $c->name,
            'description' => $c->description,
            'shortDescription' => $c->short_description,
            'images' => $images,
            'sortOrder' => $c->sort_order,
            'createdAt' => $c->created_at?->toIso8601String(),
            'updatedAt' => $c->updated_at?->toIso8601String(),
        ];
    }
}
