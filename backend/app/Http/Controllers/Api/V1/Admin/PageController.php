<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Page::query()->orderBy('title');
        if ($request->filled('search')) {
            $q->where(function ($query) use ($request) {
                $query->where('title', 'like', '%' . $request->input('search') . '%')
                    ->orWhere('slug', 'like', '%' . $request->input('search') . '%');
            });
        }
        $pages = $q->paginate($request->input('limit', 50));
        $data = $pages->getCollection()->map(fn ($p) => $this->resource($p));
        return response()->json([
            'data' => [
                'pages' => $data,
                'totalResults' => $pages->total(),
                'totalPages' => $pages->lastPage(),
                'currentPage' => $pages->currentPage(),
                'resultsPerPage' => $pages->perPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:pages,slug'],
            'description' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'isActive' => ['boolean'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['title']);
        if (Page::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . time();
        }

        $page = Page::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'content' => $validated['content'] ?? null,
            'images' => $validated['images'] ?? null,
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Page created',
            'data' => $this->resource($page),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $page = Page::findOrFail($id);
        return response()->json(['data' => $this->resource($page)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $page = Page::findOrFail($id);
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:pages,slug,' . $id],
            'description' => ['nullable', 'string'],
            'content' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'isActive' => ['boolean'],
        ]);

        $updates = [];
        if (isset($validated['title'])) {
            $updates['title'] = $validated['title'];
        }
        if (isset($validated['slug'])) {
            $updates['slug'] = $validated['slug'];
        }
        if (array_key_exists('description', $validated)) {
            $updates['description'] = $validated['description'];
        }
        if (array_key_exists('content', $validated)) {
            $updates['content'] = $validated['content'];
        }
        if (array_key_exists('images', $validated)) {
            $updates['images'] = $validated['images'];
        }
        if (isset($validated['isActive'])) {
            $updates['is_active'] = $validated['isActive'];
        }

        $page->update($updates);

        return response()->json([
            'message' => 'Page updated',
            'data' => $this->resource($page->fresh()),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $page = Page::findOrFail($id);
        $page->delete();
        return response()->json(['message' => 'Page deleted']);
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
            'createdAt' => $p->created_at?->toIso8601String(),
            'updatedAt' => $p->updated_at?->toIso8601String(),
        ];
    }
}
