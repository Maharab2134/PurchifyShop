<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use App\Models\Product;
use Illuminate\Http\JsonResponse;

class HomeSectionController extends Controller
{
    /**
     * GET /api/v1/home-sections
     * Returns all home sections with their products (same format as product list).
     */
    public function index(): JsonResponse
    {
        $sections = HomeSection::with(['products' => fn ($q) => $q->with(['category', 'variants.sizes'])->where('status', 'active')])
            ->where('is_visible', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $productController = new ProductController;
        $base = rtrim(config('app.url'), '/') . '/storage/';
        
        $data = $sections->map(function (HomeSection $s) use ($productController, $base) {
            $products = $s->products->map(fn (Product $p) => $productController->productResourceList($p))->values()->all();
            
            // Map image URL if exists
            $imageUrl = null;
            if ($s->image) {
                $imageUrl = str_starts_with($s->image, 'http') ? $s->image : $base . ltrim($s->image, '/');
            }
            
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
                'sortOrder' => $s->sort_order,
                'products' => $products,
                'countdownEnd' => $s->countdown_end?->toIso8601String(),
                'icon' => $s->icon,
                'image' => $imageUrl,
            ];
        })->values()->all();

        return response()->json([
            'message' => 'Home sections fetched successfully',
            'data' => $data,
        ]);
    }
}
