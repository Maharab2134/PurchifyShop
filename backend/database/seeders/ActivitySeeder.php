<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class ActivitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Populates the `logs` table for Admin Dashboard "Recent Activities".
     */
    public function run(): void
    {
        if (! \Illuminate\Support\Facades\Schema::hasTable('logs')) {
            return;
        }

        $activities = [
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'New order #ORD-001 placed by John Doe',
                'context' => json_encode(['orderId' => 'ORD-001', 'amount' => 1299.99]),
                'created_at' => Carbon::now()->subHours(2),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'Product "Wireless Headphones" inventory updated',
                'context' => json_encode(['productId' => 1, 'stock' => 45]),
                'created_at' => Carbon::now()->subHours(3),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'success',
                'message' => 'Order #ORD-001 shipped with tracking ID TRK123456',
                'context' => json_encode(['orderId' => 'ORD-001', 'trackingId' => 'TRK123456']),
                'created_at' => Carbon::now()->subHours(4),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'New user "Jane Smith" registered',
                'context' => json_encode(['userId' => 123, 'email' => 'jane@example.com']),
                'created_at' => Carbon::now()->subHours(5),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'warning',
                'message' => 'Low inventory alert for "USB Cable" (5 units left)',
                'context' => json_encode(['productId' => 5, 'stock' => 5]),
                'created_at' => Carbon::now()->subHours(6),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'New order #ORD-002 placed by Mike Johnson',
                'context' => json_encode(['orderId' => 'ORD-002', 'amount' => 599.99]),
                'created_at' => Carbon::now()->subHours(7),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'Payment processed for order #ORD-002',
                'context' => json_encode(['orderId' => 'ORD-002', 'paymentId' => 'PAY-001']),
                'created_at' => Carbon::now()->subHours(8),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'New vendor "Tech Store" onboarded',
                'context' => json_encode(['vendorId' => 42, 'vendorName' => 'Tech Store']),
                'created_at' => Carbon::now()->subHours(9),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'Order #ORD-001 delivered successfully',
                'context' => json_encode(['orderId' => 'ORD-001']),
                'created_at' => Carbon::now()->subHours(10),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'warning',
                'message' => 'Failed payment attempt for order #ORD-003',
                'context' => json_encode(['orderId' => 'ORD-003', 'reason' => 'Card declined']),
                'created_at' => Carbon::now()->subHours(11),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'Customer review added for "Wireless Headphones" (5 stars)',
                'context' => json_encode(['productId' => 1, 'rating' => 5]),
                'created_at' => Carbon::now()->subHours(12),
            ],
            [
                'id' => (string) Str::uuid(),
                'level' => 'info',
                'message' => 'Coupon "SAVE20" created with 20% discount',
                'context' => json_encode(['couponId' => 'SAVE20', 'discount' => 20]),
                'created_at' => Carbon::now()->subHours(13),
            ],
        ];

        DB::table('logs')->insert($activities);
    }
}
