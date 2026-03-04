<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Brand::query()->orderBy('name');
        if ($request->filled('search')) {
            $s = '%' . $request->input('search') . '%';
            $q->where('name', 'like', $s);
        }
        $perPage = min((int) $request->input('limit', 50), 100);
        $paginated = $q->paginate($perPage);
        $items = $paginated->getCollection()->map(fn ($b) => $this->resource($b));
        return response()->json([
            'data' => [
                'brands' => $items,
                'totalResults' => $paginated->total(),
                'totalPages' => $paginated->lastPage(),
                'currentPage' => $paginated->currentPage(),
                'resultsPerPage' => $paginated->perPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:255'],
        ]);
        $b = Brand::create($validated);
        return response()->json(['message' => 'Brand created', 'data' => $this->resource($b)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $b = Brand::findOrFail($id);
        return response()->json(['data' => $this->resource($b)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $b = Brand::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'logo' => ['nullable', 'string', 'max:255'],
        ]);
        $b->update([
            'name' => $validated['name'] ?? $b->name,
            'logo' => array_key_exists('logo', $validated) ? $validated['logo'] : $b->logo,
        ]);
        return response()->json(['message' => 'Brand updated', 'data' => $this->resource($b->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $b = Brand::findOrFail($id);
        $logo = $b->logo;
        $b->delete();
        if ($logo) {
            $cleanup = new ImageDeletionService();
            $clean = $cleanup->normalizePath((string) $logo);
            if ($cleanup->isAllowedPath($clean)) {
                $cleanup->deleteFromStorageIfOrphan($clean);
            }
        }
        return response()->json(['message' => 'Brand deleted']);
    }

    private function resource(Brand $b): array
    {
        return [
            'id' => $b->id,
            'name' => $b->name,
            'logo' => $b->logo,
            'createdAt' => $b->created_at?->toIso8601String(),
            'updatedAt' => $b->updated_at?->toIso8601String(),
        ];
    }
}
