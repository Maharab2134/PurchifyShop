<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        // Calculate total revenue: sum of PAID orders only
        // Only orders with PAID payment status should count towards revenue
        $ordersTotal = Order::whereHas('payment', function ($q) {
            $q->where('status', 'PAID');
        })->sum('amount');
        
        $refundedOrdersTotal = Order::whereHas('payment', function ($q) {
            $q->where('status', 'REFUNDED');
        })->sum('amount');
        
        $ordersCount = Order::count();
        $refundedOrdersCount = Order::whereHas('payment', function ($q) {
            $q->where('status', 'REFUNDED');
        })->count();
        $usersCount = User::count();
        $productsCount = Product::count();
        $vendorsCount = Vendor::count();
        $recentOrders = Order::with('user')->orderByDesc('order_date')->limit(10)->get()->map(fn ($o) => [
            'id' => $o->id,
            'userId' => $o->user_id,
            'amount' => (float) $o->amount,
            'orderDate' => $o->order_date?->toIso8601String(),
            'status' => $o->status,
            'user' => $o->relationLoaded('user') && $o->user ? ['id' => $o->user->id, 'name' => $o->user->name, 'email' => $o->user->email] : null,
        ]);

        $days = 30;
        $since = now()->subDays($days);

        // Sales per day: last 3 months, PAID orders only, grouped by date
        $salesPerDaySince = now()->subMonths(3);
        $salesPerDay = Order::whereHas('payment', function ($q) {
            $q->where('status', 'PAID');
        })
            ->where('order_date', '>=', $salesPerDaySince)
            ->select(DB::raw('DATE(order_date) as date'), DB::raw('SUM(amount) as sales'))
            ->groupBy(DB::raw('DATE(order_date)'))
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'sales' => (float) $r->sales])
            ->values()
            ->all();

        // Most sold products: top 10 by quantity from order_items (PAID orders only)
        $mostSoldProducts = [];
        if (\Schema::hasTable('order_items')) {
            $mostSoldProducts = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('payments', 'orders.id', '=', 'payments.order_id')
                ->join('product_variants', 'order_items.variant_id', '=', 'product_variants.id')
                ->join('products', 'product_variants.product_id', '=', 'products.id')
                ->where('payments.status', 'PAID')
                ->select('products.id as product_id', 'products.name as product_name', DB::raw('SUM(order_items.quantity) as total_quantity'))
                ->groupBy('products.id', 'products.name')
                ->orderByDesc('total_quantity')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'productId' => $r->product_id,
                    'productName' => $r->product_name,
                    'totalQuantity' => (int) $r->total_quantity,
                ])
                ->values()
                ->all();
        }

        // Popular customers: top 10 by order count (PAID orders)
        $popularCustomersRows = Order::whereHas('payment', function ($q) {
            $q->where('status', 'PAID');
        })
            ->select('user_id', DB::raw('COUNT(*) as order_count'), DB::raw('SUM(amount) as total_spent'))
            ->groupBy('user_id')
            ->orderByDesc('order_count')
            ->limit(10)
            ->get();
        $userIds = $popularCustomersRows->pluck('user_id')->filter()->unique()->values()->all();
        $users = $userIds ? User::whereIn('id', $userIds)->get()->keyBy('id') : collect();
        $popularCustomers = $popularCustomersRows->map(function ($r) use ($users) {
            $user = $r->user_id ? $users->get($r->user_id) : null;
            return [
                'userId' => $r->user_id,
                'name' => $user?->name ?? 'Guest',
                'email' => $user?->email ?? '—',
                'orderCount' => (int) $r->order_count,
                'totalSpent' => (float) $r->total_spent,
            ];
        })->values()->all();

        // Low stock variants: stock <= low_stock_threshold (for dashboard warning)
        $lowStockItems = [];
        if (\Schema::hasTable('product_variants')) {
            $lowStockItems = ProductVariant::where('low_stock_threshold', '>', 0)
                ->whereColumn('stock', '<=', 'low_stock_threshold')
                ->with('product:id,name,slug')
                ->orderBy('stock')
                ->limit(50)
                ->get()
                ->map(fn ($v) => [
                    'variantId' => $v->id,
                    'productId' => $v->product_id,
                    'productName' => $v->relationLoaded('product') && $v->product ? $v->product->name : '—',
                    'sku' => $v->sku,
                    'stock' => (int) $v->stock,
                    'lowStockThreshold' => (int) $v->low_stock_threshold,
                ])
                ->values()
                ->all();
        }

        $dailyVisitors = [];
        $dailyPageViews = [];
        $topPages = [];

        if (\Schema::hasTable('page_views')) {
            $dailyVisitors = DB::table('page_views')
                ->where('viewed_at', '>=', $since)
                ->select(DB::raw('DATE(viewed_at) as date'), DB::raw('COUNT(DISTINCT session_id) as visitors'))
                ->groupBy(DB::raw('DATE(viewed_at)'))
                ->orderBy('date')
                ->get()
                ->map(fn ($r) => ['date' => $r->date, 'visitors' => (int) $r->visitors])
                ->values()
                ->all();

            $dailyPageViews = DB::table('page_views')
                ->where('viewed_at', '>=', $since)
                ->select(DB::raw('DATE(viewed_at) as date'), DB::raw('COUNT(*) as views'))
                ->groupBy(DB::raw('DATE(viewed_at)'))
                ->orderBy('date')
                ->get()
                ->map(fn ($r) => ['date' => $r->date, 'views' => (int) $r->views])
                ->values()
                ->all();

            $topPages = DB::table('page_views')
                ->where('viewed_at', '>=', $since)
                ->select('path', DB::raw('COUNT(*) as views'))
                ->groupBy('path')
                ->orderByDesc('views')
                ->limit(15)
                ->get()
                ->map(fn ($r) => ['path' => $r->path, 'views' => (int) $r->views])
                ->values()
                ->all();
        }

        return response()->json([
            'data' => [
                'ordersTotal' => round($ordersTotal, 2),
                'ordersCount' => $ordersCount,
                'refundedOrdersTotal' => round($refundedOrdersTotal, 2),
                'refundedOrdersCount' => $refundedOrdersCount,
                'usersCount' => $usersCount,
                'productsCount' => $productsCount,
                'vendorsCount' => $vendorsCount,
                'recentOrders' => $recentOrders,
                'salesPerDay' => $salesPerDay,
                'mostSoldProducts' => $mostSoldProducts,
                'popularCustomers' => $popularCustomers,
                'lowStockItems' => $lowStockItems,
                'visitors' => [
                    'dailyVisitors' => $dailyVisitors,
                    'dailyPageViews' => $dailyPageViews,
                    'topPages' => $topPages,
                    'days' => $days,
                ],
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/analytics/top-pages/clear
     * Clears browsing data used for top pages (page_views).
     */
    public function clearTopPages(): JsonResponse
    {
        if (\Schema::hasTable('page_views')) {
            DB::table('page_views')->truncate();
        }
        if (\Schema::hasTable('ip_locations')) {
            DB::table('ip_locations')->truncate();
        }

        return response()->json(['message' => 'Top pages cleared']);
    }
}
