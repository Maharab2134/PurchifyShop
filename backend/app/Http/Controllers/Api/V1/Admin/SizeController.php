<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Size;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SizeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Size::query()->orderBy('sort_order')->orderBy('name');
        if ($request->boolean('all') !== true) {
            $q->where('is_active', true);
        }
        $sizes = $q->get()->map(fn ($s) => $this->resource($s));
        return response()->json(['data' => $sizes]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:sizes,name'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ]);
        $slug = Str::slug($validated['name']);
        $size = Size::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'sort_order' => $validated['sortOrder'] ?? 0,
            'is_active' => true,
        ]);
        return response()->json(['message' => 'Size created', 'data' => $this->resource($size)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $size = Size::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50', 'unique:sizes,name,' . $id],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['boolean'],
        ]);
        $updates = [];
        if (isset($validated['name'])) {
            $updates['name'] = $validated['name'];
            $updates['slug'] = Str::slug($validated['name']);
        }
        if (isset($validated['sortOrder'])) {
            $updates['sort_order'] = $validated['sortOrder'];
        }
        if (isset($validated['isActive'])) {
            $updates['is_active'] = (bool) $validated['isActive'];
        }
        $size->update($updates);
        return response()->json(['message' => 'Size updated', 'data' => $this->resource($size->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $size = Size::findOrFail($id);
        $size->delete();
        return response()->json(['message' => 'Size deleted']);
    }

    private function resource(Size $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'slug' => $s->slug,
            'sortOrder' => $s->sort_order,
            'isActive' => (bool) $s->is_active,
            'createdAt' => $s->created_at->toIso8601String(),
            'updatedAt' => $s->updated_at->toIso8601String(),
        ];
    }
}
