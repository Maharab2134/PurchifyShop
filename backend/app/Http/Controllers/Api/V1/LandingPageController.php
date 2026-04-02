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
            ->with(['product', 'templateModel:id,name,html_structure,custom_css,custom_javascript'])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();

        if (!$page) {
            return response()->json(['message' => 'Landing page not found'], 404);
        }

        $page->increment('view_count');
        $page->refresh()->load(['product', 'templateModel:id,name,html_structure,custom_css,custom_javascript']);

        return response()->json([
            'data' => [
                'landingPage' => $this->resource($page),
            ],
        ]);
    }

    private function resource(LandingPage $page): array
    {
        $product = $page->product;
        
        // Get pricing - from base_price or first variant
        $originalPrice = (float) ($product->base_price ?? 0);
        $discountedPrice = $originalPrice;
        
        // If no base_price, try to get from first variant
        if ($originalPrice === 0 && $product->variants && $product->variants->count() > 0) {
            $firstVariant = $product->variants->first();
            $originalPrice = (float) ($firstVariant->original_price ?? $firstVariant->price ?? 0);
            $discountedPrice = (float) ($firstVariant->price ?? 0);
        } else {
            $discountedPrice = $product->discountedPrice();
        }

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
            'product' => $product ? [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->short_description ?? $product->description,
                'images' => $product->images ?? [],
                'price' => $discountedPrice,
                'originalPrice' => $originalPrice,
                'isDiscountActive' => $product->isDiscountActive(),
                'discountBadge' => $product->discountBadge(),
                'rating' => $product->average_rating ?? 0,
                'reviewCount' => $product->review_count ?? 0,
                'isOutOfStock' => $product->isOutOfStock(),
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
