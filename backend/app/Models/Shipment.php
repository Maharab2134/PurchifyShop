<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    use HasUuids;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'order_id',
        'carrier',
        'courier_company',
        'courier_tracking_id',
        'steadfast_consignment_id',
        'dispatch_date',
        'expected_delivery_date',
        'tracking_number',
        'weight',
        'shipped_date',
        'delivery_date',
    ];

    protected function casts(): array
    {
        return [
            'shipped_date' => 'datetime',
            'delivery_date' => 'datetime',
            'dispatch_date' => 'date',
            'expected_delivery_date' => 'date',
            'weight' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
