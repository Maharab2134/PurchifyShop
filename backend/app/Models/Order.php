<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'user_id',
        'tracking_number',
        'amount',
        'shipping_option_id',
        'shipping_amount',
        'order_date',
        'status',
        'contact_phone',
        'parcel_weight',
    ];

    protected function casts(): array
    {
        return [
            'order_date' => 'datetime',
            'amount' => 'decimal:2',
            'shipping_amount' => 'decimal:2',
            'parcel_weight' => 'decimal:2',
        ];
    }

    public function shippingOption(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(ShippingOption::class, 'shipping_option_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function payment(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function address(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Address::class);
    }

    public function shipment(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Shipment::class);
    }

    public function transaction(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Transaction::class);
    }

    public function userCoupon(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserCoupon::class);
    }
}
