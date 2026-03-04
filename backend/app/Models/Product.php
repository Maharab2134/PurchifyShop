<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'name',
        'description',
        'short_description',
        'slug',
        'sales_count',
        'is_new',
        'is_featured',
        'is_trending',
        'is_best_seller',
        'average_rating',
        'review_count',
        'discount_percent',
        'category_id',
        'vendor_id',
        'brand_id',
        'images',
        'suggested_size_ids',
        'suggested_attribute_value_ids',
        'base_price',
        'discount_type',
        'discount_value',
        'discount_start_at',
        'discount_end_at',
        'status',
        'subcategory_id',
    ];

    protected function casts(): array
    {
        return [
            'is_new' => 'boolean',
            'is_featured' => 'boolean',
            'is_trending' => 'boolean',
            'is_best_seller' => 'boolean',
            'average_rating' => 'float',
            'sales_count' => 'integer',
            'review_count' => 'integer',
            'discount_percent' => 'float',
            'images' => 'array',
        'suggested_size_ids' => 'array',
        'suggested_attribute_value_ids' => 'array',
            'base_price' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'discount_start_at' => 'datetime',
            'discount_end_at' => 'datetime',
        ];
    }

    /**
     * Whether a product-level discount is currently active.
     */
    public function isDiscountActive(): bool
    {
        if (! $this->discount_type || (float) $this->discount_value <= 0) {
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
     * Original price (base_price).
     */
    public function originalPrice(): float
    {
        return (float) ($this->base_price ?? 0);
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
        $val = (float) $this->discount_value;
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
        $val = (float) $this->discount_value;
        if ($this->discount_type === 'percentage') {
            return '-' . round($val) . '%';
        }
        if ($this->discount_type === 'flat') {
            return '৳' . number_format($val, 0) . ' off';
        }
        return null;
    }

    /**
     * Total stock across all variants (inventory).
     */
    public function totalStock(): int
    {
        return (int) $this->variants()->sum('stock');
    }

    /**
     * Product is out of stock when total inventory = 0.
     */
    public function isOutOfStock(): bool
    {
        return $this->totalStock() <= 0;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class, 'product_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function homeSections(): BelongsToMany
    {
        return $this->belongsToMany(HomeSection::class, 'home_section_product')
            ->withPivot('sort_order')
            ->orderByPivot('sort_order')
            ->withTimestamps();
    }
}
