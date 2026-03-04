<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'shortDescription' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ]);
        $slug = Str::slug($validated['name']);
        $baseSlug = $slug;
        $counter = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }
        $nextSort = Category::max('sort_order');
        $nextSort = is_numeric($nextSort) ? ((int) $nextSort + 1) : 0;
        $c = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'short_description' => $validated['shortDescription'] ?? null,
            'description' => $validated['description'] ?? null,
            'images' => $validated['images'] ?? [],
            'sort_order' => $validated['sortOrder'] ?? $nextSort,
        ]);
        return response()->json(['message' => 'Category created', 'data' => ['id' => $c->id, 'name' => $c->name, 'slug' => $c->slug]], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $c = Category::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'shortDescription' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ]);
        $up = array_filter([
            'name' => $validated['name'] ?? null,
            'short_description' => $validated['shortDescription'] ?? null,
            'description' => $validated['description'] ?? null,
            'images' => $validated['images'] ?? null,
            'sort_order' => $validated['sortOrder'] ?? null,
        ], fn ($v) => $v !== null);
        if (isset($up['name'])) {
            $slug = Str::slug($up['name']);
            $baseSlug = $slug;
            $counter = 1;
            while (Category::where('slug', $slug)->where('id', '!=', $id)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            $up['slug'] = $slug;
        }
        $c->update($up);
        return response()->json(['message' => 'Category updated', 'data' => ['id' => $c->id]]);
    }

    /**
     * POST /admin/categories/reorder
     * Body: { ids: string[] } – reorder categories by IDs.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'string', 'exists:categories,id'],
        ]);

        $ids = $validated['ids'];
        foreach ($ids as $index => $id) {
            Category::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Categories reordered']);
    }

    public function destroy(string $id): JsonResponse
    {
        $c = Category::findOrFail($id);
        $images = is_array($c->images) ? $c->images : [];
        $c->delete();
        $cleanup = new ImageDeletionService();
        foreach ($images as $path) {
            $clean = $cleanup->normalizePath((string) $path);
            if ($cleanup->isAllowedPath($clean)) {
                $cleanup->deleteFromStorageIfOrphan($clean);
            }
        }
        return response()->json(['message' => 'Category deleted']);
    }
}
