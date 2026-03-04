<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Subcategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubcategoryController extends Controller
{
    /**
     * GET /api/v1/subcategories
     * Returns all subcategories, optionally filtered by categoryId
     */
    public function index(Request $request): JsonResponse
    {
        $query = Subcategory::with('category');
        if ($request->has('categoryId')) {
            $query->where('category_id', $request->input('categoryId'));
        }
        $subcategories = $query->orderBy('name')->get();
        $data = $subcategories->map(fn ($s) => [
            'id' => $s->id,
            'categoryId' => $s->category_id,
            'category' => $s->category ? ['id' => $s->category->id, 'name' => $s->category->name] : null,
            'name' => $s->name,
            'slug' => $s->slug,
            'description' => $s->description,
            'shortDescription' => $s->short_description,
            'images' => $s->images ?? [],
            'productsCount' => $s->products()->count(),
        ]);
        return response()->json([
            'message' => 'Subcategories fetched successfully',
            'data' => ['subcategories' => $data],
        ]);
    }

    /**
     * GET /api/v1/subcategories/{id}
     */
    public function show(string $id): JsonResponse
    {
        $s = Subcategory::with('category')->findOrFail($id);
        return response()->json([
            'message' => 'Subcategory fetched successfully',
            'data' => [
                'id' => $s->id,
                'categoryId' => $s->category_id,
                'category' => $s->category ? ['id' => $s->category->id, 'name' => $s->category->name] : null,
                'name' => $s->name,
                'slug' => $s->slug,
                'description' => $s->description,
                'shortDescription' => $s->short_description,
                'images' => $s->images ?? [],
                'productsCount' => $s->products()->count(),
            ],
        ]);
    }
}
