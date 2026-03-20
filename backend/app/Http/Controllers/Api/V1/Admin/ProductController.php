<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttributeValue;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductVariantAttribute;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * GET /admin/products — list all products (no status filter).
     */
    public function index(Request $request): JsonResponse
    {
        $q = Product::query()->with(['category', 'subcategory', 'brand', 'variants']);
        $vendorId = $this->resolveVendorId();
        if ($vendorId !== null) {
            $q->where('vendor_id', $vendorId);
        }

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
        $perPage = min((int) $request->input('limit', 50), 100);
        $paginated = $q->orderBy('created_at', 'desc')->paginate($perPage);
        $products = $paginated->getCollection()->map(fn ($p) => $this->productResource($p, true));
        return response()->json([
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
     * GET /admin/products/{id}
     */
    public function show(string $id): JsonResponse
    {
        $product = Product::with(['category', 'subcategory', 'brand', 'variants.sizes'])->findOrFail($id);
        $vendorId = $this->resolveVendorId();
        if ($vendorId !== null && $product->vendor_id !== $vendorId) {
            abort(404);
        }

        return response()->json(['data' => $this->productResource($product, true)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:products,name'],
            'shortDescription' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'categoryId' => ['nullable', 'uuid', 'exists:categories,id'],
            'subcategoryId' => ['nullable', 'uuid', 'exists:subcategories,id'],
            'vendorId' => ['nullable', 'uuid', 'exists:vendors,id'],
            'brandId' => ['nullable', 'uuid', 'exists:brands,id'],
            'isNew' => ['boolean'],
            'isFeatured' => ['boolean'],
            'isTrending' => ['boolean'],
            'isBestSeller' => ['boolean'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'suggestedSizeIds' => ['nullable', 'array'],
            'suggestedSizeIds.*' => ['uuid', 'exists:sizes,id'],
            'suggestedAttributeValueIds' => ['nullable', 'array'],
            'suggestedAttributeValueIds.*' => ['uuid', 'exists:attribute_values,id'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'variants.*.sku' => ['required', 'string', 'max:255'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.lowStockAlert' => ['nullable', 'integer', 'min:0'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.discountType' => ['nullable', 'string', 'in:percentage,flat'],
            'variants.*.discountValue' => ['nullable', 'numeric', 'min:0'],
            'variants.*.discountStartAt' => ['nullable', 'date'],
            'variants.*.discountEndAt' => ['nullable', 'date'],
            'variants.*.sizeIds' => ['nullable', 'array'],
            'variants.*.sizeIds.*' => ['uuid', 'exists:sizes,id'],
            'variants.*.attributeValueIds' => ['nullable', 'array'],
            'variants.*.attributeValueIds.*' => ['uuid', 'exists:attribute_values,id'],
        ]);
        $slug = Str::slug($validated['name']);
        $product = Product::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'short_description' => $validated['shortDescription'] ?? null,
            'description' => $validated['description'] ?? null,
            'category_id' => $validated['categoryId'] ?? null,
            'subcategory_id' => $validated['subcategoryId'] ?? null,
            'vendor_id' => $validated['vendorId'] ?? null,
            'brand_id' => $validated['brandId'] ?? null,
            'is_new' => $validated['isNew'] ?? false,
            'is_featured' => $validated['isFeatured'] ?? false,
            'is_trending' => $validated['isTrending'] ?? false,
            'is_best_seller' => $validated['isBestSeller'] ?? false,
            'discount_percent' => 0,
            'images' => $validated['images'] ?? [],
            'base_price' => 0,
            'discount_type' => null,
            'discount_value' => 0,
            'discount_start_at' => null,
            'discount_end_at' => null,
            'status' => $validated['status'] ?? 'active',
            'suggested_size_ids' => array_values(array_unique($validated['suggestedSizeIds'] ?? [])),
            'suggested_attribute_value_ids' => array_values(array_unique($validated['suggestedAttributeValueIds'] ?? [])),
        ]);
        if (array_key_exists('variants', $validated)) {
            $this->syncVariants($product, $validated['variants'] ?? []);
        }
        $product->load(['category', 'subcategory', 'brand', 'variants.sizes']);
        return response()->json([
            'message' => 'Product created',
            'data' => $this->productResource($product->fresh(), true),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', Rule::unique('products', 'name')->ignore($product->id)],
            'shortDescription' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'nullable', 'string'],
            'categoryId' => ['sometimes', 'nullable', 'uuid', 'exists:categories,id'],
            'subcategoryId' => ['sometimes', 'nullable', 'uuid', 'exists:subcategories,id'],
            'vendorId' => ['sometimes', 'nullable', 'uuid', 'exists:vendors,id'],
            'brandId' => ['sometimes', 'nullable', 'uuid', 'exists:brands,id'],
            'isNew' => ['boolean'],
            'isFeatured' => ['boolean'],
            'isTrending' => ['boolean'],
            'isBestSeller' => ['boolean'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'suggestedSizeIds' => ['nullable', 'array'],
            'suggestedSizeIds.*' => ['uuid', 'exists:sizes,id'],
            'suggestedAttributeValueIds' => ['nullable', 'array'],
            'suggestedAttributeValueIds.*' => ['uuid', 'exists:attribute_values,id'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['nullable', 'uuid', 'exists:product_variants,id'],
            'variants.*.sku' => ['required', 'string', 'max:255'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
            'variants.*.lowStockAlert' => ['nullable', 'integer', 'min:0'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.discountType' => ['nullable', 'string', 'in:percentage,flat'],
            'variants.*.discountValue' => ['nullable', 'numeric', 'min:0'],
            'variants.*.discountStartAt' => ['nullable', 'date'],
            'variants.*.discountEndAt' => ['nullable', 'date'],
            'variants.*.sizeIds' => ['nullable', 'array'],
            'variants.*.sizeIds.*' => ['uuid', 'exists:sizes,id'],
            'variants.*.attributeValueIds' => ['nullable', 'array'],
            'variants.*.attributeValueIds.*' => ['uuid', 'exists:attribute_values,id'],
        ]);
        $updates = array_filter([
            'name' => $validated['name'] ?? null,
            'short_description' => $validated['shortDescription'] ?? null,
            'description' => $validated['description'] ?? null,
            'category_id' => $validated['categoryId'] ?? null,
            'subcategory_id' => $validated['subcategoryId'] ?? null,
            'vendor_id' => $validated['vendorId'] ?? null,
            'brand_id' => $validated['brandId'] ?? null,
            'is_new' => $validated['isNew'] ?? null,
            'is_featured' => $validated['isFeatured'] ?? null,
            'is_trending' => $validated['isTrending'] ?? null,
            'is_best_seller' => $validated['isBestSeller'] ?? null,
            'images' => $validated['images'] ?? null,
            'status' => $validated['status'] ?? null,
            'suggested_size_ids' => $validated['suggestedSizeIds'] ?? null,
            'suggested_attribute_value_ids' => $validated['suggestedAttributeValueIds'] ?? null,
        ], fn ($v) => $v !== null);
        if (isset($updates['name'])) {
            $updates['slug'] = Str::slug($updates['name']);
        }
        $product->update($updates);

        if (array_key_exists('variants', $validated)) {
            $this->syncVariants($product, $validated['variants'] ?? []);
        }
        $product->load(['category', 'subcategory', 'brand', 'variants.sizes']);
        return response()->json(['message' => 'Product updated', 'data' => $this->productResource($product->fresh(), true)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $images = is_array($product->images) ? $product->images : [];
        $product->delete();
        $cleanup = new ImageDeletionService();
        foreach ($images as $path) {
            $clean = $cleanup->normalizePath((string) $path);
            if ($cleanup->isAllowedPath($clean)) {
                $cleanup->deleteFromStorageIfOrphan($clean);
            }
        }
        return response()->json(['message' => 'Product deleted']);
    }

    public function bulk(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,xlsx']]);
        return response()->json(['message' => 'Bulk upload not implemented. Use POST /admin/products with variants.']);
    }

    private function productResource(Product $p, bool $includeVariants = false): array
    {
        $first = $p->relationLoaded('variants') && $p->variants->isNotEmpty()
            ? $p->variants->first()
            : null;
        $originalPrice = $first ? $first->originalPrice() : 0.0;
        $discountedPrice = $first ? $first->discountedPrice() : 0.0;
        $discountBadge = $first ? $first->discountBadge() : null;
        $isDiscountActive = $first ? $first->isDiscountActive() : false;
        $variantsLoaded = $p->relationLoaded('variants');
        $variantCount = $variantsLoaded ? $p->variants->count() : $p->variants()->count();
        $totalStock = $variantsLoaded ? (int) $p->variants->sum('stock') : $p->totalStock();
        $lowStockCount = $variantsLoaded
            ? $p->variants->filter(fn ($v) => $v->isLowStock())->count()
            : $p->variants()
                ->where('low_stock_threshold', '>', 0)
                ->whereColumn('stock', '<=', 'low_stock_threshold')
                ->count();

        $out = [
            'id' => $p->id,
            'name' => $p->name,
            'slug' => $p->slug,
            'description' => $p->description,
            'shortDescription' => $p->short_description,
            'categoryId' => $p->category_id,
            'category' => $p->relationLoaded('category') && $p->category
                ? ['id' => $p->category->id, 'name' => $p->category->name, 'slug' => $p->category->slug]
                : null,
            'subcategoryId' => $p->subcategory_id,
            'subcategory' => $p->relationLoaded('subcategory') && $p->subcategory
                ? ['id' => $p->subcategory->id, 'name' => $p->subcategory->name, 'slug' => $p->subcategory->slug]
                : null,
            'vendorId' => $p->vendor_id,
            'brandId' => $p->brand_id,
            'brand' => $p->relationLoaded('brand') && $p->brand
                ? ['id' => $p->brand->id, 'name' => $p->brand->name, 'logo' => $p->brand->logo]
                : null,
            'images' => is_array($p->images) ? $p->images : [],
            'suggestedSizeIds' => is_array($p->suggested_size_ids) ? $p->suggested_size_ids : [],
            'suggestedAttributeValueIds' => is_array($p->suggested_attribute_value_ids) ? $p->suggested_attribute_value_ids : [],
            'isNew' => (bool) $p->is_new,
            'isFeatured' => (bool) $p->is_featured,
            'isTrending' => (bool) $p->is_trending,
            'isBestSeller' => (bool) $p->is_best_seller,
            'basePrice' => $originalPrice,
            'discountType' => $first?->discount_type,
            'discountValue' => (float) ($first?->discount_value ?? 0),
            'discountStartAt' => $first?->discount_start_at?->toIso8601String(),
            'discountEndAt' => $first?->discount_end_at?->toIso8601String(),
            'status' => $p->status ?? 'active',
            'originalPrice' => $originalPrice,
            'discountedPrice' => $discountedPrice,
            'discountBadge' => $discountBadge,
            'isDiscountActive' => $isDiscountActive,
            'isOutOfStock' => $p->isOutOfStock(),
            'totalStock' => $totalStock,
            'variantCount' => $variantCount,
            'lowStockCount' => $lowStockCount,
            'createdAt' => $p->created_at?->toIso8601String(),
            'updatedAt' => $p->updated_at?->toIso8601String(),
        ];
        if ($includeVariants && $p->relationLoaded('variants')) {
            $out['variants'] = $p->variants->map(fn ($v) => [
                'id' => $v->id,
                'productId' => $v->product_id,
                'sku' => $v->sku,
                'stock' => $v->stock,
                'lowStockAlert' => (int) ($v->low_stock_threshold ?? 0),
                'price' => (float) ($v->price ?? 0),
                'discountType' => $v->discount_type,
                'discountValue' => (float) ($v->discount_value ?? 0),
                'discountStartAt' => $v->discount_start_at?->toIso8601String(),
                'discountEndAt' => $v->discount_end_at?->toIso8601String(),
                'originalPrice' => $v->originalPrice(),
                'discountedPrice' => $v->discountedPrice(),
                'discountBadge' => $v->discountBadge(),
                'isDiscountActive' => $v->isDiscountActive(),
                'sizeIds' => $v->relationLoaded('sizes') ? $v->sizes->pluck('id')->all() : [],
                'sizes' => $v->relationLoaded('sizes') ? $v->sizes->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->all() : [],
            ])->values()->all();
        }
        return $out;
    }

    private function syncVariants(Product $product, array $variants): void
    {
        $seenSkus = [];
        foreach ($variants as $v) {
            $sku = trim((string) ($v['sku'] ?? ''));
            if ($sku === '') {
                throw ValidationException::withMessages(['variants' => ['SKU is required.']]);
            }
            if (in_array($sku, $seenSkus, true)) {
                throw ValidationException::withMessages(['variants' => ["Duplicate SKU: {$sku}"]]);
            }
            $seenSkus[] = $sku;
            $skuCheck = ProductVariant::where('sku', $sku);
            if (! empty($v['id'])) {
                $skuCheck->where('id', '!=', $v['id']);
            }
            if ($skuCheck->exists()) {
                throw ValidationException::withMessages(['variants' => ["SKU already exists: {$sku}"]]);
            }
            if (! empty($v['discountStartAt']) && ! empty($v['discountEndAt'])) {
                if (strtotime((string) $v['discountEndAt']) < strtotime((string) $v['discountStartAt'])) {
                    throw ValidationException::withMessages(['variants' => ["Discount end date must be after start date for SKU {$sku}."]]);
                }
            }
        }

        $existingIds = $product->variants()->pluck('id')->toArray();
        $incomingIds = [];

        foreach ($variants as $payload) {
            $variant = null;
            if (! empty($payload['id'])) {
                $variant = ProductVariant::findOrFail($payload['id']);
                if ($variant->product_id !== $product->id) {
                    throw ValidationException::withMessages(['variants' => ['Variant does not belong to this product.']]);
                }
            } else {
                $variant = new ProductVariant();
                $variant->product_id = $product->id;
            }

            $variant->sku = trim((string) $payload['sku']);
            $variant->price = (float) ($payload['price'] ?? 0);
            $variant->stock = (int) ($payload['stock'] ?? 0);
            $variant->low_stock_threshold = (int) ($payload['lowStockAlert'] ?? 10);
            $variant->discount_type = $payload['discountType'] ?? null;
            $variant->discount_value = (float) ($payload['discountValue'] ?? 0);
            $variant->discount_start_at = $payload['discountStartAt'] ?? null;
            $variant->discount_end_at = $payload['discountEndAt'] ?? null;
            $variant->save();

            $sizeIds = array_values(array_unique($payload['sizeIds'] ?? []));
            $variant->sizes()->sync($sizeIds);

            $attributeValueIds = array_values(array_unique($payload['attributeValueIds'] ?? []));
            $variant->attributes()->detach();
            if (count($attributeValueIds) > 0) {
                $attributeIds = AttributeValue::whereIn('id', $attributeValueIds)
                    ->pluck('attribute_id', 'id')
                    ->toArray();
                foreach ($attributeValueIds as $valueId) {
                    if (isset($attributeIds[$valueId])) {
                        ProductVariantAttribute::create([
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'variant_id' => $variant->id,
                            'value_id' => $valueId,
                            'attribute_id' => $attributeIds[$valueId],
                        ]);
                    }
                }
            }

            $incomingIds[] = $variant->id;
        }

        $toDelete = array_diff($existingIds, $incomingIds);
        if (count($toDelete) > 0) {
            ProductVariant::whereIn('id', $toDelete)->delete();
        }
    }

    private function resolveVendorId(): ?string
    {
        $user = Auth::user();
        if (! $user) {
            return null;
        }

        return strtoupper((string) $user->role) === 'VENDOR' ? ($user->vendor_id ?: null) : null;
    }
}
