<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Models\Product;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class HomeSectionController extends Controller
{
    public function index(): JsonResponse
    {
        $sections = HomeSection::withCount('products')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (HomeSection $s) => $this->sectionResource($s));
        return response()->json(['data' => $sections->values()->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:home_sections,slug'],
            'themeType' => ['nullable', 'string', 'in:PRODUCT_GRID,PROMOTIONAL_CARDS,PROMOTIONAL_BANNER,COUNTDOWN_TIMER,COUNTDOWN_GRID,PRODUCT_CAROUSEL,CATEGORY_SHOWCASE,SPLIT_LAYOUT,IMAGE_BANNER'],
            'title' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'subtitle' => ['nullable', 'string'],
            'themeData' => ['nullable', 'array'],
            'backgroundColor' => ['nullable', 'string', 'max:20'],
            'textColor' => ['nullable', 'string', 'max:20'],
            'ctaText' => ['nullable', 'string', 'max:100'],
            'ctaLink' => ['nullable', 'string', 'max:500'],
            'isVisible' => ['nullable', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'countdownEnd' => ['nullable', 'date', 'nullable', 'after_or_equal:now'],
            'icon' => ['nullable', 'string', 'max:64'],
            'image' => ['nullable', 'string', 'max:512'],
        ]);
        $name = $validated['name'];
        $slug = $validated['slug'] ?? Str::slug($name);
        if (HomeSection::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . now()->format('YmdHis');
        }
        $s = HomeSection::create([
            'name' => $name,
            'slug' => $slug,
            'theme_type' => $validated['themeType'] ?? 'PRODUCT_GRID',
            'title' => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'subtitle' => $validated['subtitle'] ?? null,
            'theme_data' => $validated['themeData'] ?? null,
            'background_color' => $validated['backgroundColor'] ?? null,
            'text_color' => $validated['textColor'] ?? null,
            'cta_text' => $validated['ctaText'] ?? null,
            'cta_link' => $validated['ctaLink'] ?? null,
            'is_visible' => $validated['isVisible'] ?? true,
            'sort_order' => $validated['sortOrder'] ?? 0,
            'countdown_end' => !empty($validated['countdownEnd']) ? $validated['countdownEnd'] : null,
            'icon' => $validated['icon'] ?? null,
            'image' => $validated['image'] ?? null,
        ]);
        return response()->json(['message' => 'Home section created', 'data' => $this->sectionResource($s)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $s = HomeSection::with(['products' => fn ($q) => $q->select('products.id', 'products.name', 'products.slug')])
            ->findOrFail($id);
        $data = $this->sectionResource($s);
        $data['products'] = $s->products->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'slug' => $p->slug])->values()->all();
        return response()->json(['data' => $data]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $s = HomeSection::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'themeType' => ['nullable', 'string', 'in:PRODUCT_GRID,PROMOTIONAL_CARDS,PROMOTIONAL_BANNER,COUNTDOWN_TIMER,COUNTDOWN_GRID,PRODUCT_CAROUSEL,CATEGORY_SHOWCASE,SPLIT_LAYOUT,IMAGE_BANNER'],
            'title' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'subtitle' => ['nullable', 'string'],
            'themeData' => ['nullable', 'array'],
            'backgroundColor' => ['nullable', 'string', 'max:20'],
            'textColor' => ['nullable', 'string', 'max:20'],
            'ctaText' => ['nullable', 'string', 'max:100'],
            'ctaLink' => ['nullable', 'string', 'max:500'],
            'isVisible' => ['nullable', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'countdownEnd' => ['nullable', 'date', 'after_or_equal:now'],
            'icon' => ['nullable', 'string', 'max:64'],
            'image' => ['nullable', 'string', 'max:512'],
        ]);
        $up = [];
        if (array_key_exists('name', $validated)) {
            $up['name'] = $validated['name'];
        }
        if (array_key_exists('slug', $validated) && $validated['slug'] !== $s->slug) {
            $up['slug'] = $validated['slug'];
        }
        if (array_key_exists('themeType', $validated)) {
            $up['theme_type'] = $validated['themeType'];
        }
        if (array_key_exists('title', $validated)) {
            $up['title'] = $validated['title'];
        }
        if (array_key_exists('description', $validated)) {
            $up['description'] = $validated['description'];
        }
        if (array_key_exists('subtitle', $validated)) {
            $up['subtitle'] = $validated['subtitle'];
        }
        if (array_key_exists('themeData', $validated)) {
            $up['theme_data'] = $validated['themeData'];
        }
        if (array_key_exists('backgroundColor', $validated)) {
            $up['background_color'] = $validated['backgroundColor'];
        }
        if (array_key_exists('textColor', $validated)) {
            $up['text_color'] = $validated['textColor'];
        }
        if (array_key_exists('ctaText', $validated)) {
            $up['cta_text'] = $validated['ctaText'];
        }
        if (array_key_exists('ctaLink', $validated)) {
            $up['cta_link'] = $validated['ctaLink'];
        }
        if (array_key_exists('isVisible', $validated)) {
            $up['is_visible'] = $validated['isVisible'];
        }
        if (array_key_exists('sortOrder', $validated)) {
            $up['sort_order'] = $validated['sortOrder'];
        }
        if (array_key_exists('countdownEnd', $validated)) {
            $up['countdown_end'] = !empty($validated['countdownEnd']) ? $validated['countdownEnd'] : null;
        }
        if (array_key_exists('icon', $validated)) {
            $up['icon'] = !empty($validated['icon']) ? trim($validated['icon']) : null;
        }
        if (array_key_exists('image', $validated)) {
            $up['image'] = !empty($validated['image']) ? trim($validated['image']) : null;
        }
        $s->update($up);
        return response()->json(['message' => 'Home section updated', 'data' => $this->sectionResource($s->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $s = HomeSection::findOrFail($id);
        $image = $s->image;
        $themeImages = is_array($s->theme_data) ? ($s->theme_data['images'] ?? []) : [];
        $s->delete();
        $cleanup = new ImageDeletionService();
        $paths = array_merge($image ? [$image] : [], is_array($themeImages) ? $themeImages : []);
        foreach ($paths as $path) {
            $clean = $cleanup->normalizePath((string) $path);
            if ($cleanup->isAllowedPath($clean)) {
                $cleanup->deleteFromStorageIfOrphan($clean);
            }
        }
        return response()->json(['message' => 'Home section deleted']);
    }

    /**
     * POST /admin/home-sections/reorder
     * Body: { sectionIds: number[] } – reorder sections by IDs.
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sectionIds' => ['required', 'array'],
            'sectionIds.*' => ['required', 'integer', 'exists:home_sections,id'],
        ]);

        $ids = $validated['sectionIds'];
        foreach ($ids as $index => $id) {
            HomeSection::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Sections reordered']);
    }

    /**
     * PUT /admin/home-sections/{id}/products
     * Body: { productIds: string[] } – set products for section (replaces existing).
     */
    public function updateProducts(Request $request, string $id): JsonResponse
    {
        $s = HomeSection::findOrFail($id);
        $validated = $request->validate([
            'productIds' => ['required', 'array'],
            'productIds.*' => ['string', 'exists:products,id'],
        ]);
        $productIds = $validated['productIds'];
        $sync = collect($productIds)->mapWithKeys(fn ($pid, $i) => [$pid => ['sort_order' => $i]])->all();
        $s->products()->sync($sync);
        return response()->json([
            'message' => 'Section products updated',
            'data' => $this->sectionResource($s->loadCount('products')),
        ]);
    }

    private function sectionResource(HomeSection $s): array
    {
        return [
            'id' => $s->id,
            'name' => $s->name,
            'slug' => $s->slug,
            'themeType' => $s->theme_type ?? 'PRODUCT_GRID',
            'title' => $s->title,
            'description' => $s->description,
            'subtitle' => $s->subtitle,
            'themeData' => $s->theme_data ?? [],
            'backgroundColor' => $s->background_color,
            'textColor' => $s->text_color,
            'ctaText' => $s->cta_text,
            'ctaLink' => $s->cta_link,
            'isVisible' => (bool) ($s->is_visible ?? true),
            'sortOrder' => $s->sort_order,
            'productsCount' => $s->products_count ?? $s->products()->count(),
            'countdownEnd' => $s->countdown_end?->toIso8601String(),
            'icon' => $s->icon,
            'image' => $s->image,
        ];
    }
}
