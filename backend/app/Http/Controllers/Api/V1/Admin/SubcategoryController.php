<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subcategory;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubcategoryController extends Controller
{
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
        return response()->json(['data' => ['subcategories' => $data]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categoryId' => ['required', 'string', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'shortDescription' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
        ]);
        $slug = Str::slug($validated['name']);
        // Ensure unique slug
        $baseSlug = $slug;
        $counter = 1;
        while (Subcategory::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
        $s = Subcategory::create([
            'category_id' => $validated['categoryId'],
            'name' => $validated['name'],
            'slug' => $slug,
            'short_description' => $validated['shortDescription'] ?? null,
            'description' => $validated['description'] ?? null,
            'images' => $validated['images'] ?? [],
        ]);
        return response()->json(['message' => 'Subcategory created', 'data' => ['id' => $s->id, 'name' => $s->name, 'slug' => $s->slug]], 201);
    }

    public function show(string $id): JsonResponse
    {
        $s = Subcategory::with('category')->findOrFail($id);
        return response()->json([
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

    public function update(Request $request, string $id): JsonResponse
    {
        $s = Subcategory::findOrFail($id);
        $validated = $request->validate([
            'categoryId' => ['sometimes', 'string', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'shortDescription' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
        ]);
        $up = array_filter([
            'category_id' => $validated['categoryId'] ?? null,
            'name' => $validated['name'] ?? null,
            'short_description' => $validated['shortDescription'] ?? null,
            'description' => $validated['description'] ?? null,
            'images' => $validated['images'] ?? null,
        ], fn ($v) => $v !== null);
        if (isset($up['name'])) {
            $slug = Str::slug($up['name']);
            $baseSlug = $slug;
            $counter = 1;
            while (Subcategory::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            $up['slug'] = $slug;
        }
        $s->update($up);
        return response()->json(['message' => 'Subcategory updated', 'data' => ['id' => $s->id]]);
    }

    public function destroy(string $id): JsonResponse
    {
        $s = Subcategory::findOrFail($id);
        if ($s->products()->count() > 0) {
            return response()->json(['message' => 'Cannot delete subcategory with products'], 422);
        }
        $images = is_array($s->images) ? $s->images : [];
        $s->delete();
        $cleanup = new ImageDeletionService();
        foreach ($images as $path) {
            $clean = $cleanup->normalizePath((string) $path);
            if ($cleanup->isAllowedPath($clean)) {
                $cleanup->deleteFromStorageIfOrphan($clean);
            }
        }
        return response()->json(['message' => 'Subcategory deleted']);
    }
}
