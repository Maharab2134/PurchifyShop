<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageController extends Controller
{
    /**
     * GET /api/v1/pages
     * Public: list active pages
     */
    public function index(Request $request): JsonResponse
    {
        $pages = Page::query()
            ->where('is_active', true)
            ->orderBy('title')
            ->get()
            ->map(fn (Page $p) => $this->resource($p));

        return response()->json([
            'data' => [
                'pages' => $pages->values()->all(),
            ],
        ]);
    }

    /**
     * GET /api/v1/pages/slug/{slug}
     * Public: get a single active page by slug
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $page = Page::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$page) {
            return response()->json(['message' => 'Page not found'], 404);
        }

        return response()->json([
            'data' => [
                'page' => $this->resource($page),
            ],
        ]);
    }

    private function resource(Page $p): array
    {
        return [
            'id' => $p->id,
            'slug' => $p->slug,
            'title' => $p->title,
            'description' => $p->description,
            'content' => $p->content,
            'images' => $p->images,
            'isActive' => $p->is_active,
            'updatedAt' => $p->updated_at?->toIso8601String(),
        ];
    }
}
