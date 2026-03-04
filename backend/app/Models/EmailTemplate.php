<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailTemplate extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'event_type',
        'name',
        'subject',
        'body_html',
        'body_text',
        'available_variables',
        'is_enabled',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'available_variables' => 'array',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(EmailLog::class, 'template_id');
    }

    // Available event types
    public static function getEventTypes(): array
    {
        return [
            'order_created' => 'Order Created',
            'order_processing' => 'Order Processing',
            'order_shipped' => 'Order Shipped',
            'order_in_transit' => 'Order In Transit',
            'order_delivered' => 'Order Delivered',
            'order_cancelled' => 'Order Cancelled',
            'order_canceled' => 'Order Cancelled',
            'order_returned' => 'Order Returned',
            'order_refunded' => 'Order Refunded',
            'vendor_approved' => 'Vendor Approved',
            'incomplete_order_marketing' => 'Incomplete Order Marketing',
        ];
    }

    // Available variables for each event type
    public static function getAvailableVariables(string $eventType): array
    {
        $common = [
            'user_name' => 'User Name',
            'user_email' => 'User Email',
            'order_id' => 'Order ID',
            'order_date' => 'Order Date',
            'order_status' => 'Order Status',
            'total_amount' => 'Total Amount',
            'tracking_link' => 'Tracking Link',
        ];
        if ($eventType === 'vendor_approved') {
            return [
                'vendor_name' => 'Vendor / Business Name',
                'vendor_contact_name' => 'Vendor Contact Name',
                'vendor_email' => 'Vendor Email',
            ];
        }

        $vendorVars = [
            'vendor_name' => 'Vendor / Business Name',
            'vendor_contact_name' => 'Vendor Contact Name',
            'vendor_email' => 'Vendor Email',
        ];

        $specific = match($eventType) {
            'order_created' => [
                'order_items' => 'Order Items List',
                'shipping_address' => 'Shipping Address',
            ],
            'order_shipped' => [
                'tracking_number' => 'Tracking Number',
                'carrier' => 'Carrier Name',
            ],
            'order_in_transit' => [
                'tracking_number' => 'Tracking Number',
                'carrier' => 'Carrier Name',
            ],
            'order_delivered' => [
                'delivery_date' => 'Delivery Date',
            ],
            'vendor_approved' => $vendorVars,
            'incomplete_order_marketing' => [
                'user_name' => 'User Name',
                'user_email' => 'User Email',
                'store_url' => 'Store / Shop URL',
            ],
            default => [],
        };

        return array_merge($common, $specific);
    }
}
