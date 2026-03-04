<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ProductVariantAttribute extends Pivot
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $table = 'product_variant_attributes';

    protected $fillable = [
        'variant_id',
        'attribute_id',
        'value_id',
    ];

    public $timestamps = false;

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
