<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingPage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LandingPageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = LandingPage::query()
            ->with(['product:id,name,images', 'templateModel:id,name'])
            ->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $q->where(function ($query) use ($search) {
                $query->where('title', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%')
                    ->orWhere('template', 'like', '%' . $search . '%');
            });
        }

        $pages = $q->paginate((int) $request->input('limit', 50));

        return response()->json([
            'data' => [
                'landingPages' => $pages->getCollection()->map(fn (LandingPage $page) => $this->resource($page)),
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
            'slug' => ['nullable', 'string', 'max:255', 'unique:landing_pages,slug'],
            'template' => ['nullable', 'string', 'max:255'],
            'templateId' => ['nullable', 'uuid', 'exists:landing_page_templates,id'],
            'productId' => ['nullable', 'uuid', 'exists:products,id'],
            'heroHeadline' => ['nullable', 'string', 'max:255'],
            'heroText' => ['nullable', 'string'],
            'videoUrl' => ['nullable', 'string', 'max:2048'],
            'primaryColor' => ['nullable', 'string', 'max:20'],
            'thumbnail' => ['nullable', 'string', 'max:2048'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['title']);
        if (LandingPage::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . time();
        }

        $templateName = $validated['template'] ?? null;

        if (!$templateName && !empty($validated['templateId'])) {
            $templateName = \App\Models\LandingPageTemplate::where('id', $validated['templateId'])->value('name');
        }

        $page = LandingPage::create([
            'title' => $validated['title'],
            'slug' => $slug,
            'template' => $templateName ?? 'Default',
            'template_id' => $validated['templateId'] ?? null,
            'product_id' => $validated['productId'] ?? null,
            'hero_headline' => $validated['heroHeadline'] ?? null,
            'hero_text' => $validated['heroText'] ?? null,
            'video_url' => $validated['videoUrl'] ?? null,
            'primary_color' => $validated['primaryColor'] ?? '#F97316',
            'thumbnail' => $validated['thumbnail'] ?? null,
            'is_active' => $validated['isActive'] ?? true,
        ])->load(['product:id,name,images', 'templateModel:id,name']);

        return response()->json([
            'message' => 'Landing page created',
            'data' => $this->resource($page),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $page = LandingPage::with(['product:id,name,images', 'templateModel:id,name'])->findOrFail($id);

        return response()->json([
            'data' => $this->resource($page),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $page = LandingPage::findOrFail($id);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:landing_pages,slug,' . $id],
            'template' => ['sometimes', 'string', 'max:255'],
            'templateId' => ['nullable', 'uuid', 'exists:landing_page_templates,id'],
            'productId' => ['nullable', 'uuid', 'exists:products,id'],
            'heroHeadline' => ['nullable', 'string', 'max:255'],
            'heroText' => ['nullable', 'string'],
            'videoUrl' => ['nullable', 'string', 'max:2048'],
            'primaryColor' => ['nullable', 'string', 'max:20'],
            'thumbnail' => ['nullable', 'string', 'max:2048'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $updates = [];
        if (array_key_exists('title', $validated)) {
            $updates['title'] = $validated['title'];
        }
        if (array_key_exists('slug', $validated)) {
            $updates['slug'] = $validated['slug'];
        }
        if (array_key_exists('template', $validated)) {
            $updates['template'] = $validated['template'];
        }
        if (array_key_exists('templateId', $validated)) {
            $updates['template_id'] = $validated['templateId'];
            if (!array_key_exists('template', $validated) && $validated['templateId']) {
                $updates['template'] = \App\Models\LandingPageTemplate::where('id', $validated['templateId'])->value('name') ?? $page->template;
            }
        }
        if (array_key_exists('productId', $validated)) {
            $updates['product_id'] = $validated['productId'];
        }
        if (array_key_exists('heroHeadline', $validated)) {
            $updates['hero_headline'] = $validated['heroHeadline'];
        }
        if (array_key_exists('heroText', $validated)) {
            $updates['hero_text'] = $validated['heroText'];
        }
        if (array_key_exists('videoUrl', $validated)) {
            $updates['video_url'] = $validated['videoUrl'];
        }
        if (array_key_exists('primaryColor', $validated)) {
            $updates['primary_color'] = $validated['primaryColor'];
        }
        if (array_key_exists('thumbnail', $validated)) {
            $updates['thumbnail'] = $validated['thumbnail'];
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = $validated['isActive'];
        }

        $page->update($updates);
        $page->load(['product:id,name,images', 'templateModel:id,name']);

        return response()->json([
            'message' => 'Landing page updated',
            'data' => $this->resource($page),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $page = LandingPage::findOrFail($id);
        $page->delete();

        return response()->json([
            'message' => 'Landing page deleted',
        ]);
    }

    private function resource(LandingPage $page): array
    {
        return [
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'template' => $page->template,
            'templateId' => $page->template_id,
            'templateName' => $page->templateModel?->name ?? $page->template,
            'productId' => $page->product_id,
            'productName' => $page->product?->name,
            'productImage' => $page->product?->images[0] ?? null,
            'heroHeadline' => $page->hero_headline,
            'heroText' => $page->hero_text,
            'videoUrl' => $page->video_url,
            'primaryColor' => $page->primary_color,
            'thumbnail' => $page->thumbnail,
            'viewCount' => $page->view_count,
            'isActive' => $page->is_active,
            'createdAt' => $page->created_at?->toIso8601String(),
            'updatedAt' => $page->updated_at?->toIso8601String(),
        ];
    }
}
