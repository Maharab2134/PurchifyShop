<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Coupon extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'value',
        'min_purchase',
        'max_discount',
        'valid_from',
        'valid_until',
        'usage_limit',
        'usage_count',
        'is_active',
        'scope',
        ];

    protected function casts(): array
    {
        return [
            'type' => 'string',
            'value' => 'decimal:2',
            'min_purchase' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'valid_from' => 'date',
            'valid_until' => 'date',
            'usage_limit' => 'integer',
            'usage_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_coupons')
            ->withPivot(['is_used', 'order_id', 'used_at'])
            ->withTimestamps();
    }

    public function userCoupons(): HasMany
    {
        return $this->hasMany(UserCoupon::class);
    }

    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }
        $now = now();
        if ($now->lt($this->valid_from) || $now->gt($this->valid_until)) {
            return false;
        }
        if ($this->usage_limit && $this->usage_count >= $this->usage_limit) {
            return false;
        }
        return true;
    }

    public function calculateDiscount(float $amount): float
    {
        if ($amount < $this->min_purchase) {
            return 0;
        }
        if ($this->type === 'PERCENTAGE') {
            $discount = ($amount * $this->value) / 100;
            if ($this->max_discount) {
                $discount = min($discount, $this->max_discount);
            }
            return round($discount, 2);
        }
        return min($this->value, $amount);
    }
}
