<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LandingPage;
use Illuminate\Http\JsonResponse;

class LandingPageController extends Controller
{
    /**
     * Public list of active landing pages.
     */
    public function index(): JsonResponse
    {
        $landingPages = LandingPage::query()
            ->where('is_active', true)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (LandingPage $page) => $this->resource($page));

        return response()->json([
            'data' => [
                'landingPages' => $landingPages->values()->all(),
            ],
        ]);
    }

    /**
     * Public single landing page by slug (increments view count).
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $page = LandingPage::query()
            ->with(['product:id,name,slug,images', 'templateModel:id,name,html_structure,custom_css,custom_javascript'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$page) {
            return response()->json(['message' => 'Landing page not found'], 404);
        }

        $page->increment('view_count');
        $page->refresh()->load(['product:id,name,slug,images', 'templateModel:id,name,html_structure,custom_css,custom_javascript']);

        return response()->json([
            'data' => [
                'landingPage' => $this->resource($page),
            ],
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
            'templateHtml' => $page->templateModel?->html_structure,
            'templateCss' => $page->templateModel?->custom_css,
            'templateJs' => $page->templateModel?->custom_javascript,
            'productId' => $page->product_id,
            'product' => $page->product ? [
                'id' => $page->product->id,
                'name' => $page->product->name,
                'slug' => $page->product->slug,
                'images' => $page->product->images,
            ] : null,
            'heroHeadline' => $page->hero_headline,
            'heroText' => $page->hero_text,
            'videoUrl' => $page->video_url,
            'primaryColor' => $page->primary_color,
            'thumbnail' => $page->thumbnail,
            'viewCount' => $page->view_count,
            'updatedAt' => $page->updated_at?->toIso8601String(),
        ];
    }
}
