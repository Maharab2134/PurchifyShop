<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use App\Models\AttributeValue;
use App\Models\ProductVariantAttribute;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VariantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = ProductVariant::with(['product', 'sizes', 'attributes.attribute']);
        if ($request->filled('productId')) {
            $q->where('product_id', $request->input('productId'));
        }
        if ($request->boolean('unassignedOnly')) {
            $q->whereNull('product_id');
        }
        $variants = $q->orderBy('sku')->paginate($request->input('limit', 50));
        $data = $variants->getCollection()->map(fn ($v) => $this->resource($v));
        return response()->json(['data' => ['variants' => $data, 'totalResults' => $variants->total()]]);
    }

    public function show(string $id): JsonResponse
    {
        $v = ProductVariant::with(['product', 'sizes', 'attributes.attribute'])->findOrFail($id);
        return response()->json(['data' => $this->resource($v)]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'productId' => ['nullable', 'uuid', 'exists:products,id'],
            'sku' => ['required', 'string', 'unique:product_variants,sku'],
            'stock' => ['required', 'integer', 'min:0'],
            'lowStockAlert' => ['nullable', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
            'discountType' => ['nullable', 'string', 'in:percentage,flat'],
            'discountValue' => ['nullable', 'numeric', 'min:0'],
            'discountStartAt' => ['nullable', 'date'],
            'discountEndAt' => ['nullable', 'date', 'after_or_equal:discountStartAt'],
            'sizeIds' => ['nullable', 'array'],
            'sizeIds.*' => ['uuid', 'exists:sizes,id'],
            'attributeValueIds' => ['nullable', 'array'],
            'attributeValueIds.*' => ['uuid', 'exists:attribute_values,id'],
        ]);
        $v = ProductVariant::create([
            'product_id' => $validated['productId'] ?? null,
            'sku' => $validated['sku'],
            'price' => (float) $validated['price'],
            'stock' => (int) $validated['stock'],
            'low_stock_threshold' => (int) ($validated['lowStockAlert'] ?? 10),
            'discount_percent' => 0,
            'discount_type' => $validated['discountType'] ?? null,
            'discount_value' => (float) ($validated['discountValue'] ?? 0),
            'discount_start_at' => $validated['discountStartAt'] ?? null,
            'discount_end_at' => $validated['discountEndAt'] ?? null,
            'images' => [],
        ]);
        $sizeIds = array_values(array_unique($validated['sizeIds'] ?? []));
        if (count($sizeIds) > 0) {
            $v->sizes()->sync($sizeIds);
        }
        
        // Sync attributes
        $attributeValueIds = array_values(array_unique($validated['attributeValueIds'] ?? []));
        // Detach all first
        $v->attributes()->detach();
        // Attach with UUID generation
        if (count($attributeValueIds) > 0) {
            $attributeIds = AttributeValue::whereIn('id', $attributeValueIds)
                ->pluck('attribute_id', 'id')
                ->toArray();
            foreach ($attributeValueIds as $valueId) {
                if (isset($attributeIds[$valueId])) {
                    ProductVariantAttribute::create([
                        'id' => \Illuminate\Support\Str::uuid()->toString(),
                        'variant_id' => $v->id,
                        'value_id' => $valueId,
                        'attribute_id' => $attributeIds[$valueId],
                    ]);
                }
            }
        }
        
        $v->load(['product', 'sizes', 'attributes.attribute']);
        return response()->json(['message' => 'Variant created', 'data' => $this->resource($v)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $v = ProductVariant::findOrFail($id);
        $validated = $request->validate([
            'sku' => ['sometimes', 'string', 'unique:product_variants,sku,'.$id],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'lowStockAlert' => ['nullable', 'integer', 'min:0'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'discountType' => ['nullable', 'string', 'in:percentage,flat'],
            'discountValue' => ['nullable', 'numeric', 'min:0'],
            'discountStartAt' => ['nullable', 'date'],
            'discountEndAt' => ['nullable', 'date', 'after_or_equal:discountStartAt'],
            'sizeIds' => ['nullable', 'array'],
            'sizeIds.*' => ['uuid', 'exists:sizes,id'],
            'attributeValueIds' => ['nullable', 'array'],
            'attributeValueIds.*' => ['uuid', 'exists:attribute_values,id'],
        ]);
        $updates = [];
        if (array_key_exists('sku', $validated)) {
            $updates['sku'] = $validated['sku'];
        }
        if (array_key_exists('stock', $validated)) {
            $updates['stock'] = (int) $validated['stock'];
        }
        if (array_key_exists('lowStockAlert', $validated)) {
            $updates['low_stock_threshold'] = (int) $validated['lowStockAlert'];
        }
        if (array_key_exists('price', $validated)) {
            $updates['price'] = (float) $validated['price'];
        }
        if (array_key_exists('discountType', $validated)) {
            $updates['discount_type'] = $validated['discountType'];
        }
        if (array_key_exists('discountValue', $validated)) {
            $updates['discount_value'] = (float) $validated['discountValue'];
        }
        if (array_key_exists('discountStartAt', $validated)) {
            $updates['discount_start_at'] = $validated['discountStartAt'];
        }
        if (array_key_exists('discountEndAt', $validated)) {
            $updates['discount_end_at'] = $validated['discountEndAt'];
        }
        $v->update($updates);
        if (array_key_exists('sizeIds', $validated)) {
            $v->sizes()->sync(array_values(array_unique($validated['sizeIds'] ?? [])));
        }
        
        // Sync attributes
        if (array_key_exists('attributeValueIds', $validated)) {
            $attributeValueIds = array_values(array_unique($validated['attributeValueIds'] ?? []));
            // Detach all first
            $v->attributes()->detach();
            // Attach with UUID generation
            if (count($attributeValueIds) > 0) {
                $attributeIds = AttributeValue::whereIn('id', $attributeValueIds)
                    ->pluck('attribute_id', 'id')
                    ->toArray();
                foreach ($attributeValueIds as $valueId) {
                    if (isset($attributeIds[$valueId])) {
                        ProductVariantAttribute::create([
                            'id' => \Illuminate\Support\Str::uuid()->toString(),
                            'variant_id' => $v->id,
                            'value_id' => $valueId,
                            'attribute_id' => $attributeIds[$valueId],
                        ]);
                    }
                }
            }
        }
        
        $v->load(['product', 'sizes', 'attributes.attribute']);
        return response()->json(['message' => 'Variant updated', 'data' => $this->resource($v->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $v = ProductVariant::findOrFail($id);
        $v->delete();
        return response()->json(['message' => 'Variant deleted']);
    }

    /**
     * POST /admin/variants/{id}/add-stock
     * Body: { quantity }
     */
    public function addStock(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate(['quantity' => ['required', 'integer', 'min:1']]);
        $v = ProductVariant::findOrFail($id);
        $v->addStock((int) $validated['quantity']);
        $v->load('product', 'sizes');
        return response()->json(['message' => 'Stock added', 'data' => $this->resource($v->fresh())]);
    }

    /**
     * POST /admin/variants/{id}/reduce-stock
     * Body: { quantity, reason? }
     */
    public function reduceStock(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:100'],
        ]);
        $v = ProductVariant::findOrFail($id);
        $qty = (int) $validated['quantity'];
        if ($v->stock < $qty) {
            return response()->json([
                'message' => 'Insufficient stock. Current: ' . $v->stock . ', requested: ' . $qty,
            ], 422);
        }
        $v->reduceStock($qty);
        $v->load('product', 'sizes');
        return response()->json(['message' => 'Stock reduced', 'data' => $this->resource($v->fresh())]);
    }

    private function resource(ProductVariant $v): array
    {
        $sizes = $v->relationLoaded('sizes') ? $v->sizes->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])->values()->all() : [];
        
        // Group attributes by attribute name
        $attributes = [];
        if ($v->relationLoaded('attributes')) {
            $grouped = $v->attributes->groupBy(function ($av) {
                return $av->attribute->name ?? 'Unknown';
            });
            foreach ($grouped as $attrName => $values) {
                $attributes[] = [
                    'name' => $attrName,
                    'values' => $values->map(fn ($av) => [
                        'id' => $av->id,
                        'value' => $av->value,
                        'attributeId' => $av->attribute_id,
                    ])->values()->all(),
                ];
            }
        }
        
        return [
            'id' => $v->id,
            'productId' => $v->product_id,
            'sizeIds' => array_column($sizes, 'id'),
            'sku' => $v->sku,
            'stock' => $v->stock,
            'lowStockAlert' => (int) ($v->low_stock_threshold ?? 0),
            'lastUpdated' => $v->updated_at?->toIso8601String(),
            'isLowStock' => $v->isLowStock(),
            'price' => (float) ($v->price ?? 0),
            'discountType' => $v->discount_type,
            'discountValue' => (float) ($v->discount_value ?? 0),
            'discountStartAt' => $v->discount_start_at?->toIso8601String(),
            'discountEndAt' => $v->discount_end_at?->toIso8601String(),
            'originalPrice' => $v->originalPrice(),
            'discountedPrice' => $v->discountedPrice(),
            'discountBadge' => $v->discountBadge(),
            'isDiscountActive' => $v->isDiscountActive(),
            'product' => $v->relationLoaded('product') && $v->product
                ? ['id' => $v->product->id, 'name' => $v->product->name]
                : null,
            'sizes' => $sizes,
            'attributes' => $attributes,
            'attributeValueIds' => $v->relationLoaded('attributes') ? $v->attributes->pluck('id')->all() : [],
        ];
    }
}
