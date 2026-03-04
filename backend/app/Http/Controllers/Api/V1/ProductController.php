<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * GET /api/v1/products
     * List products (active only) with minimal variant data for list views.
     */
    public function index(Request $request): JsonResponse
    {
        $q = Product::query()->with(['category', 'subcategory', 'brand', 'variants.sizes'])->where('status', 'active');
        
        if ($request->filled('categoryId')) {
            $q->where('category_id', $request->input('categoryId'));
        }
        if ($request->filled('subcategoryId')) {
            $q->where('subcategory_id', $request->input('subcategoryId'));
        }
        if ($request->filled('search')) {
            $s = '%' . $request->input('search') . '%';
            $q->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)->orWhere('description', 'like', $s);
            });
        }
        if ($request->filled('isNew')) {
            $q->where('is_new', $request->boolean('isNew'));
        }
        if ($request->filled('isFeatured')) {
            $q->where('is_featured', $request->boolean('isFeatured'));
        }
        if ($request->filled('isTrending')) {
            $q->where('is_trending', $request->boolean('isTrending'));
        }
        if ($request->filled('isBestSeller')) {
            $q->where('is_best_seller', $request->boolean('isBestSeller'));
        }
        if ($request->filled('minRating') && is_numeric($request->input('minRating'))) {
            $q->where('average_rating', '>=', (float) $request->input('minRating'));
        }

        $perPage = min((int) $request->input('limit', 50), 100);
        $paginated = $q->orderBy('created_at', 'desc')->paginate($perPage);
        $products = $paginated->getCollection()->map(fn ($p) => $this->productResourceList($p));
        
        return response()->json([
            'message' => 'Products fetched successfully',
            'data' => [
                'products' => $products,
                'totalResults' => $paginated->total(),
                'totalPages' => $paginated->lastPage(),
                'currentPage' => $paginated->currentPage(),
                'resultsPerPage' => $paginated->perPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/products/{id}
     * Get product by ID with full variant details.
     */
    public function show(string $id): JsonResponse
    {
        $product = Product::with(['category', 'subcategory', 'brand', 'variants.sizes', 'variants.attributes.attribute'])->where('status', 'active')->findOrFail($id);
        return response()->json([
            'message' => 'Product fetched successfully',
            'data' => $this->productResource($product, true),
        ]);
    }

    /**
     * GET /api/v1/products/slug/{slug}
     * Get product by slug with full variant details.
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $product = Product::with(['category', 'subcategory', 'brand', 'variants.sizes', 'variants.attributes.attribute'])->where('status', 'active')->where('slug', $slug)->firstOrFail();
        return response()->json([
            'message' => 'Product fetched successfully',
            'data' => $this->productResource($product, true),
        ]);
    }

    /**
     * GET /api/v1/products/{id}/related
     * Get related products (same category, excluding current product).
     */
    public function related(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        
        $query = Product::with(['category', 'brand', 'variants.sizes'])
            ->where('status', 'active')
            ->where('id', '!=', $id);
        
        // Filter by same category if product has a category
        if ($product->category_id) {
            $query->where('category_id', $product->category_id);
        }
        
        $related = $query
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get()
            ->map(fn ($p) => $this->productResourceList($p));
        
        return response()->json([
            'message' => 'Related products fetched successfully',
            'data' => $related->values()->all(),
        ]);
    }

    /**
     * Get category data for product, ensuring it's loaded if category_id exists.
     */
    private function getCategoryData(Product $p): ?array
    {
        // If category is already loaded and exists, return it
        if ($p->relationLoaded('category') && $p->category) {
            return [
                'id' => $p->category->id,
                'name' => $p->category->name,
                'slug' => $p->category->slug,
            ];
        }
        
        // If category_id exists but category isn't loaded or is null, try to load it
        if ($p->category_id) {
            // Load the relationship if not already loaded
            if (!$p->relationLoaded('category')) {
                $p->load('category');
            }
            
            // If category exists after loading, return it
            if ($p->category) {
                return [
                    'id' => $p->category->id,
                    'name' => $p->category->name,
                    'slug' => $p->category->slug,
                ];
            }
        }
        
        return null;
    }

    /**
     * Get subcategory data for product, ensuring it's loaded if subcategory_id exists.
     */
    private function getSubcategoryData(Product $p): ?array
    {
        // If subcategory is already loaded and exists, return it
        if ($p->relationLoaded('subcategory') && $p->subcategory) {
            return [
                'id' => $p->subcategory->id,
                'name' => $p->subcategory->name,
                'slug' => $p->subcategory->slug,
            ];
        }
        
        // If subcategory_id exists but subcategory isn't loaded or is null, try to load it
        if ($p->subcategory_id) {
            // Load the relationship if not already loaded
            if (!$p->relationLoaded('subcategory')) {
                $p->load('subcategory');
            }
            
            // If subcategory exists after loading, return it
            if ($p->subcategory) {
                return [
                    'id' => $p->subcategory->id,
                    'name' => $p->subcategory->name,
                    'slug' => $p->subcategory->slug,
                ];
            }
        }
        
        return null;
    }

    /**
     * Public method for list views (minimal variant data).
     */
    public function productResourceList(Product $p): array
    {
        return $this->productResource($p, false);
    }

    /**
     * Format product resource.
     * When includeVariants=false, includes minimal first variant data for Add to Cart functionality.
     */
    private function productResource(Product $p, bool $includeVariants = false): array
    {
        $first = $p->relationLoaded('variants') && $p->variants->isNotEmpty()
            ? $p->variants->first()
            : null;
        $originalPrice = $first ? $first->originalPrice() : 0.0;
        $discountedPrice = $first ? $first->discountedPrice() : 0.0;
        $discountBadge = $first ? $first->discountBadge() : null;
        $isDiscountActive = $first ? $first->isDiscountActive() : false;

        $out = [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
            'description' => $p->description,
            'shortDescription' => $p->short_description,
            'salesCount' => (int) ($p->sales_count ?? 0),
            'averageRating' => (float) ($p->average_rating ?? 0),
            'reviewCount' => (int) ($p->review_count ?? 0),
            'categoryId' => $p->category_id,
            'category' => $this->getCategoryData($p),
            'subcategoryId' => $p->subcategory_id,
            'subcategory' => $this->getSubcategoryData($p),
            'brandId' => $p->brand_id,
            'brand' => $p->relationLoaded('brand') && $p->brand
                ? ['id' => $p->brand->id, 'name' => $p->brand->name, 'logo' => $p->brand->logo]
                : null,
            'images' => is_array($p->images) ? $p->images : [],
            'isNew' => (bool) $p->is_new,
            'isFeatured' => (bool) $p->is_featured,
            'isTrending' => (bool) $p->is_trending,
            'isBestSeller' => (bool) $p->is_best_seller,
            'status' => $p->status ?? 'active',
            'originalPrice' => $originalPrice,
            'discountedPrice' => $discountedPrice,
            'discountBadge' => $discountBadge,
            'isDiscountActive' => $isDiscountActive,
            'isOutOfStock' => $p->isOutOfStock(),
            'totalStock' => $p->totalStock(),
            'createdAt' => $p->created_at?->toIso8601String(),
            'updatedAt' => $p->updated_at?->toIso8601String(),
        ];

        // Include minimal first variant data for list views (needed for Add to Cart)
        if (! $includeVariants && $first && $p->relationLoaded('variants')) {
            $out['variants'] = [[
                'id' => $first->id,
                'productId' => $first->product_id,
                'sku' => $first->sku,
                'images' => $this->variantImages($first),
                'price' => (float) $first->discountedPrice(),
                'originalPrice' => (float) $first->originalPrice(),
                'stock' => $first->stock,
                'lowStockThreshold' => $first->low_stock_threshold,
                'sizes' => $first->relationLoaded('sizes') ? $first->sizes->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values()->all() : [],
            ]];
        }

        // Include full variants when requested
        if ($includeVariants && $p->relationLoaded('variants')) {
            $out['variants'] = $p->variants->map(function ($v) {
                $attributes = [];
                if ($v->relationLoaded('attributes')) {
                    // Return all attribute-value pairs (not grouped)
                    foreach ($v->attributes as $av) {
                        $attributes[] = [
                            'attribute' => [
                                'id' => $av->attribute->id ?? '',
                                'name' => $av->attribute->name ?? 'Unknown',
                            ],
                            'value' => [
                                'id' => $av->id ?? '',
                                'value' => $av->value ?? '',
                            ],
                        ];
                    }
                }
                return [
                    'id' => $v->id,
                    'productId' => $v->product_id,
                    'sku' => $v->sku,
                    'images' => $this->variantImages($v),
                    'price' => (float) $v->discountedPrice(),
                    'originalPrice' => (float) $v->originalPrice(),
                    'stock' => $v->stock,
                    'lowStockThreshold' => $v->low_stock_threshold,
                    'barcode' => $v->barcode,
                    'sizes' => $v->relationLoaded('sizes') ? $v->sizes->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values()->all() : [],
                    'attributes' => $attributes,
                ];
            })->values()->all();
        }

        return $out;
    }

    /**
     * Get variant images (from variant or fallback to product images).
     */
    private function variantImages($variant): array
    {
        if ($variant->images && is_array($variant->images) && count($variant->images) > 0) {
            return $variant->images;
        }
        // Fallback to product images if variant has none
        $product = $variant->product ?? Product::find($variant->product_id);
        if ($product && is_array($product->images) && count($product->images) > 0) {
            return $product->images;
        }
        return [];
    }
}
