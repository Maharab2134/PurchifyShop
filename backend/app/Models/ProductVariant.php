<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'product_id',
        'sku',
        'images',
        'price',
        'stock',
        'discount_percent',
        'discount_type',
        'discount_value',
        'discount_start_at',
        'discount_end_at',
        'low_stock_threshold',
        'barcode',
        'warehouse_location',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'price' => 'decimal:2',
            'stock' => 'integer',
            'discount_percent' => 'float',
            'discount_value' => 'decimal:2',
            'discount_start_at' => 'datetime',
            'discount_end_at' => 'datetime',
            'low_stock_threshold' => 'integer',
        ];
    }

    /**
     * Whether this variant's discount is currently active.
     */
    public function isDiscountActive(): bool
    {
        if (! $this->discount_type || (float) ($this->discount_value ?? 0) <= 0) {
            return false;
        }
        $now = now();
        if ($this->discount_start_at && $now->lt($this->discount_start_at)) {
            return false;
        }
        if ($this->discount_end_at && $now->gt($this->discount_end_at)) {
            return false;
        }
        return true;
    }

    /**
     * Original price (variant price).
     */
    public function originalPrice(): float
    {
        return (float) ($this->price ?? 0);
    }

    /**
     * Discounted price. Uses discount_type + discount_value when active.
     */
    public function discountedPrice(): float
    {
        $base = $this->originalPrice();
        if (! $this->isDiscountActive()) {
            return $base;
        }
        $val = (float) ($this->discount_value ?? 0);
        if ($this->discount_type === 'percentage') {
            return max(0, $base - ($base * $val / 100));
        }
        if ($this->discount_type === 'flat') {
            return max(0, $base - $val);
        }
        return $base;
    }

    /**
     * Discount badge string, e.g. "-20%" or "৳50 off".
     */
    public function discountBadge(): ?string
    {
        if (! $this->isDiscountActive()) {
            return null;
        }
        $val = (float) ($this->discount_value ?? 0);
        if ($this->discount_type === 'percentage') {
            return '-'.round($val).'%';
        }
        if ($this->discount_type === 'flat') {
            return '৳'.number_format($val, 0).' off';
        }
        return null;
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function sizes(): BelongsToMany
    {
        return $this->belongsToMany(Size::class, 'product_variant_sizes', 'product_variant_id', 'size_id');
    }

    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(AttributeValue::class, 'product_variant_attributes', 'variant_id', 'value_id')
            ->using(ProductVariantAttribute::class)
            ->withPivot('attribute_id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'variant_id');
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class, 'variant_id');
    }

    /**
     * Add stock (restock). Updates current stock and touches updated_at.
     */
    public function addStock(int $quantity): void
    {
        if ($quantity <= 0) {
            return;
        }
        $this->increment('stock', $quantity);
        $this->touch();
    }

    /**
     * Reduce stock (order/damage). Prevents negative stock.
     *
     * @return bool true if reduced, false if insufficient stock
     */
    public function reduceStock(int $quantity): bool
    {
        if ($quantity <= 0) {
            return true;
        }
        $current = (int) $this->stock;
        if ($current < $quantity) {
            return false;
        }
        $this->decrement('stock', $quantity);
        $this->touch();
        return true;
    }

    /**
     * Whether this inventory item is low stock.
     */
    public function isLowStock(): bool
    {
        $threshold = (int) ($this->low_stock_threshold ?? 0);
        return $threshold > 0 && (int) $this->stock <= $threshold;
    }
}
