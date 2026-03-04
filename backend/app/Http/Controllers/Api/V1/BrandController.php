<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BrandController extends Controller
{
    /**
     * GET /api/v1/brands
     */
    public function index(Request $request): JsonResponse
    {
        $q = Brand::query()->orderBy('name');
        if ($request->filled('search')) {
            $s = '%' . $request->input('search') . '%';
            $q->where('name', 'like', $s);
        }
        $perPage = min((int) $request->input('limit', 50), 100);
        $paginated = $q->paginate($perPage);
        $items = $paginated->getCollection()->map(fn ($b) => [
            'id' => $b->id,
            'name' => $b->name,
            'logo' => $b->logo,
            'createdAt' => $b->created_at?->toIso8601String(),
            'updatedAt' => $b->updated_at?->toIso8601String(),
        ]);
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
}
